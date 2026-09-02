import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLShape } from 'tldraw'

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

/** Imported assets (uploads). Chrome-less: the media fills the rounded card. */
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
    return { w: 360, h: 240, mediaType: 'image', src: '', label: '' }
  }

  override canEdit() {
    return false
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
              <div className="otv-media-empty">空媒体</div>
            )}
          </div>
        </div>
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: MediaCardShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, 16)
    return path
  }
}
