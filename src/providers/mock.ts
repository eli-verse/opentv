import type { GenerateResult, Provider } from './types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function mockImage(prompt: string): string {
  const hue = Math.abs([...prompt].reduce((a, c) => a + c.charCodeAt(0), 0)) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${hue},70%,55%)"/>
    <stop offset="1" stop-color="hsl(${(hue + 80) % 360},70%,35%)"/>
  </linearGradient></defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <text x="24" y="330" font-family="system-ui" font-size="20" fill="rgba(255,255,255,.85)">${prompt
    .slice(0, 40)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')}</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Record a 2s animated-gradient webm entirely in the browser — offline mock video. */
async function mockVideo(prompt: string): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const ctx = canvas.getContext('2d')!
  const hue = Math.abs([...prompt].reduce((a, c) => a + c.charCodeAt(0), 0)) % 360
  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => chunks.push(e.data)
  const done = new Promise<void>((r) => (recorder.onstop = () => r()))
  recorder.start()
  const t0 = performance.now()
  await new Promise<void>((resolve) => {
    const draw = () => {
      const t = (performance.now() - t0) / 1000
      const g = ctx.createLinearGradient(0, 0, 640, 360)
      g.addColorStop(0, `hsl(${(hue + t * 60) % 360},70%,50%)`)
      g.addColorStop(1, `hsl(${(hue + 120 + t * 60) % 360},70%,30%)`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 640, 360)
      ctx.fillStyle = 'rgba(255,255,255,.85)'
      ctx.font = '20px system-ui'
      ctx.fillText(prompt.slice(0, 40), 24, 330)
      if (t < 2) requestAnimationFrame(draw)
      else resolve()
    }
    draw()
  })
  recorder.stop()
  await done
  return URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))
}

export const mockProvider: Provider = {
  id: 'mock',
  async generate({ model, prompt, onStatus }): Promise<GenerateResult> {
    onStatus?.('排队中…')
    await sleep(500)
    onStatus?.('生成中…')
    if (model.kind === 't2i') {
      await sleep(800)
      return { mediaType: 'image', url: mockImage(prompt || 'untitled') }
    }
    const url = await mockVideo(prompt || 'untitled')
    return { mediaType: 'video', url }
  },
}
