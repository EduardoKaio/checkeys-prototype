import { useEffect, useRef, useState } from 'react'
import { keyframes } from '@emotion/react'
import { Box, Button, Stack, Typography } from '@mui/material'
import ContactlessRounded from '@mui/icons-material/ContactlessRounded'
import NfcRounded from '@mui/icons-material/NfcRounded'
import StopCircleOutlined from '@mui/icons-material/StopCircleOutlined'
import { isSecure, nfcSupported } from '../lib/device'
import { ndefText } from '../lib/nfc'
import { m3 } from '../theme'

const ring = keyframes`
  from { transform: scale(1); opacity: .7; }
  to { transform: scale(1.8); opacity: 0; }
`

interface Props {
  onRead: (text: string, serial: string | null) => void
  paused?: boolean
}

export function nfcIndisponivelMotivo() {
  if (!isSecure()) return 'O NFC só funciona com o sistema aberto por HTTPS, como na Vercel.'
  return 'A leitura NFC funciona no Chrome para Android, com o NFC do celular ligado.'
}

export default function NfcPanel({ onRead, paused = false }: Props) {
  const supported = nfcSupported()
  const [listening, setListening] = useState(false)
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)
  const ctrl = useRef<AbortController | null>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const onReadRef = useRef(onRead)
  onReadRef.current = onRead

  useEffect(() => () => ctrl.current?.abort(), [])

  const start = async () => {
    try {
      const reader = new NDEFReader()
      const c = new AbortController()
      ctrl.current = c
      await reader.scan({ signal: c.signal })
      reader.onreading = (ev) => {
        if (pausedRef.current) return
        onReadRef.current(ndefText(ev.message), ev.serialNumber || null)
      }
      reader.onreadingerror = () => setMsg({ text: 'Não consegui ler essa tag. Afaste e aproxime de novo.', error: true })
      setListening(true)
      setMsg(null)
    } catch (e) {
      setListening(false)
      const name = (e as DOMException)?.name
      setMsg({
        text: name === 'NotAllowedError' ? 'Permissão de NFC negada. Libere o NFC para este site.' : 'Não foi possível iniciar o NFC. Confira se o NFC do celular está ligado.',
        error: true,
      })
    }
  }

  const stop = () => {
    ctrl.current?.abort()
    ctrl.current = null
    setListening(false)
  }

  const title = !supported ? 'NFC indisponível aqui' : listening ? 'Aproxime o chaveiro' : 'Leitura NFC pronta'
  const text = !supported ? nfcIndisponivelMotivo() : listening ? 'Encoste a tag na parte de trás do celular.' : 'Toque em Iniciar leitura NFC.'

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          maxHeight: '58dvh',
          borderRadius: '28px',
          bgcolor: m3.surfaceContainer,
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '40%',
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: supported ? m3.primaryContainer : m3.surfaceHigh,
            color: supported ? m3.onPrimaryContainer : 'text.secondary',
            mt: '-14%',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${m3.primary}`,
              opacity: 0,
              animation: listening && !paused ? `${ring} 1.8s ease-out infinite` : 'none',
            },
            '&::after': { animationDelay: '.9s' },
          }}
        >
          <ContactlessRounded sx={{ fontSize: 64 }} />
        </Box>
        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 24, px: 3, textAlign: 'center' }}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {text}
          </Typography>
        </Box>
      </Box>
      {supported && (
        <Button
          variant="contained"
          size="large"
          startIcon={listening ? <StopCircleOutlined /> : <NfcRounded />}
          onClick={listening ? stop : start}
        >
          {listening ? 'Parar leitura' : 'Iniciar leitura NFC'}
        </Button>
      )}
      {msg && (
        <Typography variant="body2" color={msg.error ? 'error' : 'text.secondary'} textAlign="center">
          {msg.text}
        </Typography>
      )}
    </Stack>
  )
}
