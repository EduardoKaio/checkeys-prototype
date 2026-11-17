import type { ReactNode } from 'react'
import { Box, Button, Chip, Stack, Typography, type ButtonProps } from '@mui/material'
import { m3, mono, tones } from '../theme'
import type { Tom } from '../types'

export function StatusChip({ tom, label }: { tom: Tom; label: string }) {
  const t = tones[tom]
  return <Chip size="small" label={label} sx={{ bgcolor: t.bg, color: t.fg, fontWeight: 600, height: 26, flexShrink: 0 }} />
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={2} flexWrap="wrap" sx={{ pt: 1 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  )
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: ReactNode }) {
  return (
    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'baseline' }}>
      {children}
      {count !== undefined && (
        <Typography component="span" variant="body2" color="text.secondary">
          {count}
        </Typography>
      )}
    </Typography>
  )
}

/** Botão "tonal" do Material 3 (fundo secondary container). */
export function TonalButton(props: ButtonProps) {
  return (
    <Button
      variant="contained"
      {...props}
      sx={{
        bgcolor: m3.secondaryContainer,
        color: m3.onSecondaryContainer,
        boxShadow: 'none',
        '&:hover': { bgcolor: '#C6E1DB', boxShadow: 'none' },
        ...props.sx,
      }}
    />
  )
}

export function Mono({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <Box component="span" sx={{ fontFamily: mono, letterSpacing: 0, color }}>
      {children}
    </Box>
  )
}

export function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <Box sx={{ gridColumn: wide ? '1 / -1' : undefined, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.4 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ overflowWrap: 'anywhere' }}>
        {children}
      </Typography>
    </Box>
  )
}
