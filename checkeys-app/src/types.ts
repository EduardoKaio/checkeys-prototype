export type Metodo = 'qr' | 'nfc' | 'manual' | 'simulado' | 'sem_leitura'
export type TipoMovimento = 'retirada' | 'devolucao' | 'negada' | 'bloqueada' | 'desconhecida'
export type ModoLeitura = 'qr' | 'nfc'
export type EstadoChave = 'ok' | 'use' | 'late'
export type Tom = 'ok' | 'use' | 'late' | 'info' | 'pri' | 'warn' | 'muted'

export interface Sala {
  id: string
  nome: string
}

export interface Posse {
  reservaId: string
  titular: string
  matricula: string
  desde: number
  fim: number
  operador: string
}

export interface Chave {
  id: string
  salaId: string
  codigo: string
  status: 'disponivel' | 'em_uso'
  posse: Posse | null
  nfcUid: string | null
}

export interface Reserva {
  id: string
  salaId: string
  titular: string
  matricula: string
  inicio: number
  fim: number
  recorrencia: string
  status: 'confirmada' | 'cancelada'
  origem: 'exemplo' | 'manual'
}

export interface Movimento {
  id: string
  tipo: TipoMovimento
  ts: number
  operador: string
  metodo: Metodo
  salaId?: string
  titular?: string
  matricula?: string
  atrasoMin?: number
  codigo?: string
  detalhe?: string
}

export interface Estado {
  v: 2
  operador: string
  modo: ModoLeitura
  salas: Sala[]
  chaves: Chave[]
  reservas: Reserva[]
  movimentos: Movimento[]
}
