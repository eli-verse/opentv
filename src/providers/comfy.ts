import { loadSettings } from '../settings'
import type { GenerateResult, Provider } from './types'

/**
 * Local ComfyUI backend. OpenTV is the creator-facing canvas; ComfyUI is the
 * headless execution engine that already knows how to run every open-source
 * image/video model. In dev the vite proxy maps /comfy -> 127.0.0.1:8188.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Built-in text-to-image workflow (API format), works with any checkpoint. */
const T2I_TEMPLATE = {
  '3': {
    class_type: 'KSampler',
    inputs: {
      seed: '{{seed}}',
      steps: 20,
      cfg: 7,
      sampler_name: 'euler',
      scheduler: 'normal',
      denoise: 1,
      model: ['4', 0],
      positive: ['6', 0],
      negative: ['7', 0],
      latent_image: ['5', 0],
    },
  },
  '4': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: '{{checkpoint}}' } },
  '5': { class_type: 'EmptyLatentImage', inputs: { width: 1024, height: 576, batch_size: 1 } },
  '6': { class_type: 'CLIPTextEncode', inputs: { text: '{{prompt}}', clip: ['4', 1] } },
  '7': { class_type: 'CLIPTextEncode', inputs: { text: 'blurry, low quality', clip: ['4', 1] } },
  '8': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
  '9': { class_type: 'SaveImage', inputs: { filename_prefix: 'opentv', images: ['8', 0] } },
}

function substitute(template: unknown, vars: Record<string, string | number>): any {
  const json = JSON.stringify(template).replace(/"\{\{(\w+)\}\}"|\{\{(\w+)\}\}/g, (m, quoted, bare) => {
    const key = quoted ?? bare
    if (!(key in vars)) return m
    const v = vars[key]
    return quoted !== undefined ? JSON.stringify(v) : String(v)
  })
  return JSON.parse(json)
}

async function firstCheckpoint(base: string): Promise<string> {
  const res = await fetch(`${base}/object_info/CheckpointLoaderSimple`)
  if (!res.ok) throw new Error('无法读取 ComfyUI 模型列表')
  const info = await res.json()
  const names: string[] =
    info?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] ?? []
  if (!names.length) throw new Error('ComfyUI 没有可用的 checkpoint 模型')
  return names[0]
}

export const comfyProvider: Provider = {
  id: 'comfy',
  async generate({ model, prompt, imageUrl, onStatus }): Promise<GenerateResult> {
    const settings = loadSettings()
    const base = settings.comfyUrl.replace(/\/$/, '')

    onStatus?.('连接本地 ComfyUI…')
    let workflow: any
    const vars: Record<string, string | number> = {
      prompt: prompt,
      seed: Math.floor(Math.random() * 1e15),
    }

    if (model.kind === 't2i') {
      vars.checkpoint = settings.comfyCheckpoint || (await firstCheckpoint(base))
      workflow = substitute(T2I_TEMPLATE, vars)
    } else {
      if (!settings.comfyT2vWorkflow.trim())
        throw new Error(
          '未配置视频工作流：在 ComfyUI 里跑通 Wan/LTX 等模板后导出 API 格式 JSON，把提示词替换为 {{prompt}}，粘贴到 ⚙ 设置'
        )
      if (imageUrl) vars.image = imageUrl
      try {
        workflow = substitute(JSON.parse(settings.comfyT2vWorkflow), vars)
      } catch (e) {
        throw new Error('视频工作流 JSON 解析失败，请检查 ⚙ 设置')
      }
    }

    const clientId = `opentv-${Math.random().toString(36).slice(2)}`
    const submit = await fetch(`${base}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow, client_id: clientId }),
    })
    if (!submit.ok) {
      const text = await submit.text()
      throw new Error(`ComfyUI 提交失败: ${text.slice(0, 200)}`)
    }
    const { prompt_id } = await submit.json()

    onStatus?.('本地生成中…')
    for (let i = 0; i < 2400; i++) {
      await sleep(1500)
      const res = await fetch(`${base}/history/${prompt_id}`)
      if (!res.ok) continue
      const history = await res.json()
      const entry = history?.[prompt_id]
      if (!entry) continue
      if (entry.status?.status_str === 'error') {
        const msg = JSON.stringify(entry.status?.messages ?? '').slice(0, 200)
        throw new Error(`ComfyUI 执行出错: ${msg}`)
      }
      const outputs = entry.outputs ?? {}
      for (const nodeId of Object.keys(outputs)) {
        const out = outputs[nodeId]
        const files = out.videos ?? out.gifs ?? out.images ?? []
        if (files.length) {
          const f = files[0]
          const url = `${base}/view?filename=${encodeURIComponent(f.filename)}&subfolder=${encodeURIComponent(
            f.subfolder ?? ''
          )}&type=${f.type ?? 'output'}`
          const isVideo = /\.(mp4|webm|mov|gif)$/i.test(f.filename) || out.videos || out.gifs
          return { mediaType: isVideo ? 'video' : 'image', url }
        }
      }
    }
    throw new Error('ComfyUI 生成超时')
  },
}
