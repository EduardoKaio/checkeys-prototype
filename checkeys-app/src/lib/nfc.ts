/** Junta o texto de todos os registros de uma mensagem NFC. */
export function ndefText(message: NDEFMessage | undefined): string {
  const parts: string[] = []
  for (const rec of message?.records ?? []) {
    try {
      if (!rec.data) continue
      const decoder = new TextDecoder(rec.recordType === 'text' ? rec.encoding || 'utf-8' : 'utf-8')
      parts.push(decoder.decode(rec.data))
    } catch {
      /* registro ilegível */
    }
  }
  return parts.join(' ')
}

/** Grava o código da chave numa tag NFC como registro de texto. */
export async function writeTag(code: string, signal: AbortSignal) {
  const writer = new NDEFReader()
  await writer.write({ records: [{ recordType: 'text', data: code }] }, { signal })
}

/** Espera a próxima tag encostar e devolve o número de série dela. */
export async function readSerialOnce(signal: AbortSignal): Promise<string | null> {
  const reader = new NDEFReader()
  await reader.scan({ signal })
  return new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Cancelado', 'AbortError')))
    reader.onreading = (ev) => resolve(ev.serialNumber || null)
  })
}
