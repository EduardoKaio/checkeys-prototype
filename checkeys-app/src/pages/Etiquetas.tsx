import { useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { Box, Button, FormControlLabel, GlobalStyles, Stack, Switch, Typography } from '@mui/material'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import PrintRounded from '@mui/icons-material/PrintRounded'
import { useStore } from '../data/store'
import { salaNome } from '../data/queries'
import { PageHeader } from '../components/common'
import { mono } from '../theme'

export default function Etiquetas() {
  const { state } = useStore()
  const [comLink, setComLink] = useState(false)
  const valor = (codigo: string) => (comLink ? `${window.location.origin}/?k=${codigo}` : codigo)

  return (
    <Stack spacing={3}>
      <GlobalStyles
        styles={{
          '@media print': {
            '.no-print': { display: 'none !important' },
            body: { background: '#fff !important' },
            main: { padding: '0 !important', maxWidth: 'none !important' },
            '.shell-content': { marginLeft: '0 !important' },
          },
        }}
      />
      <Box className="no-print">
        <PageHeader
          title="Folha de etiquetas"
          subtitle="Imprima, recorte, plastifique e prenda cada etiqueta no chaveiro da sala."
          action={
            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to="/chaves" startIcon={<ArrowBackRounded />}>
                Voltar
              </Button>
              <Button variant="contained" startIcon={<PrintRounded />} onClick={() => window.print()}>
                Imprimir
              </Button>
            </Stack>
          }
        />
        <FormControlLabel
          sx={{ mt: 2 }}
          control={<Switch checked={comLink} onChange={(e) => setComLink(e.target.checked)} />}
          label="Incluir o link do sistema no QR Code (a câmera comum do celular abre o Checkeys direto na chave)"
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(176px, 1fr))', gap: 1.5, '@media print': { gridTemplateColumns: 'repeat(4, 1fr)' } }}>
        {state.chaves.map((k) => (
          <Stack
            key={k.id}
            alignItems="center"
            spacing={0.75}
            sx={{ bgcolor: '#fff', border: '1px dashed #9AA8A5', borderRadius: '12px', p: 1.5, breakInside: 'avoid' }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: '#5A6A67' }}>Checkeys · SEPA</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{salaNome(state, k.salaId)}</Typography>
            <QRCodeSVG value={valor(k.codigo)} size={140} level="M" marginSize={2} />
            <Typography sx={{ fontFamily: mono, fontSize: 12, fontWeight: 500 }}>{k.codigo}</Typography>
          </Stack>
        ))}
      </Box>
    </Stack>
  )
}
