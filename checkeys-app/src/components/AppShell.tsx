import type { ReactElement } from 'react'
import { NavLink, Outlet, useLocation, Link as RouterLink } from 'react-router'
import { AppBar, Avatar, Box, ButtonBase, IconButton, Stack, Toolbar, Tooltip, Typography, useScrollTrigger } from '@mui/material'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import DashboardRounded from '@mui/icons-material/DashboardRounded'
import EventOutlined from '@mui/icons-material/EventOutlined'
import EventRounded from '@mui/icons-material/EventRounded'
import QrCodeScannerRounded from '@mui/icons-material/QrCodeScannerRounded'
import HistoryRounded from '@mui/icons-material/HistoryRounded'
import KeyOutlined from '@mui/icons-material/KeyOutlined'
import KeyRounded from '@mui/icons-material/KeyRounded'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import { useStore } from '../data/store'
import { m3 } from '../theme'

interface NavItem {
  to: string
  label: string
  icon: ReactElement
  activeIcon: ReactElement
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'Painel', icon: <DashboardOutlined />, activeIcon: <DashboardRounded /> },
  { to: '/reservas', label: 'Reservas', icon: <EventOutlined />, activeIcon: <EventRounded /> },
  { to: '/ler', label: 'Ler chave', icon: <QrCodeScannerRounded />, activeIcon: <QrCodeScannerRounded /> },
  { to: '/historico', label: 'Histórico', icon: <HistoryRounded />, activeIcon: <HistoryRounded /> },
  { to: '/chaves', label: 'Chaves', icon: <KeyOutlined />, activeIcon: <KeyRounded /> },
]

const AJUSTES: NavItem = { to: '/ajustes', label: 'Ajustes', icon: <SettingsOutlined />, activeIcon: <SettingsRounded /> }

const RAIL = 96

function isActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/'
  if (to === '/chaves') return pathname.startsWith('/chaves') || pathname.startsWith('/etiquetas')
  return pathname.startsWith(to)
}

function NavButton({ item, active, rail }: { item: NavItem; active: boolean; rail?: boolean }) {
  return (
    <ButtonBase
      component={NavLink}
      to={item.to}
      aria-current={active ? 'page' : undefined}
      sx={{
        flex: rail ? 'none' : 1,
        width: rail ? '100%' : undefined,
        minWidth: 0,
        flexDirection: 'column',
        gap: 0.5,
        py: rail ? 1 : 0.75,
        borderRadius: '12px',
        color: active ? m3.onSurface : m3.onSurfaceVariant,
        '&:hover .ind': { bgcolor: active ? m3.secondaryContainer : m3.surfaceHigh },
      }}
    >
      <Box
        className="ind"
        sx={{
          width: rail ? 56 : 64,
          height: 32,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          bgcolor: active ? m3.secondaryContainer : 'transparent',
          color: active ? m3.onSecondaryContainer : 'inherit',
          transition: 'background-color .2s',
        }}
      >
        {active ? item.activeIcon : item.icon}
      </Box>
      <Typography variant="caption" sx={{ fontWeight: active ? 700 : 500, letterSpacing: 0.3, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
        {item.label}
      </Typography>
    </ButtonBase>
  )
}

export default function AppShell() {
  const { state } = useStore()
  const { pathname } = useLocation()
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 4 })
  const inicial = (state.operador || 'R').trim().charAt(0).toUpperCase()

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      {/* Navigation rail (computador) */}
      <Box
        component="nav"
        aria-label="Seções"
        className="no-print"
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: RAIL,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          py: 2,
          px: 1,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          zIndex: 1200,
        }}
      >
        <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', mb: 2 }}>
          <KeyRounded />
        </Box>
        {ITEMS.map((it) => (
          <NavButton key={it.to} item={it} active={isActive(pathname, it.to)} rail />
        ))}
        <Box sx={{ flex: 1 }} />
        <NavButton item={AJUSTES} active={isActive(pathname, AJUSTES.to)} rail />
      </Box>

      <Box className="shell-content" sx={{ ml: { md: `${RAIL}px` } }}>
        <AppBar
          position="sticky"
          elevation={0}
          className="no-print"
          sx={{
            bgcolor: scrolled ? m3.surfaceContainer : 'background.default',
            color: 'text.primary',
            transition: 'background-color .2s',
            pt: 'env(safe-area-inset-top)',
          }}
        >
          <Toolbar sx={{ gap: 1.5, maxWidth: 1120, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{ display: { xs: 'flex', md: 'none' }, width: 40, height: 40, borderRadius: '12px', bgcolor: 'primary.main', color: '#fff', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Painel"
            >
              <KeyRounded fontSize="small" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" component="div" sx={{ lineHeight: 1.2 }}>
                Checkeys
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                Recepção SEPA
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title="Ajustes">
                <IconButton component={RouterLink} to="/ajustes" aria-label="Ajustes" sx={{ display: { md: 'none' } }}>
                  <SettingsOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title={`Em serviço: ${state.operador}`}>
                <IconButton component={RouterLink} to="/ajustes" aria-label={`Em serviço: ${state.operador}. Abrir ajustes`}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#D6E7FB', color: '#0B3D66', fontSize: 15, fontWeight: 600 }}>{inicial}</Avatar>
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            maxWidth: 1120,
            mx: 'auto',
            px: { xs: 2, sm: 3 },
            pt: 1,
            pb: { xs: 'calc(104px + env(safe-area-inset-bottom))', md: 6 },
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Navigation bar (celular) */}
      <Box
        component="nav"
        aria-label="Seções"
        className="no-print"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1200,
          bgcolor: m3.surfaceContainer,
          px: 1,
          pt: 1.25,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          gap: 0.5,
        }}
      >
        {ITEMS.map((it) => (
          <NavButton key={it.to} item={it} active={isActive(pathname, it.to)} />
        ))}
      </Box>
    </Box>
  )
}
