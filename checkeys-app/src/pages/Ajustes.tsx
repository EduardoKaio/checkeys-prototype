import { useEffect, useState } from 'react'
import { Box, Button, Card, List, ListItem, ListItemIcon, ListItemText, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import CancelOutlined from '@mui/icons-material/CancelOutlined'
import RestartAltRounded from '@mui/icons-material/RestartAltRounded'
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded'
import NfcRounded from '@mui/icons-material/NfcRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import { useStore } from '../data/store'
import { PageHeader } from '../components/common'
import { useToast } from '../components/Toast'
import { cameraSupported, nfcSupported, storageWorks } from '../lib/device'
import { getDetector, type Motor } from '../lib/scanner'
import { nfcIndisponivelMotivo } from '../components/NfcPanel'
import type { ModoLeitura } from '../types'

function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6">{title}</Typography>
      {text && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {text}
        </Typography>
      )}
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Card>
  )
}

export default function Ajustes() {
  const { state, actions } = useStore()
  const toast = useToast()
  const [nome, setNome] = useState(state.operador)
  const [armed, setArmed] = useState(false)
  const [motor, setMotor] = useState<Motor | null>(null)

  useEffect(() => {
    let alive = true
    getDetector()
      .then((d) => alive && setMotor(d.motor))
      .catch(() => alive && setMotor(null))
    return () => {
      alive = false
    }
  }, [])

  const cam = cameraSupported()
  const nfc = nfcSupported()
  const env: Array<{ ok: boolean; title: string; text: string }> = [
    {
      ok: cam,
      title: 'Câmera ao vivo',
      text: cam ? 'Lê o QR Code direto pela câmera.' : 'Indisponível. Abra o sistema por HTTPS (por exemplo, na Vercel).',
    },
    {
      ok: motor !== null,
      title: 'Leitor de QR Code',
      text: motor === 'nativo' ? 'Usando o leitor nativo do navegador.' : motor === 'zxing' ? 'Usando o leitor ZXing embutido no app.' : 'Carregando o leitor…',
    },
    { ok: nfc, title: 'Leitura e gravação NFC', text: nfc ? 'Pronta para ler e gravar tags.' : nfcIndisponivelMotivo() },
    {
      ok: storageWorks,
      title: 'Dados salvos no aparelho',
      text: storageWorks ? 'Os registros continuam aqui ao reabrir o sistema.' : 'O navegador bloqueou o armazenamento; os dados duram só esta sessão.',
    },
  ]

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 680 }}>
      <PageHeader title="Ajustes" subtitle="Configurações deste aparelho." />

      <Section title="Recepcionista em serviço" text="O nome aparece em cada retirada e devolução registrada.">
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          component="form"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault()
            actions.setOperador(nome)
            toast('Nome salvo')
          }}
        >
          <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} sx={{ flex: 1 }} slotProps={{ htmlInput: { maxLength: 40 } }} />
          <Button type="submit" variant="contained" sx={{ height: 56, px: 3 }}>
            Salvar
          </Button>
        </Stack>
      </Section>

      <Section title="Leitura padrão" text="Forma de leitura que abre primeiro na tela Ler chave.">
        <ToggleButtonGroup exclusive fullWidth value={state.modo} onChange={(_, v: ModoLeitura | null) => v && actions.setModo(v)} sx={{ '& .MuiToggleButton-root': { height: 48, gap: 1 } }}>
          <ToggleButton value="qr">
            {state.modo === 'qr' ? <CheckRounded fontSize="small" /> : <QrCode2Rounded fontSize="small" />}
            QR Code
          </ToggleButton>
          <ToggleButton value="nfc">
            {state.modo === 'nfc' ? <CheckRounded fontSize="small" /> : <NfcRounded fontSize="small" />}
            NFC
          </ToggleButton>
        </ToggleButtonGroup>
      </Section>

      <Section title="Neste aparelho">
        <List disablePadding>
          {env.map((e) => (
            <ListItem key={e.title} disableGutters alignItems="flex-start">
              <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>{e.ok ? <CheckCircleRounded color="success" /> : <CancelOutlined color="disabled" />}</ListItemIcon>
              <ListItemText primary={e.title} secondary={e.text} />
            </ListItem>
          ))}
        </List>
      </Section>

      <Section title="Dados de exemplo" text="Volta as 17 chaves, as reservas e o histórico para o cenário de demonstração, com horários a partir de agora.">
        <Stack direction="row" spacing={1}>
          <Button
            variant={armed ? 'contained' : 'outlined'}
            color={armed ? 'error' : 'primary'}
            startIcon={<RestartAltRounded />}
            onClick={() => {
              if (!armed) return setArmed(true)
              actions.restaurar()
              setArmed(false)
              toast('Dados de exemplo restaurados')
            }}
          >
            {armed ? 'Confirmar: apagar e restaurar' : 'Restaurar dados de exemplo'}
          </Button>
          {armed && <Button onClick={() => setArmed(false)}>Cancelar</Button>}
        </Stack>
      </Section>

      <Section
        title="Sobre"
        text="Checkeys, protótipo do Grupo 6 para a gestão de chaves do SEPA (UFRN). Nesta versão os dados ficam salvos no próprio aparelho; na versão final ficam no back-end em Spring Boot com PostgreSQL, e as reservas chegam do Módulo de Reservas."
      >
        <Typography variant="caption" color="text.secondary">
          Versão 1.0 · MVP
        </Typography>
      </Section>
    </Stack>
  )
}
