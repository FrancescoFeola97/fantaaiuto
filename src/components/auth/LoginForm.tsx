import React, { useState } from 'react'

interface User {
  id: string
  username: string
  email?: string
}

interface LoginFormProps {
  onLogin: (user: User) => void
  onRegisterClick?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onRegisterClick }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoginInProgress, setIsLoginInProgress] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password) {
      setError('Nome utente e password sono obbligatori')
      return
    }

    // Previeni chiamate multiple simultanee
    if (isLoginInProgress) {
      console.log('⚠️ Login already in progress, skipping...')
      return
    }

    setIsLoginInProgress(true)
    setIsLoading(true)
    setError('')
    console.log('🔐 Attempting login for user:', username.trim())

    try {
      let response: Response
      let result: any

      // Backend-only authentication with proper timeout for Render cold starts
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s for Render cold start
      
      response = await fetch('https://fantaaiuto-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), password }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        result = await response.json()
        if (response.status === 429) {
          throw new Error('Too many requests from this IP, please try again later.')
        }
        throw new Error(result.error || `Errore ${response.status}: ${response.statusText}`)
      }
      
      result = await response.json()

      localStorage.setItem('fantaaiuto_token', result.token)
      console.log('✅ Login successful')
      onLogin(result.user)
    } catch (error: any) {
      console.error('❌ Login error:', error)
      if (error.name === 'AbortError') {
        setError('Timeout: Il server sta impiegando troppo tempo a rispondere. Riprova.')
      } else {
        setError(error.message || 'Errore di connessione al server. Verifica la tua connessione internet.')
      }
    } finally {
      setIsLoading(false)
      setIsLoginInProgress(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
      <div className="bg-white p-10 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">⚽ FantaAiuto</h1>
          <p className="text-gray-600">Fantasy Football Manager</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Nome utente o Email
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Inserisci nome utente o email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Inserisci password"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || isLoginInProgress}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Accesso in corso...
              </span>
            ) : '🔐 Accedi'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center text-sm">
            <p className="font-medium text-gray-900 mb-2">🌐 Account Demo</p>
            <p className="text-gray-700"><strong>Username:</strong> demo</p>
            <p className="text-gray-700"><strong>Password:</strong> demo123</p>
            <p className="text-xs text-gray-500 mt-2">Backend PostgreSQL (Supabase)</p>
          </div>
          
          {onRegisterClick && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Non hai un account?</p>
              <button
                onClick={onRegisterClick}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                🎯 Crea nuovo account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}