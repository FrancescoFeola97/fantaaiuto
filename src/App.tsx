import { useEffect, useState } from 'react'
import { LoginForm } from './components/auth/LoginForm'
import { Dashboard } from './components/Dashboard'
import { LoadingScreen } from './components/ui/LoadingScreen'

interface User {
  id: string
  username: string
  email?: string
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

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

      console.log('🔐 Found authentication token, verifying...')
      
      try {
        const response = await fetch('https://fantaaiuto-backend.onrender.com/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        })
        
        if (response.ok) {
          const result = await response.json()
          setUser(result.user || { id: 'demo', username: 'admin' })
          setIsAuthenticated(true)
          console.log('✅ Token valid, user authenticated')
        } else {
          console.log('❌ Token invalid, clearing...')
          localStorage.removeItem('fantaaiuto_token')
        }
      } catch (error) {
        console.warn('⚠️ Backend unavailable, using offline mode:', error)
        // Offline mode fallback
        if (token === 'demo-token-offline-mode') {
          setUser({ id: 'demo', username: 'admin' })
          setIsAuthenticated(true)
          console.log('✅ Offline mode authenticated')
        }
      }
    } catch (error) {
      console.error('❌ Authentication check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (user: User) => {
    setUser(user)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('fantaaiuto_token')
    setUser(null)
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  return <Dashboard user={user!} onLogout={handleLogout} />
}

export default App