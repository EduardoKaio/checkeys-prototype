import type { Chave, Estado, Movimento, Reserva, Sala } from '../types'
import { MIN, floorTo, pad, uid } from '../lib/format'

/** Códigos fixos das 17 chaves. São os mesmos da folha de etiquetas de exemplo (PDF). */
export const CODES = [
  'CHK-7F3A9C', 'CHK-2B81D4', 'CHK-C40E57', 'CHK-91AF26', 'CHK-5D0B38', 'CHK-E62C71', 'CHK-38F4A0', 'CHK-A7193E', 'CHK-4C5D82',
  'CHK-F02B69', 'CHK-1E8A47', 'CHK-B39C05', 'CHK-6A47E1', 'CHK-D85F13', 'CHK-0C92BA', 'CHK-8E16D7', 'CHK-73BA4F',
]

/** Reservas simuladas do Módulo de Reservas, com horários relativos ao momento atual. */
export function exampleReservations(now: number) {
  const f = floorTo(now, 30)
  const late = floorTo(now - 25 * MIN, 5)
  const list: Reserva[] = []
  const add = (n: number, titular: string, matricula: string, inicio: number, dur: number, recorrencia: string, status: Reserva['status'] = 'confirmada') => {
    const r: Reserva = { id: uid(), salaId: `s${pad(n)}`, titular, matricula, inicio, fim: inicio + dur * MIN, recorrencia, status, origem: 'exemplo' }
    list.push(r)
    return r
  }
  return {
    list,
    ana: add(3, 'Ana Beatriz Souza', '20230047815', f - 30 * MIN, 120, 'Semanal'),
    pedro: add(5, 'Pedro Henrique Lima', '20220031094', f - 60 * MIN, 150, 'Única'),
    lucas: add(7, 'Lucas Ferreira Dantas', '20230119462', f, 90, 'Semanal'),
    camila: add(9, 'Camila Rocha Bezerra', '20210077340', f - 90 * MIN, 180, 'Quinzenal'),
    julia: add(14, 'Júlia Medeiros Costa', '20210058362', late - 90 * MIN, 90, 'Semanal'),
    rafael: add(11, 'Rafael Monteiro', '20240012707', f + 60 * MIN, 60, 'Quinzenal'),
    beatriz: add(1, 'Beatriz Nogueira', '20240033518', f + 90 * MIN, 120, 'Única'),
    thiago: add(3, 'Thiago Araújo Lins', '20220064127', f + 120 * MIN, 60, 'Semanal'),
    larissa: add(16, 'Larissa Cavalcanti', '20230088251', f - 210 * MIN, 90, 'Semanal'),
    gabriel: add(12, 'Gabriel Souto', '20220090316', f - 30 * MIN, 120, 'Única', 'cancelada'),
  }
}

export function freshState(now: number, operador = 'Recepção', modo: Estado['modo'] = 'qr'): Estado {
  const salas: Sala[] = []
  const chaves: Chave[] = []
  for (let i = 1; i <= 17; i++) {
    salas.push({ id: `s${pad(i)}`, nome: `Sala ${pad(i)}` })
    chaves.push({ id: `k${pad(i)}`, salaId: `s${pad(i)}`, codigo: CODES[i - 1], status: 'disponivel', posse: null, nfcUid: null })
  }
  const ex = exampleReservations(now)
  const movimentos: Movimento[] = []
  const take = (r: Reserva, after: number) => {
    const k = chaves.find((c) => c.salaId === r.salaId)!
    const t = r.inicio + after * MIN
    k.status = 'em_uso'
    k.posse = { reservaId: r.id, titular: r.titular, matricula: r.matricula, desde: t, fim: r.fim, operador: 'Recepção' }
    movimentos.push({ id: uid(), tipo: 'retirada', ts: t, salaId: r.salaId, titular: r.titular, matricula: r.matricula, metodo: 'qr', operador: 'Recepção' })
  }
  take(ex.pedro, 3)
  take(ex.camila, 6)
  take(ex.julia, 4)
  const l = ex.larissa
  movimentos.push({ id: uid(), tipo: 'retirada', ts: l.inicio + 5 * MIN, salaId: l.salaId, titular: l.titular, matricula: l.matricula, metodo: 'nfc', operador: 'Recepção' })
  movimentos.push({ id: uid(), tipo: 'devolucao', ts: l.fim - 10 * MIN, salaId: l.salaId, titular: l.titular, matricula: l.matricula, metodo: 'nfc', operador: 'Recepção', atrasoMin: 0 })
  movimentos.sort((a, b) => b.ts - a.ts)
  return { v: 2, operador, modo, salas, chaves, reservas: ex.list, movimentos }
}
