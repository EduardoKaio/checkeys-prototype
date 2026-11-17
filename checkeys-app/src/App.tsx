import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router'
import AppShell from './components/AppShell'
import { ToastProvider } from './components/Toast'
import { StoreProvider } from './data/store'
import { FlowProvider } from './flow/FlowProvider'
import { useFlow } from './flow/context'
import Painel from './pages/Painel'
import Ler from './pages/Ler'
import Reservas from './pages/Reservas'
import Historico from './pages/Historico'
import Chaves from './pages/Chaves'
import Etiquetas from './pages/Etiquetas'
import Ajustes from './pages/Ajustes'

/**
 * Link direto para uma chave: https://seu-app.vercel.app/?k=CHK-C40E57
 * Útil quando a etiqueta guarda o link do sistema: a câmera comum do celular abre o Checkeys já na leitura.
 */
function DeepLink() {
  const location = useLocation()
  const navigate = useNavigate()
  const flow = useFlow()
  useEffect(() => {
    const k = new URLSearchParams(location.search).get('k')
    if (!k) return
    navigate('/ler', { replace: true })
    flow.processar(k, 'qr')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <ToastProvider>
          <FlowProvider>
            <DeepLink />
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Painel />} />
                <Route path="ler" element={<Ler />} />
                <Route path="reservas" element={<Reservas />} />
                <Route path="historico" element={<Historico />} />
                <Route path="chaves" element={<Chaves />} />
                <Route path="etiquetas" element={<Etiquetas />} />
                <Route path="ajustes" element={<Ajustes />} />
                <Route path="*" element={<Painel />} />
              </Route>
            </Routes>
          </FlowProvider>
        </ToastProvider>
      </StoreProvider>
    </BrowserRouter>
  )
}
