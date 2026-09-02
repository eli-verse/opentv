import { useState } from 'react'
import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLShape, useValue } from 'tldraw'
import { collectInputs } from '../graph/inputs'
import { deriveCard, runGenerationCard } from '../graph/run'
import { MODELS } from '../providers/registry'
import {
  IconCard,
  IconChevronDown,
  IconDownload,
  IconExpand,
  IconInfo,
  IconPlus,
  IconRedo,
  IconVideo,
} from '../ui/icons'

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

function download(src: string) {
  const a = document.createElement('a')
  a.href = src
  a.download = `opentv-${Date.now()}`
  a.click()
}

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
      w: 288,
      h: 288,
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
    const editor = this.editor
    const patch = (props: Partial<GenCardShape['props']>) =>
      editor.updateShape({ id: shape.id, type: GEN_CARD, props })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [pickerOpen, setPickerOpen] = useState(false)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const isSelected = useValue(
      'gen-card-selected',
      () => editor.getSelectedShapeIds().includes(shape.id),
      [editor, shape.id]
    )
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const isHovered = useValue(
      'gen-card-hovered',
      () => editor.getHoveredShapeId() === shape.id,
      [editor, shape.id]
    )
    const refs = collectInputs(editor, shape.id)
    // Spec: blurred cards show only the media; hover reveals the chrome
    // temporarily; selection pins it. Empty/running/error cards keep it.
    const chromeVisible =
      isSelected || isHovered || pickerOpen || !hasMedia || status === 'error'

    const hint =
      status === 'error'
        ? message
        : status === 'running'
          ? message || '生成中…'
          : hasMedia
            ? ''
            : '写好提示词，回车生成'

    const pick = (kind: 'variation' | 'i2v' | 'blank') => {
      setPickerOpen(false)
      deriveCard(editor, shape.id, kind)
    }

    return (
      <HTMLContainer className="otv-card" style={{ pointerEvents: 'all' }}>
        {/* floating top bar, centered, 12px above the card */}
        <div
          className={`otv-hoverbar ${chromeVisible ? '' : 'otv-chrome-hidden'} ${status === 'running' ? 'otv-bar-disabled' : ''}`}
          onPointerDown={stop}
          onTouchStart={stop}
        >
          {hasMedia ? (
            <>
              <button
                className="otv-iconbtn"
                title="查看大图"
                onClick={() => window.dispatchEvent(new CustomEvent('otv:view', { detail: { src, mediaType } }))}
              >
                <IconExpand />
              </button>
              <button className="otv-iconbtn" title="下载" onClick={() => download(src)}>
                <IconDownload />
              </button>
              <button className="otv-iconbtn" title="重新生成" onClick={() => runGenerationCard(editor, shape.id)}>
                <IconRedo />
              </button>
              <span className="otv-bar-divider" />
            </>
          ) : null}
          <span className="otv-model-select">
            <select
              value={model}
              disabled={status === 'running'}
              onChange={(e) => patch({ model: e.currentTarget.value })}
              title="模型"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <IconChevronDown />
          </span>
        </div>

        {/* card body */}
        <div className="otv-card-inner">
          <div className="otv-media-body">
            {hasMedia ? (
              mediaType === 'video' ? (
                <video src={src} controls loop muted playsInline onPointerDown={stop} />
              ) : (
                <img src={src} draggable={false} />
              )
            ) : null}

            {/* top hint row (16px inset), hidden once media has landed */}
            {hint ? (
              <div className={`otv-hint ${status === 'error' ? 'otv-error' : ''}`}>
                <IconInfo />
                <span>{hint}</span>
              </div>
            ) : null}

            {/* generating: flowing white veil, 0-8% opacity loop (spec: 类似 flora) */}
            {status === 'running' ? <div className="otv-breathe" /> : null}

            {/* bottom block (16px inset): reference thumb + auto-growing prompt */}
            <div
              className={`otv-bottom ${chromeVisible ? '' : 'otv-chrome-hidden'}`}
              onPointerDown={stop}
              onTouchStart={stop}
            >
              {refs.imageUrl ? <img className="otv-thumb" src={refs.imageUrl} draggable={false} /> : null}
              <textarea
                rows={1}
                value={prompt}
                disabled={status === 'running'}
                placeholder="这里输入提示词…"
                ref={(el) => {
                  if (!el) return
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 132) + 'px'
                }}
                onChange={(e) => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 132) + 'px'
                  patch({ prompt: el.value })
                }}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    runGenerationCard(editor, shape.id)
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* derive entry: plus at the right edge, on hover */}
        {hasMedia && (chromeVisible || pickerOpen) ? (
          <button
            className="otv-plus"
            title="从这张卡继续"
            onClick={() => setPickerOpen((v) => !v)}
            onPointerDown={stop}
            onTouchStart={stop}
          >
            <IconPlus />
          </button>
        ) : null}

        {/* node picker panel */}
        {pickerOpen ? (
          <div className="otv-picker" onPointerDown={stop} onTouchStart={stop}>
            <div className="otv-picker-title">转为：</div>
            <button onClick={() => pick('variation')}>
              <IconRedo />
              <span>变体 · 再来一张</span>
            </button>
            {mediaType === 'image' ? (
              <button onClick={() => pick('i2v')}>
                <IconVideo />
                <span>动起来 · 图生视频</span>
              </button>
            ) : null}
            <button onClick={() => pick('blank')}>
              <IconCard />
              <span>新生成卡 · 以此为参考</span>
            </button>
          </div>
        ) : null}
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: GenCardShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12)
    return path
  }
}
