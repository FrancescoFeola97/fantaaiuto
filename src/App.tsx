import { useEffect, useState, useRef, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { Dashboard } from './components/Dashboard'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LeagueProvider, useLeague } from './contexts/LeagueContext'
import { buildApiUrl, API_ENDPOINTS } from './config/api'
import { checkRateLimit, activateGlobalRateLimit } from './utils/rateLimitManager'

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
  const [isVerifyingToken, setIsVerifyingToken] = useState(false)
  const authCheckInProgress = useRef(false)
  const lastAuthCheck = useRef<number>(0)
  const authRetryCount = useRef<number>(0)
  const rateLimitedUntil = useRef<number>(0)

  useEffect(() => {
    // Only check authentication once when app first loads
    checkAuthentication()
  }, [])

  const checkAuthentication = useCallback(async () => {
    // Controlla rate limiting globale prima di tutto
    if (!checkRateLimit('token verification')) {
      return
    }

    // Previeni chiamate multiple simultanee con protezione avanzata
    const now = Date.now()
    if (authCheckInProgress.current || isVerifyingToken) {
      console.log('⚠️ Token verification already in progress, skipping...')
      return
    }
    
    // Controlla se siamo ancora in rate limiting
    if (now < rateLimitedUntil.current) {
      const remainingTime = Math.ceil((rateLimitedUntil.current - now) / 1000)
      console.log(`⚠️ Still rate limited for ${remainingTime}s, skipping token verification...`)
      return
    }

    // Exponential backoff: aumenta il delay dopo ogni retry fallito
    const backoffDelay = Math.min(5000 * Math.pow(2, authRetryCount.current), 60000)
    if (now - lastAuthCheck.current < backoffDelay) {
      console.log(`⚠️ Token verification backoff active (${Math.ceil((backoffDelay - (now - lastAuthCheck.current)) / 1000)}s remaining)`)
      return
    }
    
    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      authCheckInProgress.current = true
      lastAuthCheck.current = now
      setIsVerifyingToken(true)
      console.log('🔍 Verifying token...')
      
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
          // Reset retry count on success
          authRetryCount.current = 0
          rateLimitedUntil.current = 0
          setUser(result.user)
          setIsAuthenticated(true)
          console.log('✅ Token verification successful')
        } else if (response.status === 429) {
          authRetryCount.current++
          // Attiva rate limiting globale per 3 minuti
          activateGlobalRateLimit(3 * 60 * 1000)
          rateLimitedUntil.current = now + (3 * 60 * 1000)
          console.warn(`⚠️ Rate limited - activating global protection for 3 minutes. Retry count: ${authRetryCount.current}`)
          setError('Troppi tentativi di accesso. Tutte le richieste sono state sospese per 3 minuti.')
        } else {
          // Reset rate limiting per errori non-429
          if (response.status !== 429) {
            authRetryCount.current = 0
            rateLimitedUntil.current = 0
          }
          localStorage.removeItem('fantaaiuto_token')
          setError('Sessione scaduta. Effettua nuovamente il login.')
        }
      } catch (error) {
        clearTimeout(timeoutId)
        if ((error as Error).name === 'AbortError') {
          console.log('⚠️ Token verification request aborted')
        } else {
          console.error('❌ Backend connection failed:', error)
          localStorage.removeItem('fantaaiuto_token')
          setError('Impossibile connettersi al server. Verifica la connessione internet.')
        }
      }
    } catch (error) {
      console.error('❌ Authentication check failed:', error)
      setError('Errore durante la verifica dell\'autenticazione.')
    } finally {
      setIsLoading(false)
      setIsVerifyingToken(false)
      authCheckInProgress.current = false
    }
  }, [])

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
      } catch (error) {
        clearTimeout(timeoutId)
        console.warn('⚠️ Backend logout failed, continuing with local logout')
      }
      
      // Clear all local data
      localStorage.removeItem('fantaaiuto_token')
      localStorage.removeItem('fantaaiuto_data')
      localStorage.removeItem('fantaaiuto_current_league')
      
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