import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Estado, Metodo, ModoLeitura, Movimento, Reserva, TipoMovimento } from '../types'
import { exampleReservations, freshState } from './seed'
import { minsBetween, uid } from '../lib/format'

/**
 * Estado do protótipo, salvo no próprio aparelho (localStorage).
 * Na versão final, cada ação abaixo vira uma chamada ao back-end em Spring Boot (veja o README).
 */
const STORAGE_KEY = 'checkeys.v2'

function load(): Estado | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as Estado
    if (o && o.v === 2 && Array.isArray(o.chaves) && o.chaves.length) return o
  } catch {
    /* armazenamento indisponível */
  }
  return null
}

function save(s: Estado) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* armazenamento indisponível */
  }
}

export interface Actions {
  setOperador(nome: string): void
  setModo(modo: ModoLeitura): void
  retirar(chaveId: string, reservaId: string, metodo: Metodo): void
  devolver(chaveId: string, metodo: Metodo): number
  registrar(tipo: TipoMovimento, dados: Partial<Movimento> & { metodo: Metodo }): void
  novaReserva(dados: Pick<Reserva, 'salaId' | 'titular' | 'matricula' | 'inicio' | 'fim'>): void
  cancelarReserva(id: string): void
  gerarExemplos(): void
  renomearSala(salaId: string, nome: string): void
  novoCodigo(chaveId: string): string
  vincularNfc(chaveId: string, serial: string | null): void
  restaurar(): void
}

interface StoreValue {
  state: Estado
  actions: Actions
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Estado>(() => load() ?? freshState(Date.now()))
  const ref = useRef(state)
  ref.current = state

  useEffect(() => save(state), [state])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const next = load()
      if (next) setState(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const movimento = useCallback(
    (tipo: TipoMovimento, dados: Partial<Movimento> & { metodo: Metodo }): Movimento => ({
      id: uid(),
      tipo,
      ts: Date.now(),
      operador: ref.current.operador,
      ...dados,
    }),
    [],
  )

  const pushMov = (s: Estado, m: Movimento): Movimento[] => [m, ...s.movimentos].slice(0, 3000)

  const actions = useMemo<Actions>(
    () => ({
      setOperador: (nome) => setState((s) => ({ ...s, operador: nome.trim().slice(0, 40) || s.operador })),
      setModo: (modo) => setState((s) => ({ ...s, modo })),
      retirar: (chaveId, reservaId, metodo) => {
        const s = ref.current
        const r = s.reservas.find((x) => x.id === reservaId)
        const k = s.chaves.find((x) => x.id === chaveId)
        if (!r || !k) return
        const now = Date.now()
        const m = movimento('retirada', { salaId: k.salaId, titular: r.titular, matricula: r.matricula, metodo })
        setState((prev) => ({
          ...prev,
          chaves: prev.chaves.map((c) =>
            c.id === chaveId
              ? { ...c, status: 'em_uso', posse: { reservaId: r.id, titular: r.titular, matricula: r.matricula, desde: now, fim: r.fim, operador: prev.operador } }
              : c,
          ),
          movimentos: pushMov(prev, m),
        }))
      },
      devolver: (chaveId, metodo) => {
        const s = ref.current
        const k = s.chaves.find((x) => x.id === chaveId)
        if (!k?.posse) return 0
        const now = Date.now()
        const atraso = now > k.posse.fim ? minsBetween(k.posse.fim, now) : 0
        const m = movimento('devolucao', { salaId: k.salaId, titular: k.posse.titular, matricula: k.posse.matricula, metodo, atrasoMin: atraso })
        setState((prev) => ({
          ...prev,
          chaves: prev.chaves.map((c) => (c.id === chaveId ? { ...c, status: 'disponivel', posse: null } : c)),
          movimentos: pushMov(prev, m),
        }))
        return atraso
      },
      registrar: (tipo, dados) => {
        const m = movimento(tipo, dados)
        setState((prev) => ({ ...prev, movimentos: pushMov(prev, m) }))
      },
      novaReserva: (dados) => {
        const r: Reserva = { ...dados, id: uid(), recorrencia: 'Única', status: 'confirmada', origem: 'manual' }
        setState((prev) => ({ ...prev, reservas: [...prev.reservas, r] }))
      },
      cancelarReserva: (id) =>
        setState((prev) => ({ ...prev, reservas: prev.reservas.map((r) => (r.id === id ? { ...r, status: 'cancelada' } : r)) })),
      gerarExemplos: () => {
        const ex = exampleReservations(Date.now()).list
        setState((prev) => {
          const novas = ex.filter(
            (r) => !prev.reservas.some((o) => o.salaId === r.salaId && o.status === 'confirmada' && o.inicio < r.fim && r.inicio < o.fim),
          )
          return { ...prev, reservas: [...prev.reservas, ...novas] }
        })
      },
      renomearSala: (salaId, nome) =>
        setState((prev) => ({ ...prev, salas: prev.salas.map((x) => (x.id === salaId ? { ...x, nome: nome.trim().slice(0, 30) || x.nome } : x)) })),
      novoCodigo: (chaveId) => {
        const usados = new Set(ref.current.chaves.map((c) => c.codigo))
        let code = ''
        do {
          code = 'CHK-' + Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0')
        } while (usados.has(code))
        setState((prev) => ({ ...prev, chaves: prev.chaves.map((c) => (c.id === chaveId ? { ...c, codigo: code, nfcUid: null } : c)) }))
        return code
      },
      vincularNfc: (chaveId, serial) =>
        setState((prev) => ({
          ...prev,
          chaves: prev.chaves.map((c) => {
            if (c.id === chaveId) return { ...c, nfcUid: serial }
            if (serial && c.nfcUid === serial) return { ...c, nfcUid: null }
            return c
          }),
        })),
      restaurar: () => setState((prev) => freshState(Date.now(), prev.operador, prev.modo)),
    }),
    [movimento],
  )

  const value = useMemo(() => ({ state, actions }), [state, actions])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore fora do StoreProvider')
  return ctx
}

/** Relógio que atualiza a tela de tempos em tempos (atrasos, reservas em andamento). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}
