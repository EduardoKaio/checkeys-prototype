// Tipos mínimos da Web NFC (Chrome para Android). https://w3c.github.io/web-nfc/

interface NDEFRecord {
  recordType: string
  mediaType?: string
  id?: string
  data?: DataView
  encoding?: string
  lang?: string
}

interface NDEFMessage {
  records: NDEFRecord[]
}

interface NDEFReadingEvent extends Event {
  serialNumber: string
  message: NDEFMessage
}

interface NDEFRecordInit {
  recordType: string
  data?: string
  lang?: string
}

interface NDEFReader extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>
  write(
    message: string | { records: NDEFRecordInit[] },
    options?: { signal?: AbortSignal; overwrite?: boolean },
  ): Promise<void>
  onreading: ((this: NDEFReader, ev: NDEFReadingEvent) => void) | null
  onreadingerror: ((this: NDEFReader, ev: Event) => void) | null
}

declare var NDEFReader: {
  prototype: NDEFReader
  new (): NDEFReader
}
