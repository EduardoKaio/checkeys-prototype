import { Alert, Box, Button, Card, List, ListItemButton, Stack, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import { useNow, useStore } from '../data/store'
import { salaNome, statusReserva } from '../data/queries'
import { cap, dayKey, hm, longDate } from '../lib/format'
import { useFlow } from '../flow/context'
import { PageHeader, SectionTitle, StatusChip, TonalButton } from '../components/common'
import { mono } from '../theme'
import type { Reserva } from '../types'

export default function Reservas() {
  const { state, actions } = useStore()
  const { open } = useFlow()
  const now = useNow()
  const hoje = state.reservas.filter((r) => dayKey(r.inicio) === dayKey(now)).sort((a, b) => a.inicio - b.inicio)
  const andamento = hoje.filter((r) => r.status === 'confirmada' && r.inicio <= now && now < r.fim)
  const proximas = hoje.filter((r) => r.status === 'confirmada' && r.inicio > now)
  const outras = hoje.filter((r) => r.status !== 'confirmada' || r.fim <= now)

  const group = (title: string, list: Reserva[]) =>
    list.length > 0 && (
      <Box>
        <SectionTitle count={list.length}>{title}</SectionTitle>
        <Card>
          <List disablePadding>
            {list.map((r, i) => {
              const s = statusReserva(state, r, now)
              return (
                <ListItemButton key={r.id} onClick={() => open({ kind: 'reserva', reservaId: r.id })} divider={i < list.length - 1} sx={{ borderRadius: 0, gap: 2, py: 1.5 }}>
                  <Box sx={{ width: 52, flexShrink: 0, fontFamily: mono }}>
                    <Typography sx={{ fontFamily: mono, fontWeight: 500, fontSize: 15 }}>{hm(r.inicio)}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
                      {hm(r.fim)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1">{salaNome(state, r.salaId)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {r.titular}
                    </Typography>
                  </Box>
                  <StatusChip tom={s.tom} label={s.label} />
                </ListItemButton>
              )
            })}
          </List>
        </Card>
      </Box>
    )

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Reservas de hoje"
        subtitle={cap(longDate(now))}
        action={
          <TonalButton startIcon={<AddRounded />} onClick={() => open({ kind: 'novaReserva' })}>
            Nova reserva
          </TonalButton>
        }
      />
      <Alert severity="info" variant="outlined" sx={{ bgcolor: 'background.paper' }}>
        Estas reservas simulam o Módulo de Reservas do grupo parceiro. No sistema final, elas chegam pela integração.
      </Alert>
      {hoje.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Nenhuma reserva para hoje.
          </Typography>
          <Button variant="contained" onClick={actions.gerarExemplos}>
            Gerar reservas de exemplo
          </Button>
        </Card>
      ) : (
        <>
          {group('Em andamento', andamento)}
          {group('Próximas', proximas)}
          {group('Encerradas e canceladas', outras)}
        </>
      )}
    </Stack>
  )
}
