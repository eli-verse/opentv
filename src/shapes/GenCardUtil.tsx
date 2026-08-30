import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLShape } from 'tldraw'
import { collectInputs } from '../graph/inputs'
import { runGenCard } from '../graph/run'
import { MODELS } from '../providers/registry'

export const GEN_CARD = 'gen-card'

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [GEN_CARD]: {
      w: number
      h: number
      model: string
      status: 'idle' | 'running' | 'done' | 'error'
      message: string
    }
  }
}

export type GenCardShape = TLShape<typeof GEN_CARD>

export class GenCardUtil extends BaseBoxShapeUtil<GenCardShape> {
  static override type = GEN_CARD
  static override props: RecordProps<GenCardShape> = {
    w: T.number,
    h: T.number,
    model: T.string,
    status: T.literalEnum('idle', 'running', 'done', 'error'),
    message: T.string,
  }

  getDefaultProps(): GenCardShape['props'] {
    return { w: 300, h: 190, model: MODELS[0].id, status: 'idle', message: '' }
  }

  override canEdit() {
    return false
  }

  component(shape: GenCardShape) {
    const { model, status, message } = shape.props
    const inputs = collectInputs(this.editor, shape.id)
    const stop = (e: React.SyntheticEvent) => e.stopPropagation()
    return (
      <HTMLContainer className="otv-card" style={{ pointerEvents: 'all' }}>
        <div className="otv-card-header otv-header-gen">⚡ 生成</div>
        <div className="otv-gen-body">
          <select
            value={model}
            onChange={(e) =>
              this.editor.updateShape({
                id: shape.id,
                type: GEN_CARD,
                props: { model: e.currentTarget.value },
              })
            }
            onPointerDown={stop}
            onTouchStart={stop}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.kind}
              </option>
            ))}
          </select>
          <div className="otv-gen-inputs">
            输入：{inputs.prompts.length} 段提示词
            {inputs.imageUrl ? ' + 1 张图' : ''}
          </div>
          <button
            className="otv-run-btn"
            disabled={status === 'running'}
            onClick={() => runGenCard(this.editor, shape.id)}
            onPointerDown={stop}
            onTouchStart={stop}
          >
            {status === 'running' ? '生成中…' : '▶ 生成'}
          </button>
          {message ? (
            <div className={`otv-gen-status ${status === 'error' ? 'otv-error' : ''}`}>{message}</div>
          ) : null}
        </div>
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: GenCardShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12)
    return path
  }
}
