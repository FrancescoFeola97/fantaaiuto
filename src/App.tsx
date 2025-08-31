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
      
      // Try offline mode first for faster loading
      if (token === 'demo-token-offline-mode') {
        setUser({ id: 'demo', username: 'admin' })
        setIsAuthenticated(true)
        setIsLoading(false)
        console.log('✅ Offline mode authenticated (fast path)')
        return
      }

      // Quick timeout for backend verification
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      try {
        const response = await fetch('https://fantaaiuto-backend.onrender.com/api/auth/verify', {
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
          setUser(result.user || { id: 'demo', username: 'admin' })
          setIsAuthenticated(true)
          console.log('✅ Token valid, user authenticated')
        } else {
          console.log('❌ Token invalid, clearing...')
          localStorage.removeItem('fantaaiuto_token')
        }
      } catch (error) {
        clearTimeout(timeoutId)
        console.warn('⚠️ Backend unavailable, enabling offline mode')
        // Auto-enable offline mode for better UX
        localStorage.setItem('fantaaiuto_token', 'demo-token-offline-mode')
        setUser({ id: 'demo', username: 'admin' })
        setIsAuthenticated(true)
        console.log('✅ Offline mode enabled automatically')
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

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...')
      
      // Clear all local data
      localStorage.removeItem('fantaaiuto_token')
      localStorage.removeItem('fantaaiuto_data')
      
      // Try to notify backend (optional, don't block on failure)
      try {
        await fetch('https://fantaaiuto-backend.onrender.com/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('fantaaiuto_token')}`
          }
        })
      } catch (e) {
        // Ignore backend errors on logout
      }
      
      setUser(null)
      setIsAuthenticated(false)
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Force logout even on error
      setUser(null) 
      setIsAuthenticated(false)
    }
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