import { createShapeId, type Editor, type TLShapeId } from 'tldraw'
import { getModel, getProvider } from '../providers/registry'
import { GEN_CARD, type GenCardShape } from '../shapes/GenCardUtil'
import { MEDIA_CARD } from '../shapes/MediaCardUtil'
import { collectInputs } from './inputs'

function setStatus(
  editor: Editor,
  id: TLShapeId,
  status: GenCardShape['props']['status'],
  message: string
) {
  editor.updateShape({ id, type: GEN_CARD, props: { status, message } })
}

export async function runGenCard(editor: Editor, shapeId: TLShapeId) {
  const shape = editor.getShape(shapeId) as GenCardShape | undefined
  if (!shape || shape.props.status === 'running') return

  const model = getModel(shape.props.model)
  const inputs = collectInputs(editor, shapeId)

  if (!inputs.prompts.length) {
    setStatus(editor, shapeId, 'error', '先连一张提示词卡片（从卡片边缘拖箭头到这里）')
    return
  }
  if (model.kind === 'i2v' && !inputs.imageUrl) {
    setStatus(editor, shapeId, 'error', '图生视频需要再连一张图片卡片')
    return
  }

  setStatus(editor, shapeId, 'running', '准备中…')
  try {
    const result = await getProvider(model).generate({
      model,
      prompt: inputs.prompts.join('\n'),
      imageUrl: inputs.imageUrl,
      onStatus: (message) => setStatus(editor, shapeId, 'running', message),
    })

    // Drop the result card to the right of the gen card and wire it up.
    const current = editor.getShape(shapeId) as GenCardShape
    const isVideo = result.mediaType === 'video'
    const mediaId = createShapeId()
    editor.createShape({
      id: mediaId,
      type: MEDIA_CARD,
      x: current.x + current.props.w + 140,
      y: current.y,
      props: {
        w: 360,
        h: isVideo ? 240 : 240,
        mediaType: result.mediaType,
        src: result.url,
        label: model.name,
      },
    })
    const arrowId = createShapeId()
    editor.createShape({ id: arrowId, type: 'arrow', props: {} })
    editor.createBindings([
      {
        fromId: arrowId,
        toId: shapeId,
        type: 'arrow',
        props: { terminal: 'start', normalizedAnchor: { x: 0.5, y: 0.5 }, isPrecise: false, isExact: false },
      },
      {
        fromId: arrowId,
        toId: mediaId,
        type: 'arrow',
        props: { terminal: 'end', normalizedAnchor: { x: 0.5, y: 0.5 }, isPrecise: false, isExact: false },
      },
    ])
    setStatus(editor, shapeId, 'done', '完成 ✓')
  } catch (err) {
    setStatus(editor, shapeId, 'error', err instanceof Error ? err.message : String(err))
  }
}
