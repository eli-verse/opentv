import { createShapeId, type Editor, getSnapshot, loadSnapshot } from 'tldraw'
import { GEN_CARD } from '../shapes/GenCardUtil'
import { MEDIA_CARD } from '../shapes/MediaCardUtil'
import { PROMPT_CARD } from '../shapes/PromptCardUtil'

function spawnPoint(editor: Editor) {
  const center = editor.getViewportPageBounds().center
  const jitter = () => (Math.random() - 0.5) * 80
  return { x: center.x - 150 + jitter(), y: center.y - 100 + jitter() }
}

export function Toolbar({ editor, onOpenSettings }: { editor: Editor; onOpenSettings: () => void }) {
  const addGen = () => {
    const { x, y } = spawnPoint(editor)
    editor.createShape({ id: createShapeId(), type: GEN_CARD, x, y })
  }
  const addNote = () => {
    const { x, y } = spawnPoint(editor)
    editor.createShape({ id: createShapeId(), type: PROMPT_CARD, x, y })
  }
  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const { x, y } = spawnPoint(editor)
        editor.createShape({
          id: createShapeId(),
          type: MEDIA_CARD,
          x,
          y,
          props: { mediaType: 'image', src: String(reader.result), label: file.name, w: 360, h: 240 },
        })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }
  const exportProject = () => {
    const snapshot = getSnapshot(editor.store)
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `opentv-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      loadSnapshot(editor.store, JSON.parse(await file.text()))
    }
    input.click()
  }

  return (
    <div className="otv-toolbar">
      <span className="otv-logo">OpenTV</span>
      <button className="otv-btn-primary" onClick={addGen}>＋ 生成卡</button>
      <button onClick={addNote}>＋ 便签</button>
      <button onClick={addImage}>＋ 图片</button>
      <span className="otv-toolbar-sep" />
      <button onClick={exportProject}>导出</button>
      <button onClick={importProject}>导入</button>
      <button onClick={onOpenSettings}>⚙</button>
    </div>
  )
}
