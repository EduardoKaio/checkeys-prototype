import { useEffect, useRef, useState } from 'react'
import { keyframes } from '@emotion/react'
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import FlashlightOnRounded from '@mui/icons-material/FlashlightOnRounded'
import FlashlightOffRounded from '@mui/icons-material/FlashlightOffRounded'
import CameraswitchRounded from '@mui/icons-material/CameraswitchRounded'
import VideocamOffOutlined from '@mui/icons-material/VideocamOffOutlined'
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined'
import { cameraSupported, isSecure } from '../lib/device'
import { getDetector, type Motor } from '../lib/scanner'
import { m3 } from '../theme'

type Status = 'starting' | 'live' | 'denied' | 'unavailable' | 'error' | 'hidden'

interface Props {
  /** Chamado a cada QR Code encontrado. Quem usa decide se aceita (por exemplo, para evitar leitura repetida). */
  onResult: (text: string) => void
  /** Enquanto true, a câmera continua aberta mas não procura códigos (por exemplo, com a confirmação aberta). */
  paused?: boolean
  onMotor?: (motor: Motor) => void
}

const sweep = keyframes`
  from { top: 8%; }
  to { top: 92%; }
`

export default function QrScanner({ onResult, paused = false, onMotor }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const onMotorRef = useRef(onMotor)
  onMotorRef.current = onMotor

  const [status, setStatus] = useState<Status>(() => (cameraSupported() ? 'starting' : 'unavailable'))
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [torch, setTorch] = useState({ available: false, on: false })
  const [multi, setMulti] = useState(false)
  const [hit, setHit] = useState(false)
  const [run, setRun] = useState(0)
  const [hidden, setHidden] = useState(() => document.hidden)

  useEffect(() => {
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    if (!cameraSupported()) {
      setStatus('unavailable')
      return
    }
    if (hidden) {
      setStatus('hidden')
      return
    }
    let cancelled = false
    let timer = 0
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const stop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }

    ;(async () => {
      setStatus('starting')
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
      } catch (e) {
        if (!cancelled) setStatus((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'error')
        return
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      try {
        await video.play()
      } catch {
        /* alguns navegadores tocam sozinhos */
      }
      const track = stream.getVideoTracks()[0]
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean }
      setTorch({ available: !!caps.torch, on: false })
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setMulti(devices.filter((d) => d.kind === 'videoinput').length > 1)
      } catch {
        /* sem lista de câmeras */
      }
      if (cancelled) return
      setStatus('live')

      const { detector, motor } = await getDetector()
      if (cancelled) return
      onMotorRef.current?.(motor)
      let frame = 0

      const loop = async () => {
        if (cancelled) return
        if (!pausedRef.current && video.readyState >= 2 && video.videoWidth) {
          try {
            let source: ImageBitmapSource = video
            if (motor === 'zxing' && ctx) {
              // Alterna entre o centro em resolução cheia (QR pequeno) e o quadro inteiro reduzido (QR grande ou fora do centro).
              const w = video.videoWidth
              const h = video.videoHeight
              if (frame % 2 === 0) {
                const side = Math.round(Math.min(w, h) * 0.8)
                canvas.width = side
                canvas.height = side
                ctx.drawImage(video, (w - side) / 2, (h - side) / 2, side, side, 0, 0, side, side)
              } else {
                const scale = Math.min(1, 960 / w)
                canvas.width = Math.round(w * scale)
                canvas.height = Math.round(h * scale)
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              }
              source = canvas
            }
            frame++
            const found = await detector.detect(source)
            const value = found.find((f) => f.rawValue)?.rawValue
            if (value && !cancelled && !pausedRef.current) {
              setHit(true)
              window.setTimeout(() => setHit(false), 500)
              onResultRef.current(value)
            }
          } catch {
            /* quadro ilegível, segue */
          }
        }
        timer = window.setTimeout(loop, motor === 'nativo' ? 120 : 80)
      }
      void loop()
    })()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      stop()
    }
  }, [facing, run, hidden])

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const on = !torch.on
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
      setTorch({ available: true, on })
    } catch {
      setTorch({ available: false, on: false })
    }
  }

  const live = status === 'live'

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        maxHeight: '58dvh',
        borderRadius: '28px',
        overflow: 'hidden',
        bgcolor: live ? '#101413' : m3.surfaceContainer,
      }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: live ? 'block' : 'none',
          transform: facing === 'user' ? 'scaleX(-1)' : undefined,
        }}
      />

      {live && (
        <>
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '66%',
              aspectRatio: '1 / 1',
              transform: 'translate(-50%, -50%)',
              borderRadius: '24px',
              boxShadow: '0 0 0 2000px rgba(0, 0, 0, .28)',
              outline: `3px solid ${hit ? '#7BE495' : 'rgba(255,255,255,.92)'}`,
              transition: 'outline-color .2s',
            }}
          >
            {!paused && (
              <Box
                sx={{
                  position: 'absolute',
                  left: '6%',
                  right: '6%',
                  height: '2px',
                  borderRadius: 1,
                  bgcolor: '#9EF2E7',
                  boxShadow: '0 0 12px 2px rgba(158, 242, 231, .8)',
                  animation: `${sweep} 1.4s ease-in-out infinite alternate`,
                }}
              />
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{ position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.6)', px: 2 }}
          >
            {paused ? 'Leitura pausada' : 'Enquadre o QR Code do chaveiro'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 12, right: 12 }}>
            {torch.available && (
              <Tooltip title={torch.on ? 'Desligar lanterna' : 'Ligar lanterna'}>
                <IconButton onClick={toggleTorch} sx={{ bgcolor: 'rgba(255,255,255,.9)', '&:hover': { bgcolor: '#fff' } }} aria-label="Lanterna">
                  {torch.on ? <FlashlightOffRounded /> : <FlashlightOnRounded />}
                </IconButton>
              </Tooltip>
            )}
            {multi && (
              <Tooltip title="Trocar câmera">
                <IconButton
                  onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
                  sx={{ bgcolor: 'rgba(255,255,255,.9)', '&:hover': { bgcolor: '#fff' } }}
                  aria-label="Trocar câmera"
                >
                  <CameraswitchRounded />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </>
      )}

      {!live && (
        <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ position: 'absolute', inset: 0, p: 3, textAlign: 'center' }}>
          {status === 'starting' && (
            <>
              <CircularProgress size={36} />
              <Typography color="text.secondary">Abrindo a câmera…</Typography>
            </>
          )}
          {status === 'hidden' && <Typography color="text.secondary">Câmera pausada enquanto o app está em segundo plano.</Typography>}
          {status === 'denied' && (
            <>
              <VideocamOffOutlined sx={{ fontSize: 44, color: 'text.secondary' }} />
              <Typography variant="h6">Permissão da câmera negada</Typography>
              <Typography variant="body2" color="text.secondary">
                Libere a câmera para este site nas configurações do navegador e tente de novo.
              </Typography>
              <Button variant="outlined" onClick={() => setRun((r) => r + 1)}>
                Tentar de novo
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <VideocamOffOutlined sx={{ fontSize: 44, color: 'text.secondary' }} />
              <Typography variant="h6">Não foi possível abrir a câmera</Typography>
              <Typography variant="body2" color="text.secondary">
                Outro app pode estar usando a câmera. Feche-o e tente de novo.
              </Typography>
              <Button variant="outlined" onClick={() => setRun((r) => r + 1)}>
                Tentar de novo
              </Button>
            </>
          )}
          {status === 'unavailable' && (
            <>
              <PhotoCameraOutlined sx={{ fontSize: 44, color: 'text.secondary' }} />
              <Typography variant="h6">Câmera ao vivo indisponível</Typography>
              <Typography variant="body2" color="text.secondary">
                {isSecure()
                  ? 'Este navegador não dá acesso à câmera. Use a leitura por foto logo abaixo.'
                  : 'A câmera só funciona com o sistema aberto por HTTPS, como na Vercel. Use a leitura por foto logo abaixo.'}
              </Typography>
            </>
          )}
        </Stack>
      )}
    </Box>
  )
}
