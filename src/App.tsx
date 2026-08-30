import { useState } from 'react'
import { Tldraw, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { GenCardUtil } from './shapes/GenCardUtil'
import { MediaCardUtil } from './shapes/MediaCardUtil'
import { PromptCardUtil } from './shapes/PromptCardUtil'
import { SettingsDialog } from './ui/SettingsDialog'
import { Toolbar } from './ui/Toolbar'

const shapeUtils = [PromptCardUtil, MediaCardUtil, GenCardUtil]

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  return (
    <div className="otv-root">
      <Tldraw
        persistenceKey="opentv-v2"
        shapeUtils={shapeUtils}
        onMount={(e) => {
          e.user.updateUserPreferences({ colorScheme: 'dark' })
          if (import.meta.env.DEV) (window as unknown as { editor: Editor }).editor = e
          setEditor(e)
        }}
      />
      {editor ? <Toolbar editor={editor} onOpenSettings={() => setShowSettings(true)} /> : null}
      {showSettings ? <SettingsDialog onClose={() => setShowSettings(false)} /> : null}
    </div>
  )
}
