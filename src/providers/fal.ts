import { fal } from '@fal-ai/client'
import { loadSettings } from '../settings'
import type { GenerateResult, Provider } from './types'

/** Find the first media url in a fal result payload, whatever the model's schema. */
function extractMedia(data: any): GenerateResult | null {
  if (data?.video?.url) return { mediaType: 'video', url: data.video.url }
  if (Array.isArray(data?.videos) && data.videos[0]?.url)
    return { mediaType: 'video', url: data.videos[0].url }
  if (Array.isArray(data?.images) && data.images[0]?.url)
    return { mediaType: 'image', url: data.images[0].url }
  if (data?.image?.url) return { mediaType: 'image', url: data.image.url }
  return null
}

export const falProvider: Provider = {
  id: 'fal',
  async generate({ model, prompt, imageUrl, onStatus }): Promise<GenerateResult> {
    const { falKey } = loadSettings()
    if (!falKey) throw new Error('未配置 fal API Key（右上角 ⚙ 设置）')
    fal.config({ credentials: falKey })

    const input: Record<string, unknown> = { prompt }
    if (model.kind === 'i2v') {
      if (!imageUrl) throw new Error('图生视频需要连接一张图片卡片')
      input.image_url = imageUrl
    }

    onStatus?.('已提交 fal…')
    const result = await fal.subscribe(model.id, {
      input,
      logs: true,
      onQueueUpdate(update) {
        if (update.status === 'IN_QUEUE') onStatus?.('fal 排队中…')
        else if (update.status === 'IN_PROGRESS') onStatus?.('fal 生成中…')
      },
    })
    const media = extractMedia(result.data)
    if (!media) throw new Error('fal 返回中未找到媒体结果')
    return media
  },
}
