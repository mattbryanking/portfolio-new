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

export function buildTextCanvas(w: number, h: number, dpr: number, textStr: string = TEXT, isMobileAlt: boolean = false) {
  const fontSize = computeFontSize(w)
  const font = `${fontSize}px 'JetBrains Mono', monospace`
  const charWidth = measureCharWidth(font)

  const cols = Math.ceil(w / charWidth) + 2
  const rows = Math.ceil(h / fontSize) + 1

  const cx = w / 2;
  const cy = h / 2;
  const R = 55; // matched with mobile idle radius

  interface Cell { r: number; c: number; x: number; y: number; }
  const visibleCells: Cell[] = [];
  const cellCharMap = new Map<string, string>();

  if (isMobileAlt) {
    for (let r = 0; r < rows; r++) {
      const odd = r % 2 === 1;
      const stagger = odd ? charWidth * STAGGER : 0;
      for (let c = odd ? -1 : 0; c < cols; c++) {
        const cellX = c * charWidth + stagger;
        const cellY = r * fontSize;
        const clampX = Math.max(cellX, Math.min(cx, cellX + charWidth));
        const clampY = Math.max(cellY, Math.min(cy, cellY + fontSize));
        if (Math.hypot(cx - clampX, cy - clampY) <= R) {
          visibleCells.push({ r, c, x: cellX, y: cellY });
        }
      }
    }
    visibleCells.sort((a, b) => {
      if (a.r !== b.r) return a.r - b.r;
      return a.c - b.c;
    });
    for (let i = 0; i < visibleCells.length; i++) {
      cellCharMap.set(`${visibleCells[i].r},${visibleCells[i].c}`, textStr[i % textStr.length]);
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  ctx.font = font
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let r = 0; r < rows; r++) {
    const odd = r % 2 === 1
    const stagger = odd ? charWidth * STAGGER : 0
    const offset = odd ? Math.floor(textStr.length * STAGGER) : 0
    for (let c = odd ? -1 : 0; c < cols; c++) {
      let charToDraw = textStr[((c + offset) % textStr.length + textStr.length) % textStr.length]
      if (isMobileAlt) {
        const key = `${r},${c}`
        if (cellCharMap.has(key)) {
          charToDraw = cellCharMap.get(key)!
        }
      }
      ctx.fillText(charToDraw, c * charWidth + stagger + charWidth * 0.5, r * fontSize + fontSize * 0.5)
    }
  }

  return { canvas, charWidth, fontSize }
}
