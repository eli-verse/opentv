export type ModelKind = 't2i' | 't2v' | 'i2v'

export interface ModelSpec {
  /** Unique id, also the remote model id where applicable (e.g. fal model id). */
  id: string
  name: string
  kind: ModelKind
  provider: 'mock' | 'fal' | 'comfy'
}

export interface GenerateRequest {
  model: ModelSpec
  prompt: string
  /** Source image (url or data url) for i2v models. */
  imageUrl?: string
  onStatus?: (message: string) => void
}

export interface GenerateResult {
  mediaType: 'image' | 'video'
  url: string
}

export interface Provider {
  id: string
  generate(req: GenerateRequest): Promise<GenerateResult>
}
