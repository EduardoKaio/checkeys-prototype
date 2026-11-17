import { useState } from 'react'
import { Alert, Box, Button, Card, CardActionArea, Stack, Typography } from '@mui/material'
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded'
import KeyOutlined from '@mui/icons-material/KeyOutlined'
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { useNow, useStore } from '../data/store'
import { STATUS_LABEL, estadoChave, proximaReserva, reservaAtiva, salaNome } from '../data/queries'
import { cap, dayKey, durTxt, hm, longDate, minsBetween } from '../lib/format'
import { useFlow } from '../flow/context'
import { PageHeader, SectionTitle, StatusChip } from '../components/common'
import { m3, tones } from '../theme'
import type { EstadoChave } from '../types'

type Filtro = 'todas' | EstadoChave

export default function Painel() {
  const { state, actions } = useStore()
  const { open } = useFlow()
  const now = useNow()
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const cards = state.chaves.map((k) => ({ k, st: estadoChave(k, now) }))
  const count = { ok: 0, use: 0, late: 0 }
  cards.forEach((c) => count[c.st]++)
  const atrasadas = cards.filter((c) => c.st === 'late')
  const temReservasHoje = state.reservas.some((r) => dayKey(r.inicio) === dayKey(now))
  const shown = cards.filter((c) => filtro === 'todas' || c.st === filtro)

  const stats: Array<{ key: EstadoChave; label: string; icon: React.ReactNode; color: string }> = [
    { key: 'ok', label: 'Disponíveis', icon: <CheckCircleOutlineRounded />, color: tones.ok.fg },
    { key: 'use', label: 'Em uso', icon: <KeyOutlined />, color: tones.use.fg },
    { key: 'late', label: 'Atrasadas', icon: <WarningAmberRounded />, color: tones.late.fg },
  ]

  return (
    <Stack spacing={3}>
      <PageHeader title="Painel da recepção" subtitle={`${cap(longDate(now))} · atualizado às ${hm(now)}`} />

      {atrasadas.length > 0 && (
        <Alert severity="error" variant="standard" icon={<WarningAmberRounded />}>
          <b>
            {atrasadas.length === 1 ? '1 chave passou' : `${atrasadas.length} chaves passaram`} do horário de devolução:
          </b>{' '}
          {atrasadas.map((c) => `${salaNome(state, c.k.salaId)} (${c.k.posse!.titular.split(' ')[0]}, há ${durTxt(minsBetween(c.k.posse!.fim, now))})`).join(', ')}.
        </Alert>
      )}

      {!temReservasHoje && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={actions.gerarExemplos}>
              Gerar exemplos
            </Button>
          }
        >
          Não há reservas para hoje no Módulo de Reservas (simulado).
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5, maxWidth: 640 }} role="group" aria-label="Filtrar salas">
        {stats.map((s) => {
          const selected = filtro === s.key
          return (
            <Card key={s.key} sx={{ bgcolor: selected ? m3.secondaryContainer : 'background.paper', borderColor: selected ? 'transparent' : undefined }}>
              <CardActionArea onClick={() => setFiltro(selected ? 'todas' : s.key)} aria-pressed={selected} sx={{ p: 2 }}>
                <Box sx={{ color: s.color, display: 'flex', mb: 0.5 }}>{s.icon}</Box>
                <Typography sx={{ fontSize: 34, lineHeight: 1.15, fontWeight: 400, color: s.key === 'late' && count.late ? tones.late.fg : 'text.primary' }}>{count[s.key]}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {s.label}
                </Typography>
              </CardActionArea>
            </Card>
          )
        })}
      </Box>

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <SectionTitle count={`${shown.length} de 17`}>{filtro === 'todas' ? 'Salas' : stats.find((s) => s.key === filtro)!.label}</SectionTitle>
          {filtro !== 'todas' && (
            <Button size="small" startIcon={<CloseRounded />} onClick={() => setFiltro('todas')} sx={{ mb: 1 }}>
              Limpar filtro
            </Button>
          )}
        </Stack>
        {shown.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Nenhuma sala nesta situação agora.</Card>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(auto-fill, minmax(200px, 1fr))' }, gap: 1.5 }}>
            {shown.map(({ k, st }) => {
              let line: React.ReactNode
              if (st === 'use')
                line = (
                  <>
                    Com <b>{k.posse!.titular}</b>
                    <br />
                    até {hm(k.posse!.fim)}
                  </>
                )
              else if (st === 'late')
                line = (
                  <>
                    Com <b>{k.posse!.titular}</b>
                    <br />
                    atrasada há {durTxt(minsBetween(k.posse!.fim, now))}
                  </>
                )
              else {
                const a = reservaAtiva(state, k.salaId, now)
                const n = proximaReserva(state, k.salaId, now)
                line = a ? (
                  <>
                    Reservada agora para <b>{a.titular}</b>, aguardando retirada
                  </>
                ) : n ? (
                  <>
                    Próxima reserva às <b>{hm(n.inicio)}</b>
                  </>
                ) : (
                  'Sem outras reservas hoje'
                )
              }
              const late = st === 'late'
              return (
                <Card key={k.id} sx={{ bgcolor: late ? tones.late.bg : 'background.paper', borderColor: late ? 'transparent' : undefined }}>
                  <CardActionArea onClick={() => open({ kind: 'sala', salaId: k.salaId })} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', gap: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle1" sx={{ color: late ? tones.late.fg : 'text.primary' }}>
                        {salaNome(state, k.salaId)}
                      </Typography>
                      <StatusChip tom={st} label={STATUS_LABEL[st]} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: late ? tones.late.fg : 'text.secondary', '& b': { color: late ? tones.late.fg : 'text.primary', fontWeight: 500 } }}>
                      {line}
                    </Typography>
                  </CardActionArea>
                </Card>
              )
            })}
          </Box>
        )}
      </Box>
    </Stack>
  )
}
