import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLShape } from 'tldraw'
import { collectInputs } from '../graph/inputs'
import { deriveCard, runGenerationCard } from '../graph/run'
import { MODELS } from '../providers/registry'

export const GEN_CARD = 'gen-card'

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [GEN_CARD]: {
      w: number
      h: number
      prompt: string
      model: string
      status: 'idle' | 'running' | 'done' | 'error'
      message: string
      mediaType: '' | 'image' | 'video'
      src: string
    }
  }
}

export type GenCardShape = TLShape<typeof GEN_CARD>

const stop = (e: React.SyntheticEvent) => e.stopPropagation()

export class GenCardUtil extends BaseBoxShapeUtil<GenCardShape> {
  static override type = GEN_CARD
  static override props: RecordProps<GenCardShape> = {
    w: T.number,
    h: T.number,
    prompt: T.string,
    model: T.string,
    status: T.literalEnum('idle', 'running', 'done', 'error'),
    message: T.string,
    mediaType: T.literalEnum('', 'image', 'video'),
    src: T.string,
  }

  getDefaultProps(): GenCardShape['props'] {
    return {
      w: 320,
      h: 210,
      prompt: '',
      model: MODELS[0].id,
      status: 'idle',
      message: '',
      mediaType: '',
      src: '',
    }
  }

  override canEdit() {
    return false
  }

  component(shape: GenCardShape) {
    const { prompt, model, status, message, mediaType, src } = shape.props
    const hasMedia = !!src && status !== 'running'
    const patch = (props: Partial<GenCardShape['props']>) =>
      this.editor.updateShape({ id: shape.id, type: GEN_CARD, props })
    const refs = collectInputs(this.editor, shape.id)

    return (
      <HTMLContainer className="otv-card" style={{ pointerEvents: 'all' }}>
        {hasMedia ? (
          /* ---- completed: the card IS the artwork ---- */
          <>
            <div className="otv-media-body">
              {mediaType === 'video' ? (
                <video src={src} controls loop muted playsInline onPointerDown={stop} />
              ) : (
                <img src={src} draggable={false} />
              )}
            </div>
            <div className="otv-genbar" onPointerDown={stop} onTouchStart={stop}>
              <input
                className="otv-genbar-prompt"
                value={prompt}
                placeholder="提示词…"
                onChange={(e) => patch({ prompt: e.currentTarget.value })}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') runGenerationCard(this.editor, shape.id)
                }}
              />
              <div className="otv-genbar-actions">
                <button title="用当前提示词重新生成（覆盖本卡）" onClick={() => runGenerationCard(this.editor, shape.id)}>↻</button>
                <button title="变体：新开一张卡再来一次" onClick={() => deriveCard(this.editor, shape.id, 'variation')}>🎲</button>
                {mediaType === 'image' ? (
                  <button title="动起来：图生视频" onClick={() => deriveCard(this.editor, shape.id, 'i2v')}>🎬</button>
                ) : null}
              </div>
            </div>
            {status === 'error' && message ? <div className="otv-gen-status otv-error">{message}</div> : null}
          </>
        ) : (
          /* ---- empty / running / error: a frame waiting to be filled ---- */
          <>
            <div className="otv-card-header otv-header-gen">
              ⚡ 生成
              {refs.imageUrl ? <span className="otv-header-label">已连参考图</span> : null}
            </div>
            <div className="otv-gen-body">
              <textarea
                className="otv-prompt-input otv-gen-prompt"
                placeholder="描述画面，回车生成…"
                value={prompt}
                disabled={status === 'running'}
                onChange={(e) => patch({ prompt: e.currentTarget.value })}
                onPointerDown={stop}
                onTouchStart={stop}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    runGenerationCard(this.editor, shape.id)
                  }
                }}
              />
              <div className="otv-gen-row">
                <select
                  value={model}
                  disabled={status === 'running'}
                  onChange={(e) => patch({ model: e.currentTarget.value })}
                  onPointerDown={stop}
                  onTouchStart={stop}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.kind}
                    </option>
                  ))}
                </select>
                <button
                  className="otv-run-btn otv-run-compact"
                  disabled={status === 'running'}
                  onClick={() => runGenerationCard(this.editor, shape.id)}
                  onPointerDown={stop}
                  onTouchStart={stop}
                >
                  {status === 'running' ? '…' : '▶'}
                </button>
              </div>
              {message ? (
                <div className={`otv-gen-status ${status === 'error' ? 'otv-error' : ''}`}>{message}</div>
              ) : null}
            </div>
          </>
        )}
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: GenCardShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12)
    return path
  }
}
