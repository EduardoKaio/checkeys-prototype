import type { ReactNode } from 'react'
import { Box, Dialog, DialogContent, Drawer, useMediaQuery, useTheme } from '@mui/material'

/** Bottom sheet no celular e diálogo centralizado no computador. */
export default function ResponsiveSheet({
  open,
  onClose,
  label,
  contentKey,
  children,
}: {
  open: boolean
  onClose: () => void
  label: string
  /** Muda quando o conteúdo troca: a folha volta ao topo. */
  contentKey?: string
  children: ReactNode
}) {
  const theme = useTheme()
  const mobile = useMediaQuery(theme.breakpoints.down('md'))

  if (mobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            'aria-label': label,
            sx: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92dvh', bgcolor: 'background.paper' },
          },
        }}
      >
        <Box sx={{ width: 32, height: 4, borderRadius: 2, bgcolor: 'text.secondary', opacity: 0.35, mx: 'auto', mt: 1.5, mb: 1.5, flexShrink: 0 }} />
        <Box key={contentKey} sx={{ px: 3, overflowY: 'auto' }}>
          {children}
          <Box sx={{ height: 'calc(16px + env(safe-area-inset-bottom))' }} />
        </Box>
      </Drawer>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-label={label}
      sx={{ '& .MuiDialog-container:focus, & .MuiDialog-paper:focus': { outline: 'none' } }}
    >
      <DialogContent key={contentKey} sx={{ p: 3 }}>{children}</DialogContent>
    </Dialog>
  )
}
