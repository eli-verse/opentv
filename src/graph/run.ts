import { createShapeId, type Editor, type TLShapeId } from 'tldraw'
import { getModel, getProvider, MODELS } from '../providers/registry'
import { GEN_CARD, type GenCardShape } from '../shapes/GenCardUtil'
import { collectInputs } from './inputs'

function patch(editor: Editor, id: TLShapeId, props: Partial<GenCardShape['props']>) {
  editor.updateShape({ id, type: GEN_CARD, props })
}

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent('otv:toast', { detail: message }))
}

/** Natural media size, for the card-fit rules below. */
function probeMediaSize(url: string, mediaType: 'image' | 'video'): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    if (mediaType === 'image') {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 })
      img.onerror = () => resolve({ w: 1, h: 1 })
      img.src = url
    } else {
      const v = document.createElement('video')
      v.onloadedmetadata = () => resolve({ w: v.videoWidth || 16, h: v.videoHeight || 9 })
      v.onerror = () => resolve({ w: 16, h: 9 })
      v.src = url
    }
  })
}

/** Spec: portrait fixes width at 288, landscape fixes height at 288, square is 288×288. No cropping. */
export function cardSizeFor(w: number, h: number): { w: number; h: number } {
  if (w === h) return { w: 288, h: 288 }
  if (w < h) return { w: 288, h: Math.round((288 * h) / w) }
  return { w: Math.round((288 * w) / h), h: 288 }
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

  // Spec: the card is selected while generating.
  editor.select(shapeId)
  patch(editor, shapeId, { status: 'running', message: '准备中…' })
  try {
    const result = await getProvider(model).generate({
      model,
      prompt,
      imageUrl: refs.imageUrl,
      onStatus: (message) => patch(editor, shapeId, { status: 'running', message }),
    })
    const natural = await probeMediaSize(result.url, result.mediaType)
    const size = cardSizeFor(natural.w, natural.h)
    patch(editor, shapeId, {
      status: 'done',
      message: '',
      mediaType: result.mediaType,
      src: result.url,
      w: size.w,
      h: size.h,
    })
  } catch (err) {
    patch(editor, shapeId, {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    })
    toast('生成失败，请重新尝试')
  }
}

/**
 * Output-centric derivation: spawn a new card from a finished one.
 * The provenance arrow doubles as the data edge; the new card inherits
 * the parent card's size (spec: 卡片的尺寸继承上个卡片的尺寸).
 */
export function deriveCard(
  editor: Editor,
  fromId: TLShapeId,
  kind: 'variation' | 'i2v' | 'blank'
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
    props: {
      prompt: kind === 'blank' ? '' : parent.props.prompt,
      model,
      w: parent.props.w,
      h: parent.props.h,
    },
  })

  // A variation should see the same references its parent saw (an i2v
  // variation needs the parent's source image, not the parent's video).
  if (kind === 'variation') {
    for (const binding of editor.getBindingsToShape(fromId, 'arrow')) {
      if ((binding.props as { terminal?: string }).terminal !== 'end') continue
      const startBinding = editor
        .getBindingsFromShape(binding.fromId, 'arrow')
        .find((b) => (b.props as { terminal?: string }).terminal === 'start')
      if (!startBinding || startBinding.toId === id) continue
      const refArrow = createShapeId()
      editor.createShape({ id: refArrow, type: 'arrow', props: { color: 'grey', size: 's', bend: 40, arrowheadStart: 'none', arrowheadEnd: 'none' } })
      editor.createBindings([
        { fromId: refArrow, toId: startBinding.toId, type: 'arrow', props: { terminal: 'start', normalizedAnchor: { x: 0.5, y: 0.5 }, isPrecise: false, isExact: false } },
        { fromId: refArrow, toId: id, type: 'arrow', props: { terminal: 'end', normalizedAnchor: { x: 0.5, y: 0.5 }, isPrecise: false, isExact: false } },
      ])
    }
  }

  const arrowId = createShapeId()
  editor.createShape({ id: arrowId, type: 'arrow', props: { color: 'grey', size: 's', bend: 40, arrowheadStart: 'none', arrowheadEnd: 'none' } })
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
  if (kind !== 'blank') void runGenerationCard(editor, id)
}
