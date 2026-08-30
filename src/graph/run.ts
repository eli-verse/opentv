import { createShapeId, type Editor, type TLShapeId } from 'tldraw'
import { getModel, MODELS } from '../providers/registry'
import { getProvider } from '../providers/registry'
import { GEN_CARD, type GenCardShape } from '../shapes/GenCardUtil'
import { collectInputs } from './inputs'

function patch(editor: Editor, id: TLShapeId, props: Partial<GenCardShape['props']>) {
  editor.updateShape({ id, type: GEN_CARD, props })
}

/** Generate into the card itself: prompt in, media out, same shape. */
export async function runGenerationCard(editor: Editor, shapeId: TLShapeId) {
  const shape = editor.getShape(shapeId) as GenCardShape | undefined
  if (!shape || shape.props.status === 'running') return

  const model = getModel(shape.props.model)
  const refs = collectInputs(editor, shapeId)
  const prompt = [shape.props.prompt.trim(), ...refs.prompts].filter(Boolean).join('\n')

  if (!prompt) {
    patch(editor, shapeId, { status: 'error', message: '写点提示词再生成' })
    return
  }
  if (model.kind === 'i2v' && !refs.imageUrl) {
    patch(editor, shapeId, { status: 'error', message: '图生视频需要一张参考图（把图片卡连过来）' })
    return
  }

  patch(editor, shapeId, { status: 'running', message: '准备中…' })
  try {
    const result = await getProvider(model).generate({
      model,
      prompt,
      imageUrl: refs.imageUrl,
      onStatus: (message) => patch(editor, shapeId, { status: 'running', message }),
    })
    patch(editor, shapeId, {
      status: 'done',
      message: '',
      mediaType: result.mediaType,
      src: result.url,
      // 16:9 media area + prompt bar, no letterboxing
      w: 380,
      h: Math.round((380 * 9) / 16) + 42,
    })
  } catch (err) {
    patch(editor, shapeId, {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Output-centric derivation: spawn a new card from a finished one.
 * The provenance arrow doubles as the data edge (variation reuses the
 * prompt; i2v reads the parent's image through the arrow).
 */
export function deriveCard(
  editor: Editor,
  fromId: TLShapeId,
  kind: 'variation' | 'i2v'
) {
  const parent = editor.getShape(fromId) as GenCardShape | undefined
  if (!parent) return

  let model = parent.props.model
  if (kind === 'i2v') {
    const parentProvider = getModel(parent.props.model).provider
    const i2v =
      MODELS.find((m) => m.kind === 'i2v' && m.provider === parentProvider) ??
      MODELS.find((m) => m.kind === 'i2v')
    if (!i2v) return
    model = i2v.id
  }

  const id = createShapeId()
  editor.createShape({
    id,
    type: GEN_CARD,
    x: parent.x + parent.props.w + 120,
    y: kind === 'variation' ? parent.y + parent.props.h / 2 + 40 : parent.y,
    props: { prompt: parent.props.prompt, model },
  })
  const arrowId = createShapeId()
  editor.createShape({ id: arrowId, type: 'arrow', props: {} })
  editor.createBindings([
    {
      fromId: arrowId,
      toId: fromId,
      type: 'arrow',
      props: { terminal: 'start', normalizedAnchor: { x: 0.5, y: 0.5 }, isPrecise: false, isExact: false },
    },
    {
      fromId: arrowId,
      toId: id,
      type: 'arrow',
      props: { terminal: 'end', normalizedAnchor: { x: 0.5, y: 0.5 }, isPrecise: false, isExact: false },
    },
  ])
  void runGenerationCard(editor, id)
}
