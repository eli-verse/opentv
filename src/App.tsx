import { useEffect, useState } from 'react'
import { createShapeId, Tldraw, useValue, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { GEN_CARD, GenCardUtil } from './shapes/GenCardUtil'
import { MEDIA_CARD, MediaCardUtil } from './shapes/MediaCardUtil'
import { PromptCardUtil } from './shapes/PromptCardUtil'
import { CanvasToolbar } from './ui/CanvasToolbar'
import { IconCard, IconPlus } from './ui/icons'
import { SettingsDialog } from './ui/SettingsDialog'
import { Toolbar } from './ui/Toolbar'

const shapeUtils = [PromptCardUtil, MediaCardUtil, GenCardUtil]
const components = { Toolbar: CanvasToolbar, StylePanel: null, MenuPanel: null }

/** Centered "double-click to start" pill, shown while the canvas is empty. */
function EmptyGuide({ editor }: { editor: Editor }) {
  const count = useValue('shape-count', () => editor.getCurrentPageShapeIds().size, [editor])
  if (count > 0) return null
  return (
    <div className="otv-guide">
      <b>双击画布</b> <span>开始创作</span>
    </div>
  )
}

function Lightbox() {
  const [media, setMedia] = useState<{ src: string; mediaType: string } | null>(null)
  useEffect(() => {
    const onView = (e: Event) => setMedia((e as CustomEvent).detail)
    window.addEventListener('otv:view', onView)
    return () => window.removeEventListener('otv:view', onView)
  }, [])
  if (!media) return null
  return (
    <div className="otv-lightbox" onClick={() => setMedia(null)}>
      {media.mediaType === 'video' ? (
        <video src={media.src} controls autoPlay loop onClick={(e) => e.stopPropagation()} />
      ) : (
        <img src={media.src} />
      )}
    </div>
  )
}

function Toast() {
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent).detail)
      clearTimeout(timer)
      timer = setTimeout(() => setMessage(null), 3000)
    }
    window.addEventListener('otv:toast', onToast)
    return () => {
      window.removeEventListener('otv:toast', onToast)
      clearTimeout(timer)
    }
  }, [])
  if (!message) return null
  return <div className="otv-toast">{message}</div>
}

interface PickerState {
  screen: { x: number; y: number }
  page: { x: number; y: number }
}

/** Double-click node picker (spec: 面板出现在鼠标右上角). */
function NodePicker({
  editor,
  state,
  onClose,
}: {
  editor: Editor
  state: PickerState
  onClose: () => void
}) {
  const spawn = (type: typeof GEN_CARD | typeof MEDIA_CARD) => {
    editor.createShape({ id: createShapeId(), type, x: state.page.x, y: state.page.y - 144 })
    onClose()
  }
  const left = Math.min(state.screen.x + 8, window.innerWidth - 240)
  const top = Math.max(state.screen.y - 150, 12)
  return (
    <>
      <div className="otv-picker-backdrop" onPointerDown={onClose} />
      <div className="otv-picker otv-picker-canvas" style={{ left, top }}>
        <div className="otv-picker-title">新建节点：</div>
        <button onClick={() => spawn(GEN_CARD)}>
          <IconCard />
          <span>生成卡片</span>
        </button>
        <button onClick={() => spawn(MEDIA_CARD)}>
          <IconPlus />
          <span>上传图片</span>
        </button>
      </div>
    </>
  )
}

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [picker, setPicker] = useState<PickerState | null>(null)

  return (
    <div className="otv-root">
      <Tldraw
        persistenceKey="opentv-v2"
        shapeUtils={shapeUtils}
        components={components}
        options={{ createTextOnCanvasDoubleClick: false }}
        onMount={(e) => {
          e.user.updateUserPreferences({ colorScheme: 'dark' })
          if (import.meta.env.DEV) (window as unknown as { editor: Editor }).editor = e
          // double-click on empty canvas opens the node picker at the cursor
          e.on('event', (info) => {
            if (info.name !== 'double_click') return
            const page = { x: e.inputs.currentPagePoint.x, y: e.inputs.currentPagePoint.y }
            if (e.getShapeAtPoint(page, { hitInside: true })) return
            const screen = { x: e.inputs.currentScreenPoint.x, y: e.inputs.currentScreenPoint.y }
            setPicker({ screen, page })
          })
          setEditor(e)
        }}
      />
      {/* project pill, top-left per the mock */}
      <div className="otv-project">
        <span className="otv-project-logo" />
        <span>未命名的文件</span>
      </div>
      {editor ? <Toolbar editor={editor} onOpenSettings={() => setShowSettings(true)} /> : null}
      {editor ? <EmptyGuide editor={editor} /> : null}
      {editor && picker ? <NodePicker editor={editor} state={picker} onClose={() => setPicker(null)} /> : null}
      <Lightbox />
      <Toast />
      {showSettings ? <SettingsDialog onClose={() => setShowSettings(false)} /> : null}
    </div>
  )
}
