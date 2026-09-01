import {
  DefaultToolbar,
  TldrawUiMenuItem,
  useIsToolSelected,
  useTools,
} from 'tldraw'

/**
 * Trimmed canvas toolbar: select / hand / arrow (manual references) /
 * draw / text. The whiteboard leftovers (geo shapes, sticky notes,
 * asset upload, eraser) either duplicate OpenTV's own cards or fight
 * the creator-canvas feel.
 */
export function CanvasToolbar() {
  const tools = useTools()
  const isSelect = useIsToolSelected(tools['select'])
  const isHand = useIsToolSelected(tools['hand'])
  const isArrow = useIsToolSelected(tools['arrow'])
  const isDraw = useIsToolSelected(tools['draw'])
  const isText = useIsToolSelected(tools['text'])
  return (
    <DefaultToolbar>
      <TldrawUiMenuItem {...tools['select']} isSelected={isSelect} />
      <TldrawUiMenuItem {...tools['hand']} isSelected={isHand} />
      <TldrawUiMenuItem {...tools['arrow']} isSelected={isArrow} />
      <TldrawUiMenuItem {...tools['draw']} isSelected={isDraw} />
      <TldrawUiMenuItem {...tools['text']} isSelected={isText} />
    </DefaultToolbar>
  )
}
