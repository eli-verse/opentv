import { comfyProvider } from './comfy'
import { falProvider } from './fal'
import { mockProvider } from './mock'
import type { ModelSpec, Provider } from './types'

export const MODELS: ModelSpec[] = [
  // Local, open-source models via ComfyUI — the heart of OpenTV.
  { id: 'comfy/t2i', name: '本地出图 · ComfyUI', kind: 't2i', provider: 'comfy' },
  { id: 'comfy/t2v', name: '本地视频 · ComfyUI', kind: 't2v', provider: 'comfy' },
  // Cloud fallback for machines without a GPU.
  { id: 'fal-ai/flux/schnell', name: 'FLUX schnell · fal', kind: 't2i', provider: 'fal' },
  { id: 'fal-ai/wan-t2v', name: 'Wan 文生视频 · fal', kind: 't2v', provider: 'fal' },
  { id: 'fal-ai/wan-i2v', name: 'Wan 图生视频 · fal', kind: 'i2v', provider: 'fal' },
  { id: 'fal-ai/kling-video/v2.1/standard/text-to-video', name: 'Kling 2.1 · fal', kind: 't2v', provider: 'fal' },
  // Zero-dependency mock so the canvas is playable out of the box.
  { id: 'mock/image', name: 'Mock 图像（离线）', kind: 't2i', provider: 'mock' },
  { id: 'mock/video', name: 'Mock 视频（离线）', kind: 't2v', provider: 'mock' },
  { id: 'mock/i2v', name: 'Mock 图生视频（离线）', kind: 'i2v', provider: 'mock' },
]

const PROVIDERS: Record<string, Provider> = {
  mock: mockProvider,
  fal: falProvider,
  comfy: comfyProvider,
}

export function getModel(id: string): ModelSpec {
  return MODELS.find((m) => m.id === id) ?? MODELS[MODELS.length - 1]
}

export function getProvider(model: ModelSpec): Provider {
  return PROVIDERS[model.provider]
}
