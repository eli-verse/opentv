export interface Settings {
  falKey: string
  comfyUrl: string
  /** ComfyUI checkpoint name for the built-in t2i workflow. Empty = auto-detect. */
  comfyCheckpoint: string
  /** User-pasted ComfyUI workflow (API format) for text-to-video, with {{prompt}} / {{seed}} placeholders. */
  comfyT2vWorkflow: string
}

const KEY = 'opentv:settings'

const DEFAULTS: Settings = {
  falKey: '',
  comfyUrl: '/comfy',
  comfyCheckpoint: '',
  comfyT2vWorkflow: '',
}

export function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s))
}
