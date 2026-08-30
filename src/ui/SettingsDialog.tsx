import { useState } from 'react'
import { loadSettings, saveSettings, type Settings } from '../settings'

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const patch = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }))
  const save = () => {
    saveSettings(settings)
    onClose()
  }
  return (
    <div className="otv-modal-backdrop" onClick={onClose}>
      <div className="otv-modal" onClick={(e) => e.stopPropagation()}>
        <h2>设置</h2>
        <label>
          fal API Key（云端生成，可选）
          <input
            type="password"
            value={settings.falKey}
            placeholder="fal.ai 控制台获取"
            onChange={(e) => patch({ falKey: e.currentTarget.value })}
          />
        </label>
        <label>
          ComfyUI 地址（本地生成）
          <input
            type="text"
            value={settings.comfyUrl}
            placeholder="/comfy（默认代理到 127.0.0.1:8188）"
            onChange={(e) => patch({ comfyUrl: e.currentTarget.value })}
          />
        </label>
        <label>
          ComfyUI checkpoint（出图用，留空自动选第一个）
          <input
            type="text"
            value={settings.comfyCheckpoint}
            placeholder="sd_xl_base_1.0.safetensors"
            onChange={(e) => patch({ comfyCheckpoint: e.currentTarget.value })}
          />
        </label>
        <label>
          本地视频工作流（ComfyUI API 格式 JSON，提示词写成 {'{{prompt}}'}）
          <textarea
            rows={6}
            value={settings.comfyT2vWorkflow}
            placeholder='在 ComfyUI 跑通 Wan / LTX-Video 模板后，导出 API 格式粘贴到这里'
            onChange={(e) => patch({ comfyT2vWorkflow: e.currentTarget.value })}
          />
        </label>
        <div className="otv-modal-actions">
          <button onClick={onClose}>取消</button>
          <button className="otv-primary" onClick={save}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
