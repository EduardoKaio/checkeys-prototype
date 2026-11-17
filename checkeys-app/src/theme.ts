import { createTheme } from '@mui/material/styles'
import type { Tom } from './types'

/** Paleta tonal no estilo Material 3, gerada a partir de um verde petróleo. Tema claro. */
export const m3 = {
  primary: '#006A63',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C9F0EA',
  onPrimaryContainer: '#00201D',
  secondaryContainer: '#D5EAE5',
  onSecondaryContainer: '#0E2421',
  surface: '#F6F8F7',
  surfaceLow: '#FFFFFF',
  surfaceContainer: '#EEF3F1',
  surfaceHigh: '#E6ECEA',
  outline: '#71807C',
  outlineVariant: '#DCE4E1',
  onSurface: '#171D1C',
  onSurfaceVariant: '#45504E',
}

export const tones: Record<Tom, { bg: string; fg: string }> = {
  ok: { bg: '#DCF3E3', fg: '#0F5223' },
  use: { bg: '#FFE7C2', fg: '#5C3A00' },
  late: { bg: '#FFDAD6', fg: '#8C1D18' },
  info: { bg: '#D6E7FB', fg: '#0B3D66' },
  pri: { bg: '#C9F0EA', fg: '#00504A' },
  warn: { bg: '#FFE0CF', fg: '#6E2E00' },
  muted: { bg: '#ECF0EE', fg: '#45504E' },
}

export const mono = '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: m3.primary, dark: '#00504A', light: '#3E8E86', contrastText: '#FFFFFF' },
    secondary: { main: '#4A635F', contrastText: '#FFFFFF' },
    error: { main: '#BA1A1A' },
    warning: { main: '#8A5300' },
    success: { main: '#1F6C3A' },
    info: { main: '#1D5C96' },
    background: { default: m3.surface, paper: '#FFFFFF' },
    text: { primary: m3.onSurface, secondary: m3.onSurfaceVariant },
    divider: m3.outlineVariant,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
    h4: { fontSize: '2rem', fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 },
    h5: { fontSize: '1.625rem', fontWeight: 500, lineHeight: 1.25, letterSpacing: 0 },
    h6: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.4 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, letterSpacing: 0.1 },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0.1 },
    overline: { fontWeight: 600, letterSpacing: 1.2, lineHeight: 1.6 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitTapHighlightColor: 'transparent' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20, minHeight: 40 },
        sizeLarge: { minHeight: 52, fontSize: '1rem', paddingInline: 24 },
        outlined: { borderColor: m3.outline },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 16, borderColor: m3.outlineVariant } },
    },
    MuiCardActionArea: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderColor: m3.outline,
          color: m3.onSurface,
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: m3.secondaryContainer,
            color: m3.onSecondaryContainer,
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { borderRadius: 999 },
        firstButton: { borderTopLeftRadius: 999, borderBottomLeftRadius: 999 },
        lastButton: { borderTopRightRadius: 999, borderBottomRightRadius: 999 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 28 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 16, alignItems: 'center' } },
    },
    MuiListItemButton: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiSnackbarContent: {
      styleOverrides: { root: { borderRadius: 8, backgroundColor: '#2B3230' } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
})
