import type { Editor, TLShapeId } from 'tldraw'
import { GEN_CARD, type GenCardShape } from '../shapes/GenCardUtil'
import { MEDIA_CARD, type MediaCardShape } from '../shapes/MediaCardUtil'
import { PROMPT_CARD, type PromptCardShape } from '../shapes/PromptCardUtil'

export interface GenInputs {
  prompts: string[]
  imageUrl?: string
}

/**
 * Incoming arrows are references: a note card contributes prompt text, an
 * image (uploaded or a finished generation) becomes the reference image.
 * Arrows are drawn by the system as provenance when deriving cards, or by
 * hand for power users — either way they read the same.
 */
export function collectInputs(editor: Editor, shapeId: TLShapeId): GenInputs {
  const inputs: GenInputs = { prompts: [] }
  const bindings = editor.getBindingsToShape(shapeId, 'arrow')
  for (const binding of bindings) {
    const props = binding.props as { terminal?: string }
    if (props.terminal !== 'end') continue
    const arrowBindings = editor.getBindingsFromShape(binding.fromId, 'arrow')
    const startBinding = arrowBindings.find(
      (b) => (b.props as { terminal?: string }).terminal === 'start'
    )
    if (!startBinding) continue
    const source = editor.getShape(startBinding.toId)
    if (!source) continue
    if (source.type === PROMPT_CARD) {
      const text = (source as PromptCardShape).props.text.trim()
      if (text) inputs.prompts.push(text)
    } else if (source.type === MEDIA_CARD) {
      const media = source as MediaCardShape
      if (media.props.mediaType === 'image' && media.props.src) {
        inputs.imageUrl = media.props.src
      }
    } else if (source.type === GEN_CARD) {
      const gen = source as GenCardShape
      if (gen.props.mediaType === 'image' && gen.props.src) {
        inputs.imageUrl = gen.props.src
      }
    }
  }
  return inputs
}
