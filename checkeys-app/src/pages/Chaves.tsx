import { Link as RouterLink } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { Box, Button, Card, List, ListItemButton, Stack, Typography } from '@mui/material'
import SellOutlined from '@mui/icons-material/SellOutlined'
import { useStore } from '../data/store'
import { STATUS_LABEL, estadoChave, salaNome } from '../data/queries'
import { useFlow } from '../flow/context'
import { PageHeader, StatusChip } from '../components/common'
import { mono } from '../theme'

export default function Chaves() {
  const { state } = useStore()
  const { open } = useFlow()
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Chaves e etiquetas"
        subtitle="Cada QR Code e cada tag NFC carregam o código único da chave."
        action={
          <Button component={RouterLink} to="/etiquetas" variant="outlined" startIcon={<SellOutlined />}>
            Folha de etiquetas
          </Button>
        }
      />
      <Card>
        <List disablePadding>
          {state.chaves.map((k, i) => {
            const st = estadoChave(k)
            return (
              <ListItemButton key={k.id} onClick={() => open({ kind: 'chave', chaveId: k.id })} divider={i < state.chaves.length - 1} sx={{ borderRadius: 0, gap: 2, py: 1.5 }}>
                <Box sx={{ p: 0.5, border: 1, borderColor: 'divider', borderRadius: '8px', bgcolor: '#fff', lineHeight: 0, flexShrink: 0 }}>
                  <QRCodeSVG value={k.codigo} size={44} level="M" marginSize={0} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1">{salaNome(state, k.salaId)}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: mono }}>
                    {k.codigo}
                    {k.nfcUid ? ' · tag NFC' : ''}
                  </Typography>
                </Box>
                <StatusChip tom={st} label={STATUS_LABEL[st]} />
              </ListItemButton>
            )
          })}
        </List>
      </Card>
    </Stack>
  )
}
