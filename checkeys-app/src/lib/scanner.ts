/**
 * Leitor de QR Code.
 * Usa o BarcodeDetector nativo quando o navegador tem (Chrome no Android, por exemplo).
 * Nos outros (iPhone, Firefox, Chrome no Linux), usa o ZXing compilado em WebAssembly,
 * empacotado junto com o app, sem depender de CDN.
 */

export interface Detector {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>>
}

export type Motor = 'nativo' | 'zxing'

let pending: Promise<{ detector: Detector; motor: Motor }> | null = null

type NativeCtor = {
  new (options: { formats: string[] }): Detector
  getSupportedFormats(): Promise<string[]>
}

export function getDetector() {
  if (!pending) {
    pending = (async () => {
      const Native = (window as unknown as { BarcodeDetector?: NativeCtor }).BarcodeDetector
      if (Native) {
        try {
          const formats = await Native.getSupportedFormats()
          if (formats.includes('qr_code')) {
            return { detector: new Native({ formats: ['qr_code'] }), motor: 'nativo' as Motor }
          }
        } catch {
          /* cai para o ZXing */
        }
      }
      const [{ BarcodeDetector, prepareZXingModule }, wasm] = await Promise.all([
        import('barcode-detector/ponyfill'),
        import('zxing-wasm/reader/zxing_reader.wasm?url'),
      ])
      prepareZXingModule({
        overrides: {
          locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasm.default : prefix + path),
        },
      })
      return { detector: new BarcodeDetector({ formats: ['qr_code'] }) as Detector, motor: 'zxing' as Motor }
    })()
  }
  return pending
}

/** Lê um QR Code de uma foto, tentando a imagem inteira e recortes do centro em tamanhos diferentes. */
export async function decodeImageFile(file: Blob): Promise<string | null> {
  const { detector } = await getDetector()
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  try {
    try {
      const direct = await detector.detect(bitmap)
      if (direct[0]?.rawValue) return direct[0].rawValue
    } catch {
      /* tenta os recortes */
    }
    if (!ctx) return null
    const tries: Array<[number, number]> = [
      [1, 1600],
      [1, 1000],
      [0.65, 1400],
      [0.45, 1000],
      [1, 640],
    ]
    for (const [frac, max] of tries) {
      const sw = bitmap.width * frac
      const sh = bitmap.height * frac
      const sx = (bitmap.width - sw) / 2
      const sy = (bitmap.height - sh) / 2
      const scale = Math.min(1, max / Math.max(sw, sh))
      canvas.width = Math.max(1, Math.round(sw * scale))
      canvas.height = Math.max(1, Math.round(sh * scale))
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      try {
        const found = await detector.detect(canvas)
        if (found[0]?.rawValue) return found[0].rawValue
      } catch {
        /* próxima tentativa */
      }
    }
    return null
  } finally {
    bitmap.close()
  }
}
