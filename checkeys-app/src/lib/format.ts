export const MIN = 60_000

export const pad = (n: number) => String(n).padStart(2, '0')

export const hm = (t: number) => {
  const d = new Date(t)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const dayKey = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export const longDate = (t: number) => {
  const d = new Date(t)
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const uid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID()
    } catch {
      /* contexto inseguro */
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export const floorTo = (t: number, minutos: number) => {
  const d = new Date(t)
  d.setSeconds(0, 0)
  d.setMinutes(Math.floor(d.getMinutes() / minutos) * minutos)
  return d.getTime()
}

export const minsBetween = (a: number, b: number) => Math.max(0, Math.round((b - a) / MIN))

export const durTxt = (m: number) => {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h}h${r ? pad(r) : ''}`
}

/** Extrai o código da chave (CHK-XXXXXX) de qualquer texto lido: código puro, link do sistema ou registro NFC. */
export const extractCode = (raw: string | null | undefined): string | null => {
  if (!raw) return null
  const s = String(raw).toUpperCase().trim()
  const m = s.match(/CHK-[0-9A-F]{6}/)
  if (m) return m[0]
  if (/^[0-9A-F]{6}$/.test(s)) return `CHK-${s}`
  return null
}
