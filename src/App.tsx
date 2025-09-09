import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { Dashboard } from './components/Dashboard'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LeagueProvider, useLeague } from './contexts/LeagueContext'
import { buildApiUrl, API_ENDPOINTS } from './config/api'

interface User {
  id: string
  username: string
  email?: string
}

interface AuthenticatedAppProps {
  user: User
  onLogout: () => void
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ user, onLogout }) => {
  const { isLoading } = useLeague()

  if (isLoading) {
    return <LoadingScreen />
  }

  // Always show main dashboard after authentication
  return <Dashboard user={user} onLogout={onLogout} />
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      // Token verification - removed sensitive logging
      
      // Backend-only authentication with extended timeout for Render cold start
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s for Render cold start
      
      try {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.VERIFY), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ token }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const result = await response.json()
          setUser(result.user)
          setIsAuthenticated(true)
          console.log('✅ Backend authentication successful')
        } else {
          console.log('❌ Token invalid, clearing...')
          localStorage.removeItem('fantaaiuto_token')
          setError('Sessione scaduta. Effettua nuovamente il login.')
        }
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('❌ Backend connection failed:', error)
        localStorage.removeItem('fantaaiuto_token')
        setError('Impossibile connettersi al server. Verifica la connessione internet.')
      }
    } catch (error) {
      console.error('❌ Authentication check failed:', error)
      setError('Errore durante la verifica dell\'autenticazione.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (user: User) => {
    setUser(user)
    setIsAuthenticated(true)
    setShowRegister(false)
    setError('')
  }

  const handleRegister = (user: User) => {
    setUser(user)
    setIsAuthenticated(true)
    setShowRegister(false)
    setError('')
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out from backend...')
      
      const token = localStorage.getItem('fantaaiuto_token')
      
      // Notify backend with proper timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      try {
        await fetch(buildApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        console.log('✅ Backend logout successful')
      } catch (error) {
        clearTimeout(timeoutId)
        console.warn('⚠️ Backend logout failed, continuing with local logout')
      }
      
      // Clear all local data
      localStorage.removeItem('fantaaiuto_token')
      localStorage.removeItem('fantaaiuto_data')
      
      setUser(null)
      setIsAuthenticated(false)
      setError('')
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Force logout even on error
      localStorage.clear()
      setUser(null) 
      setIsAuthenticated(false)
      setError('')
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <>
        {showRegister ? (
          <RegisterForm 
            onRegister={handleRegister}
            onBackToLogin={() => setShowRegister(false)}
          />
        ) : (
          <LoginForm 
            onLogin={handleLogin} 
            onRegisterClick={() => setShowRegister(true)}
          />
        )}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
            <p className="text-sm font-medium">Errore di Connessione</p>
            <p className="text-xs">{error}</p>
          </div>
        )}
      </>
    )
  }

  return (
    <ErrorBoundary>
      <LeagueProvider userId={user?.id || null}>
        <AuthenticatedApp user={user!} onLogout={handleLogout} />
        <Toaster />
      </LeagueProvider>
    </ErrorBoundary>
  )
}

export default App