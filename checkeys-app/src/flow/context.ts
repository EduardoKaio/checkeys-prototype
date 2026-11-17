import { createContext, useContext } from 'react'
import type { Metodo } from '../types'

export type Sheet =
  | { kind: 'checkin'; chaveId: string; reservaId: string; metodo: Metodo }
  | { kind: 'checkout'; chaveId: string; metodo: Metodo }
  | { kind: 'semReserva'; chaveId: string; metodo: Metodo }
  | { kind: 'desconhecida'; codigo: string | null; raw: string; serial: string | null }
  | { kind: 'entregue'; salaId: string; titular: string; fim: number; ts: number }
  | { kind: 'devolvida'; salaId: string; atraso: number; ts: number }
  | { kind: 'negada'; salaId: string; titular: string; ts: number }
  | { kind: 'manual' }
  | { kind: 'simular' }
  | { kind: 'sala'; salaId: string }
  | { kind: 'reserva'; reservaId: string }
  | { kind: 'novaReserva' }
  | { kind: 'chave'; chaveId: string }
  | { kind: 'vincular'; serial: string }

export interface Flow {
  /** Trata um código lido (QR, NFC, digitado ou simulado) e abre a confirmação certa. */
  processar(raw: string, metodo: Metodo, extra?: { serial?: string | null }): void
  /** Abre retirada ou devolução de uma chave sem leitura (etiqueta danificada). */
  abrirChave(chaveId: string, metodo: Metodo): void
  /** Evita ler o mesmo QR várias vezes seguidas enquanto ele continua na frente da câmera. */
  aceitarLeitura(raw: string): boolean
  open(sheet: Sheet): void
  close(): void
  sheetOpen: boolean
  ultima: { texto: string; erro: boolean } | null
}

export const FlowContext = createContext<Flow | null>(null)

export function useFlow() {
  const flow = useContext(FlowContext)
  if (!flow) throw new Error('useFlow fora do FlowProvider')
  return flow
}
