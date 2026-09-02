import { useEffect, useState } from 'react'
import { createShapeId, Tldraw, useValue, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { GEN_CARD, GenCardUtil } from './shapes/GenCardUtil'
import { MediaCardUtil } from './shapes/MediaCardUtil'
import { PromptCardUtil } from './shapes/PromptCardUtil'
import { CanvasToolbar } from './ui/CanvasToolbar'
import { SettingsDialog } from './ui/SettingsDialog'
import { Toolbar } from './ui/Toolbar'

const shapeUtils = [PromptCardUtil, MediaCardUtil, GenCardUtil]
const components = { Toolbar: CanvasToolbar, StylePanel: null }

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

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [showSettings, setShowSettings] = useState(false)

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
          // double-click on empty canvas spawns a generation card
          e.on('event', (info) => {
            if (info.name !== 'double_click') return
            const point = e.inputs.currentPagePoint
            if (e.getShapeAtPoint(point, { hitInside: true })) return
            e.createShape({
              id: createShapeId(),
              type: GEN_CARD,
              x: point.x - 144,
              y: point.y - 144,
            })
          })
          setEditor(e)
        }}
      />
      {editor ? <Toolbar editor={editor} onOpenSettings={() => setShowSettings(true)} /> : null}
      {editor ? <EmptyGuide editor={editor} /> : null}
      <Lightbox />
      {showSettings ? <SettingsDialog onClose={() => setShowSettings(false)} /> : null}
    </div>
  )
}
