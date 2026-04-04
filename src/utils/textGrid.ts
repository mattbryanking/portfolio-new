export const TEXT = 'matthewbryanking'
export const STAGGER = 0.5

export function measureCharWidth(font: string): number {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  ctx.font = font
  return ctx.measureText('m').width
}

export function computeFontSize(viewportWidth: number): number {
  return Math.min(24, Math.max(14, viewportWidth * 0.012 + 8))
}

export function buildTextCanvas(w: number, h: number, dpr: number) {
  const fontSize = computeFontSize(w)
  const font = `${fontSize}px 'JetBrains Mono', monospace`
  const charWidth = measureCharWidth(font)

  const cols = Math.ceil(w / charWidth) + 2
  const rows = Math.ceil(h / fontSize) + 1

  const canvas = document.createElement('canvas')
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  ctx.font = font
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'top'

  for (let r = 0; r < rows; r++) {
    const odd = r % 2 === 1
    const stagger = odd ? charWidth * STAGGER : 0
    const offset = odd ? Math.floor(TEXT.length * STAGGER) : 0
    for (let c = odd ? -1 : 0; c < cols; c++) {
      const idx = ((c + offset) % TEXT.length + TEXT.length) % TEXT.length
      ctx.fillText(TEXT[idx], c * charWidth + stagger, r * fontSize)
    }
  }

  return { canvas, charWidth, fontSize }
}
