import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { Avatar, Box, Button, ButtonBase, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material'
import CheckRounded from '@mui/icons-material/CheckRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import NorthEastRounded from '@mui/icons-material/NorthEastRounded'
import SouthWestRounded from '@mui/icons-material/SouthWestRounded'
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded'
import EventBusyRounded from '@mui/icons-material/EventBusyRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import BlockRounded from '@mui/icons-material/BlockRounded'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import QrCodeScannerRounded from '@mui/icons-material/QrCodeScannerRounded'
import NfcRounded from '@mui/icons-material/NfcRounded'
import LinkRounded from '@mui/icons-material/LinkRounded'
import LinkOffRounded from '@mui/icons-material/LinkOffRounded'
import AutorenewRounded from '@mui/icons-material/AutorenewRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { useFlow, type Sheet } from './context'
import { useStore } from '../data/store'
import { METODO_LABEL, STATUS_LABEL, TIPO_INFO, estadoChave, proximaReserva, reservaAtiva, salaNome, statusReserva } from '../data/queries'
import { cap, dayKey, durTxt, extractCode, floorTo, hm, longDate, MIN, minsBetween, pad } from '../lib/format'
import { nfcSupported } from '../lib/device'
import { readSerialOnce, writeTag } from '../lib/nfc'
import { useToast } from '../components/Toast'
import { Field, Mono, StatusChip, TonalButton } from '../components/common'
import { nfcIndisponivelMotivo } from '../components/NfcPanel'
import { m3, mono, tones } from '../theme'
import type { Chave, Metodo } from '../types'

export default function SheetContent({ sheet }: { sheet: Sheet }) {
  switch (sheet.kind) {
    case 'checkin':
      return <CheckinSheet chaveId={sheet.chaveId} reservaId={sheet.reservaId} metodo={sheet.metodo} />
    case 'checkout':
      return <CheckoutSheet chaveId={sheet.chaveId} metodo={sheet.metodo} />
    case 'semReserva':
      return <SemReservaSheet chaveId={sheet.chaveId} metodo={sheet.metodo} />
    case 'desconhecida':
      return <DesconhecidaSheet codigo={sheet.codigo} raw={sheet.raw} serial={sheet.serial} />
    case 'entregue':
    case 'devolvida':
    case 'negada':
      return <ResultadoSheet sheet={sheet} />
    case 'manual':
      return <ManualSheet />
    case 'simular':
      return <SimularSheet />
    case 'sala':
      return <SalaSheet salaId={sheet.salaId} />
    case 'reserva':
      return <ReservaSheet reservaId={sheet.reservaId} />
    case 'novaReserva':
      return <NovaReservaSheet />
    case 'chave':
      return <ChaveSheet chaveId={sheet.chaveId} />
    case 'vincular':
      return <VincularSheet serial={sheet.serial} />
  }
}

/* ---------- peças comuns ---------- */

function ModeBadge({ modo }: { modo: 'in' | 'out' }) {
  const t = modo === 'in' ? tones.use : tones.pri
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: t.bg, color: t.fg, borderRadius: '8px', px: 1.5, height: 32 }}>
      {modo === 'in' ? <NorthEastRounded fontSize="small" /> : <SouthWestRounded fontSize="small" />}
      <Typography variant="subtitle2">{modo === 'in' ? 'Retirada' : 'Devolução'}</Typography>
      <Typography variant="caption" sx={{ fontFamily: mono, opacity: 0.8 }}>
        {modo === 'in' ? 'check-in' : 'check-out'}
      </Typography>
    </Stack>
  )
}

function SheetTop({ modo, chave, metodo }: { modo: 'in' | 'out'; chave: Chave; metodo: Metodo }) {
  const { state } = useStore()
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <ModeBadge modo={modo} />
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
          {hm(Date.now())}
        </Typography>
      </Stack>
      <Box>
        <Typography variant="h4" component="h2">
          {salaNome(state, chave.salaId)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Mono>{chave.codigo}</Mono> · {METODO_LABEL[metodo]}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {modo === 'in' ? 'A chave estava na bancada, então esta leitura é uma retirada.' : 'A chave estava em uso, então esta leitura é uma devolução.'}
      </Typography>
    </Stack>
  )
}

function ReservaCard({ call, chip, children, footer }: { call: string; chip?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '16px', overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ px: 2, pt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Avatar sx={{ bgcolor: m3.secondaryContainer, color: m3.onSecondaryContainer, width: 40, height: 40 }}>
            <EventAvailableRounded fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">Módulo de Reservas</Typography>
            <Typography variant="caption" color="text.secondary">
              Grupo parceiro
            </Typography>
          </Box>
        </Stack>
        {chip}
      </Stack>
      <Typography variant="caption" component="code" color="text.secondary" sx={{ display: 'block', fontFamily: mono, px: 2, pt: 1.5, pb: 1.5, overflowWrap: 'anywhere' }}>
        {call}
      </Typography>
      <Divider />
      <Box sx={{ p: 2 }}>{children}</Box>
      {footer && <Box sx={{ bgcolor: m3.surfaceContainer, p: 2 }}>{footer}</Box>}
    </Box>
  )
}

function Fields({ children }: { children: ReactNode }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>{children}</Box>
}

/** Ações presas no rodapé da folha: continuam visíveis mesmo quando o conteúdo rola. */
function StickyActions({ children }: { children: ReactNode }) {
  return (
    <Stack
      spacing={1}
      sx={{
        position: { xs: 'sticky', md: 'static' },
        bottom: 0,
        zIndex: 1,
        bgcolor: 'background.paper',
        mx: { xs: -3, md: 0 },
        px: { xs: 3, md: 0 },
        pt: { xs: 1.5, md: 0 },
        pb: { xs: 'calc(12px + env(safe-area-inset-bottom))', md: 0 },
        boxShadow: { xs: '0 -12px 12px -12px rgba(0, 0, 0, .18)', md: 'none' },
      }}
    >
      {children}
    </Stack>
  )
}

function Note({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ bgcolor: tones.warn.bg, color: tones.warn.fg, borderRadius: '12px', px: 2, py: 1.5 }}>
      {icon ?? <InfoOutlined fontSize="small" sx={{ mt: '2px' }} />}
      <Typography variant="body2">{children}</Typography>
    </Stack>
  )
}

function Result({ tom, icon, title, children, meta }: { tom: 'ok' | 'late' | 'warn'; icon: ReactNode; title: string; children: ReactNode; meta?: string }) {
  const t = tones[tom]
  return (
    <Stack alignItems="center" spacing={1} sx={{ textAlign: 'center', pt: 1 }}>
      <Box sx={{ width: 88, height: 88, borderRadius: '50%', bgcolor: t.bg, color: t.fg, display: 'grid', placeItems: 'center', mb: 1, '& svg': { fontSize: 48 } }}>{icon}</Box>
      <Typography variant="h5" component="h2">
        {title}
      </Typography>
      <Box sx={{ color: 'text.secondary', maxWidth: 380 }}>{children}</Box>
      {meta && (
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
          {meta}
        </Typography>
      )}
    </Stack>
  )
}

function Gone() {
  const { close } = useFlow()
  return (
    <Stack spacing={2}>
      <Typography>Este registro não existe mais.</Typography>
      <Button variant="contained" onClick={close}>
        Fechar
      </Button>
    </Stack>
  )
}

/** Fecha a folha e volta para a tela de leitura, com a câmera pronta para a próxima chave. */
function useNextRead() {
  const { close } = useFlow()
  const navigate = useNavigate()
  const location = useLocation()
  return () => {
    close()
    if (location.pathname !== '/ler') navigate('/ler')
  }
}

/* ---------- leitura ---------- */

function CheckinSheet({ chaveId, reservaId, metodo }: { chaveId: string; reservaId: string; metodo: Metodo }) {
  const { state, actions } = useStore()
  const { open } = useFlow()
  const k = state.chaves.find((c) => c.id === chaveId)
  const r = state.reservas.find((x) => x.id === reservaId)
  if (!k || !r) return <Gone />
  return (
    <Stack spacing={2.5}>
      <SheetTop modo="in" chave={k} metodo={metodo} />
      <ReservaCard
        call={`GET /reservas/ativa?sala=${k.salaId}`}
        chip={<StatusChip tom="ok" label="Reserva encontrada" />}
        footer={
          <>
            <Typography variant="subtitle1">Quem está no balcão é {r.titular}, que fez esta reserva?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Confira um documento ou a carteirinha. A chave só é entregue ao titular da reserva.
            </Typography>
          </>
        }
      >
        <Fields>
          <Field label="Titular" wide>
            {r.titular}
          </Field>
          <Field label="Matrícula">
            <Mono>{r.matricula}</Mono>
          </Field>
          <Field label="Recorrência">{r.recorrencia}</Field>
          <Field label="Horário" wide>
            Hoje, {hm(r.inicio)} às {hm(r.fim)}
          </Field>
        </Fields>
      </ReservaCard>
      <StickyActions>
        <Button
          variant="contained"
          size="large"
          startIcon={<CheckRounded />}
          onClick={() => {
            actions.retirar(k.id, r.id, metodo)
            open({ kind: 'entregue', salaId: k.salaId, titular: r.titular, fim: r.fim, ts: Date.now() })
          }}
        >
          Sim, entregar a chave
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<CloseRounded />}
          onClick={() => {
            actions.registrar('negada', { metodo, salaId: k.salaId, titular: r.titular, matricula: r.matricula, detalhe: 'Não era o titular' })
            open({ kind: 'negada', salaId: k.salaId, titular: r.titular, ts: Date.now() })
          }}
        >
          Não, é outra pessoa
        </Button>
      </StickyActions>
    </Stack>
  )
}

function CheckoutSheet({ chaveId, metodo }: { chaveId: string; metodo: Metodo }) {
  const { state, actions } = useStore()
  const { open, close } = useFlow()
  const k = state.chaves.find((c) => c.id === chaveId)
  if (!k || !k.posse) return <Gone />
  const p = k.posse
  const now = Date.now()
  const atraso = now > p.fim ? minsBetween(p.fim, now) : 0
  return (
    <Stack spacing={2.5}>
      <SheetTop modo="out" chave={k} metodo={metodo} />
      <ReservaCard
        call={`GET /reservas/${p.reservaId.slice(0, 8)}`}
        chip={atraso ? <StatusChip tom="late" label={`Encerrada há ${durTxt(atraso)}`} /> : <StatusChip tom="ok" label="Dentro do horário" />}
      >
        <Fields>
          <Field label="Está com" wide>
            {p.titular}
          </Field>
          <Field label="Matrícula">
            <Mono>{p.matricula}</Mono>
          </Field>
          <Field label="Retirada às">{hm(p.desde)}</Field>
          <Field label="Reserva até" wide>
            {hm(p.fim)}
            {dayKey(p.fim) !== dayKey(now) ? ` de ${longDate(p.fim)}` : ''}
          </Field>
        </Fields>
      </ReservaCard>
      {atraso > 0 && <Note icon={<ScheduleRounded fontSize="small" sx={{ mt: '2px' }} />}>A devolução vai ficar registrada com {durTxt(atraso)} de atraso.</Note>}
      <StickyActions>
        <Button
          variant="contained"
          size="large"
          startIcon={<CheckRounded />}
          onClick={() => {
            const a = actions.devolver(k.id, metodo)
            open({ kind: 'devolvida', salaId: k.salaId, atraso: a, ts: Date.now() })
          }}
        >
          Confirmar devolução
        </Button>
        <Button size="large" onClick={close}>
          Cancelar
        </Button>
      </StickyActions>
    </Stack>
  )
}

function SemReservaSheet({ chaveId, metodo }: { chaveId: string; metodo: Metodo }) {
  const { state } = useStore()
  const { close } = useFlow()
  const k = state.chaves.find((c) => c.id === chaveId)
  if (!k) return <Gone />
  const now = Date.now()
  const n = proximaReserva(state, k.salaId, now)
  return (
    <Stack spacing={2.5}>
      <SheetTop modo="in" chave={k} metodo={metodo} />
      <ReservaCard call={`GET /reservas/ativa?sala=${k.salaId}`} chip={<StatusChip tom="warn" label="Sem reserva agora" />}>
        <Typography>
          Nenhuma reserva ativa para a {salaNome(state, k.salaId)} às {hm(now)}.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {n ? `Próxima: ${hm(n.inicio)} às ${hm(n.fim)}, ${n.titular}.` : 'Sem outras reservas para esta sala hoje.'}
        </Typography>
      </ReservaCard>
      <Note>Sem reserva, a chave fica na bancada. Oriente a pessoa a reservar a sala pelo Módulo de Reservas.</Note>
      <Button variant="contained" size="large" onClick={close}>
        Voltar
      </Button>
    </Stack>
  )
}

function DesconhecidaSheet({ codigo, raw, serial }: { codigo: string | null; raw: string; serial: string | null }) {
  const { open, close } = useFlow()
  return (
    <Stack spacing={3}>
      <Result tom="late" icon={<ErrorOutlineRounded />} title="Chave não reconhecida">
        <Typography variant="body2">
          {codigo ? (
            <>
              O código <Mono color={m3.onSurface}>{codigo}</Mono> não pertence a nenhuma chave cadastrada.
            </>
          ) : raw ? (
            <>
              A leitura trouxe <Mono color={m3.onSurface}>{raw}</Mono>, que não é um código do Checkeys.
            </>
          ) : (
            'A leitura não trouxe um código do Checkeys.'
          )}
        </Typography>
        {serial ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Número da tag: <Mono>{serial}</Mono>
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Confira se a etiqueta está danificada ou se a chave ainda não foi cadastrada.
          </Typography>
        )}
      </Result>
      <Stack spacing={1}>
        {serial && (
          <Button variant="contained" size="large" startIcon={<LinkRounded />} onClick={() => open({ kind: 'vincular', serial })}>
            Vincular esta tag a uma chave
          </Button>
        )}
        <Button variant={serial ? 'text' : 'contained'} size="large" onClick={close}>
          Voltar
        </Button>
      </Stack>
    </Stack>
  )
}

function ResultadoSheet({ sheet }: { sheet: Extract<Sheet, { kind: 'entregue' | 'devolvida' | 'negada' }> }) {
  const { state } = useStore()
  const { close } = useFlow()
  const next = useNextRead()
  const sala = salaNome(state, sheet.salaId)
  const meta = `Registrado às ${hm(sheet.ts)} por ${state.operador}`
  return (
    <Stack spacing={3}>
      {sheet.kind === 'entregue' && (
        <Result tom="ok" icon={<CheckCircleRounded />} title="Chave entregue" meta={meta}>
          <Typography variant="body2">
            A {sala} está com <b>{sheet.titular}</b> até {hm(sheet.fim)}.
          </Typography>
        </Result>
      )}
      {sheet.kind === 'devolvida' && (
        <Result tom="ok" icon={<CheckCircleRounded />} title="Chave devolvida" meta={meta}>
          <Typography variant="body2">A chave da {sala} está de volta na bancada.</Typography>
          {sheet.atraso > 0 && (
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Note icon={<ScheduleRounded fontSize="small" sx={{ mt: '2px' }} />}>Devolução registrada com {durTxt(sheet.atraso)} de atraso.</Note>
            </Box>
          )}
        </Result>
      )}
      {sheet.kind === 'negada' && (
        <Result tom="late" icon={<BlockRounded />} title="Retirada não liberada" meta={`Tentativa registrada às ${hm(sheet.ts)}`}>
          <Typography variant="body2">
            A reserva da {sala} está no nome de <b>{sheet.titular}</b>. A chave só é entregue ao titular da reserva.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Se a pessoa faz dupla com o titular, o próprio titular precisa vir retirar.
          </Typography>
        </Result>
      )}
      <Stack spacing={1}>
        <Button variant="contained" size="large" startIcon={<QrCodeScannerRounded />} onClick={next}>
          Ler próxima chave
        </Button>
        <Button size="large" onClick={close}>
          Fechar
        </Button>
      </Stack>
    </Stack>
  )
}

function ManualSheet() {
  const { state } = useStore()
  const { processar, close } = useFlow()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const submit = () => {
    const code = extractCode(value)
    if (!code) return setError('Digite um código no formato CHK-7F3A9C.')
    if (!state.chaves.some((c) => c.codigo === code)) return setError(`Nenhuma chave cadastrada com o código ${code}.`)
    processar(code, 'manual')
  }
  return (
    <Stack
      spacing={2.5}
      component="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Box>
        <Typography variant="h5" component="h2">
          Digitar código
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use quando a etiqueta não ler. O código está impresso embaixo do QR Code.
        </Typography>
      </Box>
      <TextField
        autoFocus
        label="Código da chave"
        placeholder="CHK-7F3A9C"
        value={value}
        onChange={(e) => {
          setValue(e.target.value.toUpperCase())
          setError('')
        }}
        error={!!error}
        helperText={error || ' '}
        slotProps={{ htmlInput: { autoCapitalize: 'characters', spellCheck: false, maxLength: 12, style: { fontFamily: mono } } }}
      />
      <Stack spacing={1}>
        <Button type="submit" variant="contained" size="large" startIcon={<SearchRounded />}>
          Buscar chave
        </Button>
        <Button size="large" onClick={close}>
          Cancelar
        </Button>
      </Stack>
    </Stack>
  )
}

function SimularSheet() {
  const { state } = useStore()
  const { processar, close } = useFlow()
  const now = Date.now()
  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h5" component="h2">
          Simular uma leitura
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Escolha um chaveiro. O sistema age como se a etiqueta tivesse sido lida {state.modo === 'nfc' ? 'por NFC' : 'pelo QR Code'}.
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 1 }}>
        {state.chaves.map((k) => {
          const st = estadoChave(k, now)
          return (
            <ButtonBase
              key={k.id}
              onClick={() => processar(k.codigo, 'simulado')}
              sx={{ border: 1, borderColor: 'divider', borderRadius: '12px', p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, textAlign: 'left', '&:hover': { borderColor: 'primary.main' } }}
            >
              <Typography variant="subtitle1">{salaNome(state, k.salaId)}</Typography>
              <StatusChip tom={st} label={STATUS_LABEL[st]} />
            </ButtonBase>
          )
        })}
      </Box>
      <Button size="large" onClick={close}>
        Cancelar
      </Button>
    </Stack>
  )
}

/* ---------- sala, reserva e chave ---------- */

function MiniList({ items, empty }: { items: Array<{ key: string; left: ReactNode; right: ReactNode }>; empty: string }) {
  if (!items.length)
    return (
      <Typography variant="body2" color="text.secondary">
        {empty}
      </Typography>
    )
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '12px' }}>
      {items.map((it, i) => (
        <Stack key={it.key} direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.25, borderTop: i ? 1 : 0, borderColor: 'divider' }}>
          <Box sx={{ minWidth: 0 }}>{it.left}</Box>
          {it.right}
        </Stack>
      ))}
    </Box>
  )
}

function SalaSheet({ salaId }: { salaId: string }) {
  const { state } = useStore()
  const { abrirChave, close } = useFlow()
  const k = state.chaves.find((c) => c.salaId === salaId)
  if (!k) return <Gone />
  const now = Date.now()
  const st = estadoChave(k, now)
  const hoje = state.reservas.filter((r) => r.salaId === salaId && dayKey(r.inicio) === dayKey(now)).sort((a, b) => a.inicio - b.inicio)
  const movs = state.movimentos.filter((m) => m.salaId === salaId).slice(0, 5)
  const ativa = reservaAtiva(state, salaId, now)
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h2">
          {salaNome(state, salaId)}
        </Typography>
        <StatusChip tom={st} label={STATUS_LABEL[st]} />
      </Stack>
      {k.posse ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '16px', p: 2 }}>
          <Fields>
            <Field label="Está com" wide>
              {k.posse.titular}
            </Field>
            <Field label="Matrícula">
              <Mono>{k.posse.matricula}</Mono>
            </Field>
            <Field label="Retirada às">{hm(k.posse.desde)}</Field>
            <Field label={st === 'late' ? 'Reserva terminou às' : 'Reserva até'} wide>
              {hm(k.posse.fim)}
              {st === 'late' ? ` (atrasada há ${durTxt(minsBetween(k.posse.fim, now))})` : ''}
            </Field>
          </Fields>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {ativa ? (
            <>
              Reservada agora para <b>{ativa.titular}</b> até {hm(ativa.fim)}. A chave está na bancada, aguardando retirada.
            </>
          ) : (
            'A chave está na bancada.'
          )}
        </Typography>
      )}
      <Box>
        <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
          Reservas de hoje
        </Typography>
        <MiniList
          empty="Nenhuma reserva para esta sala hoje."
          items={hoje.map((r) => {
            const s = statusReserva(state, r, now)
            return {
              key: r.id,
              left: (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
                    {hm(r.inicio)} às {hm(r.fim)}
                  </Typography>
                  <Typography variant="body2">{r.titular}</Typography>
                </>
              ),
              right: <StatusChip tom={s.tom} label={s.label} />,
            }
          })}
        />
      </Box>
      <Box>
        <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
          Últimas movimentações
        </Typography>
        <MiniList
          empty="Nenhuma movimentação registrada."
          items={movs.map((m) => {
            const t = TIPO_INFO[m.tipo]
            const d = new Date(m.ts)
            return {
              key: m.id,
              left: (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
                    {dayKey(m.ts) === dayKey(now) ? hm(m.ts) : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`}
                  </Typography>
                  <Typography variant="body2">{m.titular ?? METODO_LABEL[m.metodo]}</Typography>
                </>
              ),
              right: <StatusChip tom={t.tom} label={t.label} />,
            }
          })}
        />
      </Box>
      <Stack spacing={1}>
        <TonalButton size="large" startIcon={k.status === 'em_uso' ? <SouthWestRounded /> : <NorthEastRounded />} onClick={() => abrirChave(k.id, 'sem_leitura')}>
          {k.status === 'em_uso' ? 'Registrar devolução sem leitura' : 'Registrar retirada sem leitura'}
        </TonalButton>
        <Button size="large" onClick={close}>
          Fechar
        </Button>
        <Typography variant="caption" color="text.secondary" textAlign="center">
          Use o registro sem leitura só se a etiqueta estiver danificada.
        </Typography>
      </Stack>
    </Stack>
  )
}

function ReservaSheet({ reservaId }: { reservaId: string }) {
  const { state, actions } = useStore()
  const { close } = useFlow()
  const toast = useToast()
  const [armed, setArmed] = useState(false)
  const r = state.reservas.find((x) => x.id === reservaId)
  if (!r) return <Gone />
  const now = Date.now()
  const s = statusReserva(state, r, now)
  const canCancel = r.status === 'confirmada' && r.fim > now
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h2">
          {salaNome(state, r.salaId)}
        </Typography>
        <StatusChip tom={s.tom} label={s.label} />
      </Stack>
      <ReservaCard call={`GET /reservas/${r.id.slice(0, 8)}`}>
        <Fields>
          <Field label="Titular" wide>
            {r.titular}
          </Field>
          <Field label="Matrícula">
            <Mono>{r.matricula}</Mono>
          </Field>
          <Field label="Recorrência">{r.recorrencia}</Field>
          <Field label="Horário" wide>
            {cap(longDate(r.inicio))}, {hm(r.inicio)} às {hm(r.fim)}
          </Field>
        </Fields>
      </ReservaCard>
      <Stack spacing={1}>
        {canCancel && (
          <Button
            variant={armed ? 'contained' : 'outlined'}
            color="error"
            size="large"
            startIcon={<EventBusyRounded />}
            onClick={() => {
              if (!armed) return setArmed(true)
              actions.cancelarReserva(r.id)
              close()
              toast('Reserva cancelada. A sala ficou livre.')
            }}
          >
            {armed ? 'Confirmar cancelamento' : 'Cancelar reserva (simular)'}
          </Button>
        )}
        <Button size="large" onClick={close}>
          Fechar
        </Button>
        {canCancel && (
          <Typography variant="caption" color="text.secondary" textAlign="center">
            Pela regra do SEPA, a sala só é liberada quando o aluno cancela a reserva antes.
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}

function NovaReservaSheet() {
  const { state, actions } = useStore()
  const { close } = useFlow()
  const toast = useToast()
  const now = Date.now()
  const [v, setV] = useState({ sala: 's01', titular: '', matricula: '', inicio: hm(now), fim: hm(floorTo(now, 30) + 120 * MIN) })
  const [error, setError] = useState('')
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV((x) => ({ ...x, [k]: e.target.value }))
    setError('')
  }
  const submit = () => {
    if (!v.titular.trim()) return setError('Informe o nome do titular.')
    if (!/^\d{6,14}$/.test(v.matricula.trim())) return setError('Informe a matrícula só com números.')
    if (!/^\d{2}:\d{2}$/.test(v.inicio) || !/^\d{2}:\d{2}$/.test(v.fim)) return setError('Informe o horário de início e de fim.')
    const a = new Date()
    const b = new Date()
    a.setHours(+v.inicio.slice(0, 2), +v.inicio.slice(3, 5), 0, 0)
    b.setHours(+v.fim.slice(0, 2), +v.fim.slice(3, 5), 0, 0)
    if (b <= a) return setError('O fim precisa ser depois do início.')
    const clash = state.reservas.find((o) => o.salaId === v.sala && o.status === 'confirmada' && o.inicio < b.getTime() && a.getTime() < o.fim)
    if (clash) return setError(`A ${salaNome(state, v.sala)} já está reservada das ${hm(clash.inicio)} às ${hm(clash.fim)}.`)
    actions.novaReserva({ salaId: v.sala, titular: v.titular.trim(), matricula: v.matricula.trim(), inicio: a.getTime(), fim: b.getTime() })
    close()
    toast(`Reserva criada para a ${salaNome(state, v.sala)}`)
  }
  return (
    <Stack
      spacing={2.5}
      component="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Box>
        <Typography variant="h5" component="h2">
          Nova reserva
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Simula uma reserva criada hoje no Módulo de Reservas.
        </Typography>
      </Box>
      <TextField select label="Sala" value={v.sala} onChange={set('sala')}>
        {state.salas.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.nome}
          </MenuItem>
        ))}
      </TextField>
      <TextField label="Titular da reserva" value={v.titular} onChange={set('titular')} autoComplete="off" slotProps={{ htmlInput: { maxLength: 60 } }} />
      <TextField label="Matrícula" value={v.matricula} onChange={set('matricula')} slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 14 } }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField label="Início" type="time" value={v.inicio} onChange={set('inicio')} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Fim" type="time" value={v.fim} onChange={set('fim')} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      {error && (
        <Typography color="error" variant="body2" role="alert">
          {error}
        </Typography>
      )}
      <Stack spacing={1}>
        <Button type="submit" variant="contained" size="large">
          Salvar reserva
        </Button>
        <Button size="large" onClick={close}>
          Cancelar
        </Button>
      </Stack>
    </Stack>
  )
}

function ChaveSheet({ chaveId }: { chaveId: string }) {
  const { state, actions } = useStore()
  const { close } = useFlow()
  const k = state.chaves.find((c) => c.id === chaveId)
  const [nome, setNome] = useState(() => salaNome(state, k?.salaId))
  const [armed, setArmed] = useState(false)
  const [status, setStatus] = useState<{ text: string; tone: 'ok' | 'err' | 'info' } | null>(null)
  const job = useRef<AbortController | null>(null)
  useEffect(() => () => job.current?.abort(), [])
  if (!k) return <Gone />
  const st = estadoChave(k)
  const nfc = nfcSupported()

  const gravar = async () => {
    job.current?.abort()
    const c = new AbortController()
    job.current = c
    setStatus({ text: `Aproxime a tag do celular para gravar o código ${k.codigo}…`, tone: 'info' })
    try {
      await writeTag(k.codigo, c.signal)
      setStatus({ text: 'Código gravado na tag. Ela já pode ser lida.', tone: 'ok' })
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setStatus({ text: 'Não consegui gravar. Verifique se a tag aceita gravação e tente de novo.', tone: 'err' })
    }
  }
  const vincular = async () => {
    job.current?.abort()
    const c = new AbortController()
    job.current = c
    setStatus({ text: `Aproxime a tag que já está no chaveiro da ${salaNome(state, k.salaId)}…`, tone: 'info' })
    try {
      const serial = await readSerialOnce(c.signal)
      c.abort()
      if (!serial) return setStatus({ text: 'Esta tag não informa número de série. Use Gravar código numa tag.', tone: 'err' })
      actions.vincularNfc(k.id, serial)
      setStatus({ text: 'Tag vinculada a esta chave.', tone: 'ok' })
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setStatus({ text: 'Não foi possível iniciar o NFC.', tone: 'err' })
    }
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h2">
          {salaNome(state, k.salaId)}
        </Typography>
        <StatusChip tom={st} label={STATUS_LABEL[st]} />
      </Stack>
      <Stack alignItems="center" spacing={1}>
        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: '16px', bgcolor: '#fff' }}>
          <QRCodeSVG value={k.codigo} size={200} level="M" marginSize={2} title={`QR Code ${k.codigo}`} />
        </Box>
        <Typography sx={{ fontFamily: mono, fontWeight: 500 }}>{k.codigo}</Typography>
      </Stack>
      <Box>
        <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
          Tag NFC
        </Typography>
        {k.nfcUid && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Tag vinculada: <Mono>{k.nfcUid}</Mono>
          </Typography>
        )}
        {nfc ? (
          <Stack spacing={1}>
            <Button variant="contained" startIcon={<NfcRounded />} onClick={gravar}>
              Gravar código numa tag
            </Button>
            <Button variant="outlined" startIcon={<LinkRounded />} onClick={vincular}>
              Vincular tag que já está no chaveiro
            </Button>
            {k.nfcUid && (
              <Button startIcon={<LinkOffRounded />} onClick={() => actions.vincularNfc(k.id, null)}>
                Desvincular tag
              </Button>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {nfcIndisponivelMotivo()} Lá você grava o código numa tag ou vincula uma tag que já está no chaveiro.
          </Typography>
        )}
        {status && (
          <Typography variant="body2" sx={{ mt: 1.5 }} color={status.tone === 'err' ? 'error' : status.tone === 'ok' ? 'success.main' : 'text.secondary'}>
            {status.text}
          </Typography>
        )}
      </Box>
      <Box
        component="form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault()
          actions.renomearSala(k.salaId, nome)
          setStatus({ text: 'Nome da sala salvo.', tone: 'ok' })
        }}
      >
        <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5 }}>
          Nome da sala
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField size="small" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} sx={{ flex: 1 }} slotProps={{ htmlInput: { maxLength: 30 } }} />
          <TonalButton type="submit">Salvar</TonalButton>
        </Stack>
      </Box>
      <Box>
        <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5 }}>
          Código
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Gerar um novo código invalida a etiqueta impressa e a tag gravada desta chave.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            color="error"
            variant={armed ? 'contained' : 'outlined'}
            startIcon={<AutorenewRounded />}
            onClick={() => {
              if (!armed) return setArmed(true)
              actions.novoCodigo(k.id)
              setArmed(false)
              setStatus({ text: 'Novo código gerado. Imprima a nova etiqueta desta chave.', tone: 'ok' })
            }}
          >
            {armed ? 'Confirmar novo código' : 'Gerar novo código'}
          </Button>
          {armed && <Button onClick={() => setArmed(false)}>Cancelar</Button>}
        </Stack>
      </Box>
      <Button size="large" onClick={close}>
        Fechar
      </Button>
    </Stack>
  )
}

function VincularSheet({ serial }: { serial: string }) {
  const { state, actions } = useStore()
  const { close } = useFlow()
  const toast = useToast()
  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h5" component="h2">
          Vincular tag
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Escolha a chave em que esta tag está presa. Número da tag: <Mono>{serial}</Mono>
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 1 }}>
        {state.chaves.map((k) => (
          <ButtonBase
            key={k.id}
            onClick={() => {
              actions.vincularNfc(k.id, serial)
              close()
              toast(`Tag vinculada à ${salaNome(state, k.salaId)}. Aproxime de novo para registrar.`)
            }}
            sx={{ border: 1, borderColor: 'divider', borderRadius: '12px', p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, textAlign: 'left', '&:hover': { borderColor: 'primary.main' } }}
          >
            <Typography variant="subtitle1">{salaNome(state, k.salaId)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
              {k.codigo}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
      <Button size="large" onClick={close}>
        Cancelar
      </Button>
    </Stack>
  )
}
