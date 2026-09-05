import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLShape } from 'tldraw'
import { cardSizeFor } from '../graph/run'
import { IconPlus } from '../ui/icons'

export const MEDIA_CARD = 'media-card'

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [MEDIA_CARD]: {
      w: number
      h: number
      mediaType: 'image' | 'video'
      src: string
      label: string
    }
  }
}

export type MediaCardShape = TLShape<typeof MEDIA_CARD>

/**
 * Upload node. Empty: click to open the file picker (spec: 点击即唤起本地
 * 资源管理器). Filled: the media fills the card at its natural aspect.
 */
export class MediaCardUtil extends BaseBoxShapeUtil<MediaCardShape> {
  static override type = MEDIA_CARD
  static override props: RecordProps<MediaCardShape> = {
    w: T.number,
    h: T.number,
    mediaType: T.literalEnum('image', 'video'),
    src: T.string,
    label: T.string,
  }

  getDefaultProps(): MediaCardShape['props'] {
    return { w: 288, h: 288, mediaType: 'image', src: '', label: '' }
  }

  override canEdit() {
    return false
  }

  private pickFile(shape: MediaCardShape) {
    const editor = this.editor
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const url = String(reader.result)
        const img = new Image()
        img.onload = () => {
          const size = cardSizeFor(img.naturalWidth || 1, img.naturalHeight || 1)
          editor.updateShape({
            id: shape.id,
            type: MEDIA_CARD,
            props: { src: url, label: file.name, w: size.w, h: size.h },
          })
        }
        img.src = url
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  component(shape: MediaCardShape) {
    const { mediaType, src } = shape.props
    return (
      <HTMLContainer className="otv-card" style={{ pointerEvents: 'all' }}>
        <div className="otv-card-inner">
          <div className="otv-media-body">
            {src ? (
              mediaType === 'video' ? (
                <video src={src} controls loop muted playsInline onPointerDown={(e) => e.stopPropagation()} />
              ) : (
                <img src={src} draggable={false} />
              )
            ) : (
              <button
                className="otv-upload-zone"
                onClick={() => this.pickFile(shape)}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <IconPlus />
                <span>上传图片</span>
              </button>
            )}
          </div>
        </div>
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: MediaCardShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12)
    return path
  }
}
