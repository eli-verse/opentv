import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLShape } from 'tldraw'

export const PROMPT_CARD = 'prompt-card'

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [PROMPT_CARD]: { w: number; h: number; text: string }
  }
}

export type PromptCardShape = TLShape<typeof PROMPT_CARD>

export class PromptCardUtil extends BaseBoxShapeUtil<PromptCardShape> {
  static override type = PROMPT_CARD
  static override props: RecordProps<PromptCardShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
  }

  getDefaultProps(): PromptCardShape['props'] {
    return { w: 280, h: 160, text: '' }
  }

  override canEdit() {
    return false
  }

  component(shape: PromptCardShape) {
    return (
      <HTMLContainer className="otv-card" style={{ pointerEvents: 'all' }}>
        <div className="otv-card-header otv-header-prompt">✏️ 提示词</div>
        <textarea
          className="otv-prompt-input"
          placeholder="描述你想生成的画面…"
          value={shape.props.text}
          onChange={(e) =>
            this.editor.updateShape({
              id: shape.id,
              type: PROMPT_CARD,
              props: { text: e.currentTarget.value },
            })
          }
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: PromptCardShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12)
    return path
  }
}
