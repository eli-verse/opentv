import type { Editor, TLShapeId } from 'tldraw'
import { MEDIA_CARD, type MediaCardShape } from '../shapes/MediaCardUtil'
import { PROMPT_CARD, type PromptCardShape } from '../shapes/PromptCardUtil'

export interface GenInputs {
  prompts: string[]
  imageUrl?: string
}

/** Walk incoming arrows: cards whose arrow *ends* at `shapeId` are its inputs. */
export function collectInputs(editor: Editor, shapeId: TLShapeId): GenInputs {
  const inputs: GenInputs = { prompts: [] }
  const bindings = editor.getBindingsToShape(shapeId, 'arrow')
  for (const binding of bindings) {
    const props = binding.props as { terminal?: string }
    if (props.terminal !== 'end') continue
    // binding.fromId is the arrow shape; find what the arrow starts from.
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
    }
  }
  return inputs
}
