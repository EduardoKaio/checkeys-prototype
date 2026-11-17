import { useMemo, useState } from 'react'
import { Avatar, Box, Card, Chip, InputAdornment, List, ListItem, ListItemAvatar, ListItemText, Stack, TextField, Typography } from '@mui/material'
import CheckRounded from '@mui/icons-material/CheckRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import NorthEastRounded from '@mui/icons-material/NorthEastRounded'
import SouthWestRounded from '@mui/icons-material/SouthWestRounded'
import BlockRounded from '@mui/icons-material/BlockRounded'
import EventBusyRounded from '@mui/icons-material/EventBusyRounded'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'
import { useStore } from '../data/store'
import { METODO_LABEL, TIPO_INFO, salaNome } from '../data/queries'
import { cap, dayKey, durTxt, hm, longDate } from '../lib/format'
import { PageHeader } from '../components/common'
import { m3, mono, tones } from '../theme'
import type { Movimento, TipoMovimento } from '../types'

type Filtro = 'todos' | 'retirada' | 'devolucao' | 'ocorrencias'

const ICONS: Record<TipoMovimento, React.ReactNode> = {
  retirada: <NorthEastRounded fontSize="small" />,
  devolucao: <SouthWestRounded fontSize="small" />,
  negada: <BlockRounded fontSize="small" />,
  bloqueada: <EventBusyRounded fontSize="small" />,
  desconhecida: <HelpOutlineRounded fontSize="small" />,
}

export default function Historico() {
  const { state } = useStore()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busca, setBusca] = useState('')

  const groups = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const items = state.movimentos
      .filter((m) => {
        if (filtro === 'retirada' && m.tipo !== 'retirada') return false
        if (filtro === 'devolucao' && m.tipo !== 'devolucao') return false
        if (filtro === 'ocorrencias' && (m.tipo === 'retirada' || m.tipo === 'devolucao')) return false
        if (q) {
          const hay = `${m.salaId ? salaNome(state, m.salaId) : ''} ${m.titular ?? ''} ${m.matricula ?? ''} ${m.codigo ?? ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .slice(0, 300)
    const out: Array<{ day: string; items: Movimento[] }> = []
    for (const m of items) {
      const d = dayKey(m.ts)
      if (!out.length || out[out.length - 1].day !== d) out.push({ day: d, items: [] })
      out[out.length - 1].items.push(m)
    }
    return out
  }, [state, filtro, busca])

  const today = dayKey(Date.now())
  const yesterday = dayKey(Date.now() - 864e5)
  const filtros: Array<[Filtro, string]> = [
    ['todos', 'Todos'],
    ['retirada', 'Retiradas'],
    ['devolucao', 'Devoluções'],
    ['ocorrencias', 'Ocorrências'],
  ]

  return (
    <Stack spacing={2.5}>
      <PageHeader title="Histórico" subtitle="Retiradas, devoluções e ocorrências registradas neste aparelho." />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap role="group" aria-label="Filtrar histórico">
        {filtros.map(([key, label]) => {
          const on = filtro === key
          return (
            <Chip
              key={key}
              label={label}
              icon={on ? <CheckRounded /> : undefined}
              onClick={() => setFiltro(key)}
              variant={on ? 'filled' : 'outlined'}
              aria-pressed={on}
              sx={{ height: 34, bgcolor: on ? m3.secondaryContainer : 'transparent', color: on ? m3.onSecondaryContainer : 'text.secondary', borderColor: m3.outlineVariant, '& .MuiChip-icon': { color: 'inherit' } }}
            />
          )
        })}
      </Stack>
      <TextField
        placeholder="Buscar por sala, nome ou matrícula"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded />
              </InputAdornment>
            ),
            sx: { borderRadius: 999, bgcolor: m3.surfaceHigh, '& fieldset': { border: 'none' } },
          },
          htmlInput: { 'aria-label': 'Buscar no histórico' },
        }}
      />
      {groups.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Nada registrado com esse filtro.</Card>
      ) : (
        <Card>
          {groups.map((g) => (
            <Box key={g.day}>
              <Typography variant="subtitle2" color="primary" sx={{ px: 2, pt: 2 }}>
                {g.day === today ? 'Hoje' : g.day === yesterday ? 'Ontem' : cap(longDate(g.items[0].ts))}
              </Typography>
              <List>
                {g.items.map((m) => {
                  const t = TIPO_INFO[m.tipo]
                  const parts = [t.label]
                  if (m.titular) parts.push(m.titular)
                  if (m.tipo === 'devolucao' && m.atrasoMin) parts.push(`atraso de ${durTxt(m.atrasoMin)}`)
                  if (m.detalhe) parts.push(m.detalhe)
                  return (
                    <ListItem
                      key={m.id}
                      secondaryAction={
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ fontFamily: mono, display: 'block' }}>
                            {hm(m.ts)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {METODO_LABEL[m.metodo]}
                          </Typography>
                        </Box>
                      }
                      sx={{ pr: 13 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: tones[t.tom].bg, color: tones[t.tom].fg, width: 40, height: 40 }}>{ICONS[m.tipo]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={m.salaId ? salaNome(state, m.salaId) : <span style={{ fontFamily: mono }}>{m.codigo || 'Leitura'}</span>}
                        secondary={parts.join(' · ')}
                      />
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          ))}
        </Card>
      )}
    </Stack>
  )
}
