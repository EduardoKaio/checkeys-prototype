import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Snackbar } from '@mui/material'

const ToastContext = createContext<(msg: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; key: number } | null>(null)
  const show = useCallback((text: string) => setMsg({ text, key: Date.now() }), [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      <Snackbar
        key={msg?.key}
        open={!!msg}
        message={msg?.text}
        autoHideDuration={3200}
        onClose={(_, reason) => reason !== 'clickaway' && setMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 'calc(96px + env(safe-area-inset-bottom))', md: 24 } }}
      />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
