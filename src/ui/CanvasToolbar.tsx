import {
  DefaultToolbar,
  TldrawUiMenuItem,
  useIsToolSelected,
  useTools,
} from 'tldraw'

/**
 * Minimal canvas toolbar: select, hand, arrow (manual references).
 * Everything else on the canvas happens through the cards themselves.
 */
export function CanvasToolbar() {
  const tools = useTools()
  const isSelect = useIsToolSelected(tools['select'])
  const isHand = useIsToolSelected(tools['hand'])
  const isArrow = useIsToolSelected(tools['arrow'])
  return (
    <DefaultToolbar>
      <TldrawUiMenuItem {...tools['select']} isSelected={isSelect} />
      <TldrawUiMenuItem {...tools['hand']} isSelected={isHand} />
      <TldrawUiMenuItem {...tools['arrow']} isSelected={isArrow} />
    </DefaultToolbar>
  )
}
