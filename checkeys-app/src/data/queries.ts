import type { Chave, Estado, EstadoChave, Metodo, Reserva, TipoMovimento, Tom } from '../types'
import { dayKey } from '../lib/format'

export const salaNome = (s: Estado, salaId?: string) => s.salas.find((x) => x.id === salaId)?.nome ?? 'Sala'

export const chaveDaSala = (s: Estado, salaId: string) => s.chaves.find((k) => k.salaId === salaId)

/** Simula o Módulo de Reservas: reserva confirmada para a sala neste momento. */
export const reservaAtiva = (s: Estado, salaId: string, t = Date.now()) =>
  s.reservas.find((r) => r.salaId === salaId && r.status === 'confirmada' && r.inicio <= t && t < r.fim)

export const proximaReserva = (s: Estado, salaId: string, t = Date.now()) =>
  s.reservas
    .filter((r) => r.salaId === salaId && r.status === 'confirmada' && r.inicio > t && dayKey(r.inicio) === dayKey(t))
    .sort((a, b) => a.inicio - b.inicio)[0]

export const estadoChave = (k: Chave, t = Date.now()): EstadoChave => {
  if (k.status === 'em_uso' && k.posse) return t > k.posse.fim ? 'late' : 'use'
  return 'ok'
}

export const STATUS_LABEL: Record<EstadoChave, string> = { ok: 'Disponível', use: 'Em uso', late: 'Atrasada' }

export const METODO_LABEL: Record<Metodo, string> = {
  qr: 'QR Code',
  nfc: 'NFC',
  manual: 'Código digitado',
  simulado: 'Simulação',
  sem_leitura: 'Sem leitura',
}

export const TIPO_INFO: Record<TipoMovimento, { label: string; tom: Tom }> = {
  retirada: { label: 'Retirada', tom: 'use' },
  devolucao: { label: 'Devolução', tom: 'pri' },
  negada: { label: 'Negada', tom: 'late' },
  bloqueada: { label: 'Sem reserva', tom: 'warn' },
  desconhecida: { label: 'Não reconhecida', tom: 'muted' },
}

export function statusReserva(s: Estado, r: Reserva, now = Date.now()): { label: string; tom: Tom } {
  if (r.status === 'cancelada') return { label: 'Cancelada', tom: 'muted' }
  if (r.fim <= now) return { label: 'Encerrada', tom: 'muted' }
  if (r.inicio <= now) {
    const k = chaveDaSala(s, r.salaId)
    if (k?.status === 'em_uso' && k.posse?.reservaId === r.id) return { label: 'Chave retirada', tom: 'use' }
    return { label: 'Aguardando retirada', tom: 'info' }
  }
  return { label: 'Próxima', tom: 'ok' }
}
