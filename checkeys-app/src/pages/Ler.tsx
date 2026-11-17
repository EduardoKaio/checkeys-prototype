import { useRef, useState } from 'react'
import { Box, Button, LinearProgress, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded'
import NfcRounded from '@mui/icons-material/NfcRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined'
import AutorenewRounded from '@mui/icons-material/AutorenewRounded'
import QrScanner from '../components/QrScanner'
import NfcPanel from '../components/NfcPanel'
import { PageHeader } from '../components/common'
import { useStore } from '../data/store'
import { useFlow } from '../flow/context'
import { decodeImageFile } from '../lib/scanner'
import type { ModoLeitura } from '../types'

export default function Ler() {
  const { state, actions } = useStore()
  const flow = useFlow()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [photoMsg, setPhotoMsg] = useState<string | null>(null)
  const modo = state.modo

  const onQr = (text: string) => {
    if (!flow.aceitarLeitura(text)) return
    setPhotoMsg(null)
    flow.processar(text, 'qr')
  }

  const onNfc = (text: string, serial: string | null) => {
    if (flow.sheetOpen) return
    flow.processar(text, 'nfc', { serial })
  }

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setPhotoMsg(null)
    try {
      const code = await decodeImageFile(file)
      if (code) flow.processar(code, 'qr')
      else setPhotoMsg('Não encontrei um QR Code nessa imagem. Chegue mais perto e evite reflexo.')
    } catch {
      setPhotoMsg('Não consegui abrir essa imagem. Tente outra.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const status = photoMsg ? { texto: photoMsg, erro: true } : flow.ultima

  return (
    <Stack spacing={3} sx={{ maxWidth: 560, mx: 'auto' }}>
      <PageHeader title="Ler chave" subtitle="A leitura identifica a chave e define sozinha se é retirada ou devolução." />

      <ToggleButtonGroup
        exclusive
        fullWidth
        value={modo}
        onChange={(_, v: ModoLeitura | null) => v && actions.setModo(v)}
        aria-label="Forma de leitura"
        sx={{ '& .MuiToggleButton-root': { height: 48, gap: 1 } }}
      >
        <ToggleButton value="qr">
          {modo === 'qr' ? <CheckRounded fontSize="small" /> : <QrCode2Rounded fontSize="small" />}
          QR Code
        </ToggleButton>
        <ToggleButton value="nfc">
          {modo === 'nfc' ? <CheckRounded fontSize="small" /> : <NfcRounded fontSize="small" />}
          NFC
        </ToggleButton>
      </ToggleButtonGroup>

      {modo === 'qr' ? (
        <Stack spacing={1.5}>
          <QrScanner onResult={onQr} paused={flow.sheetOpen || busy} />
          {busy && <LinearProgress sx={{ borderRadius: 1 }} />}
        </Stack>
      ) : (
        <NfcPanel onRead={onNfc} paused={flow.sheetOpen} />
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {modo === 'qr' && (
          <Button variant="outlined" startIcon={<ImageOutlined />} onClick={() => fileRef.current?.click()} disabled={busy} sx={{ flex: '1 1 200px' }}>
            Ler de uma foto
          </Button>
        )}
        <Button variant="outlined" startIcon={<KeyboardOutlined />} onClick={() => flow.open({ kind: 'manual' })} sx={{ flex: '1 1 200px' }}>
          Digitar código
        </Button>
      </Stack>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onPhoto(e.target.files?.[0])} />

      {status && (
        <Typography variant="body2" textAlign="center" color={status.erro ? 'error' : 'text.secondary'} aria-live="polite">
          {status.texto}
        </Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button startIcon={<AutorenewRounded />} onClick={() => flow.open({ kind: 'simular' })}>
          Sem etiqueta por perto? Simular uma leitura
        </Button>
      </Box>
    </Stack>
  )
}
