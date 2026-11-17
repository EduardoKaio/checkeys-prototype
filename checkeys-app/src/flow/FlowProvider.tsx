import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { FlowContext, type Flow, type Sheet } from './context'
import SheetContent from './sheets'
import ResponsiveSheet from '../components/ResponsiveSheet'
import { useStore } from '../data/store'
import { reservaAtiva, salaNome } from '../data/queries'
import { extractCode, hm } from '../lib/format'
import { feedback } from '../lib/feedback'
import type { Chave, Metodo } from '../types'

const COOLDOWN_MS = 3500

export function FlowProvider({ children }: { children: ReactNode }) {
  const { state, actions } = useStore()
  const stateRef = useRef(state)
  stateRef.current = state

  const [sheet, setSheet] = useState<Sheet | null>(null)
  const sheetRef = useRef<Sheet | null>(null)
  sheetRef.current = sheet
  const lastShown = useRef<Sheet | null>(null)
  if (sheet) lastShown.current = sheet

  const [ultima, setUltima] = useState<Flow['ultima']>(null)
  const lastRead = useRef({ raw: '', until: 0 })

  const open = useCallback((s: Sheet) => setSheet(s), [])
  const close = useCallback(() => {
    setSheet(null)
    if (lastRead.current.raw) lastRead.current.until = Date.now() + COOLDOWN_MS
  }, [])

  const aceitarLeitura = useCallback((raw: string) => {
    if (sheetRef.current) return false
    const now = Date.now()
    if (raw === lastRead.current.raw && now < lastRead.current.until) return false
    lastRead.current = { raw, until: Number.POSITIVE_INFINITY }
    return true
  }, [])

  const abrir = useCallback(
    (k: Chave, metodo: Metodo) => {
      const s = stateRef.current
      if (k.status === 'em_uso') {
        setSheet({ kind: 'checkout', chaveId: k.id, metodo })
        return
      }
      const r = reservaAtiva(s, k.salaId)
      if (!r) {
        actions.registrar('bloqueada', { metodo, salaId: k.salaId })
        setSheet({ kind: 'semReserva', chaveId: k.id, metodo })
        return
      }
      setSheet({ kind: 'checkin', chaveId: k.id, reservaId: r.id, metodo })
    },
    [actions],
  )

  const processar = useCallback<Flow['processar']>(
    (raw, metodo, extra) => {
      const s = stateRef.current
      const code = extractCode(raw)
      const serial = extra?.serial ?? null
      let k = code ? s.chaves.find((c) => c.codigo === code) : undefined
      if (!k && serial) k = s.chaves.find((c) => c.nfcUid === serial)
      const leitura = metodo === 'qr' || metodo === 'nfc'
      if (!k) {
        if (leitura) feedback(false)
        actions.registrar('desconhecida', {
          metodo,
          codigo: (code ?? (raw || serial || '')).slice(0, 60),
          detalhe: serial ? `Tag ${serial}` : undefined,
        })
        setUltima({ texto: 'Última leitura não reconhecida.', erro: true })
        setSheet({ kind: 'desconhecida', codigo: code, raw: (raw || '').slice(0, 80), serial })
        return
      }
      if (leitura) feedback(true)
      setUltima({ texto: `Última leitura: ${salaNome(s, k.salaId)} às ${hm(Date.now())}.`, erro: false })
      abrir(k, metodo)
    },
    [actions, abrir],
  )

  const abrirChave = useCallback(
    (chaveId: string, metodo: Metodo) => {
      const k = stateRef.current.chaves.find((c) => c.id === chaveId)
      if (k) abrir(k, metodo)
    },
    [abrir],
  )

  const value = useMemo<Flow>(
    () => ({ processar, abrirChave, aceitarLeitura, open, close, sheetOpen: !!sheet, ultima }),
    [processar, abrirChave, aceitarLeitura, open, close, sheet, ultima],
  )

  const shown = sheet ?? lastShown.current
  return (
    <FlowContext.Provider value={value}>
      {children}
      <ResponsiveSheet open={!!sheet} onClose={close} label="Detalhes" contentKey={shown ? JSON.stringify(shown) : undefined}>
        {shown && <SheetContent sheet={shown} />}
      </ResponsiveSheet>
    </FlowContext.Provider>
  )
}
