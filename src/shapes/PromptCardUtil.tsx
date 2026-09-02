import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLShape } from 'tldraw'

export const PROMPT_CARD = 'prompt-card'

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [PROMPT_CARD]: { w: number; h: number; text: string }
  }
}

export type PromptCardShape = TLShape<typeof PROMPT_CARD>

/** A quiet dark note. Arrow it into a generation card to feed prompt text. */
export class PromptCardUtil extends BaseBoxShapeUtil<PromptCardShape> {
  static override type = PROMPT_CARD
  static override props: RecordProps<PromptCardShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
  }

  getDefaultProps(): PromptCardShape['props'] {
    return { w: 260, h: 150, text: '' }
  }

  override canEdit() {
    return false
  }

  component(shape: PromptCardShape) {
    return (
      <HTMLContainer className="otv-card" style={{ pointerEvents: 'all' }}>
        <div className="otv-card-inner">
          <textarea
            className="otv-prompt-input"
            placeholder="便签：写点提示词，连到生成卡…"
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
        </div>
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: PromptCardShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, 16)
    return path
  }
}
