import { AuthProvider } from './auth/AuthContext'
import NowPage from './pages/NowPage'

export default function App() {
  return (
    <AuthProvider>
      <NowPage />
    </AuthProvider>
  )
}
