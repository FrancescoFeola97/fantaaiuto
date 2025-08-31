import React, { useState } from 'react'

interface User {
  id: string
  username: string
  email?: string
}

interface LoginFormProps {
  onLogin: (user: User) => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password) {
      setError('Nome utente e password sono obbligatori')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      let response: Response
      let result: any

      try {
        response = await fetch('https://fantaaiuto-backend.onrender.com/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: username.trim(), password })
        })
        result = await response.json()
      } catch (backendError) {
        console.warn('⚠️ Backend unavailable, using offline mode for demo:', backendError)
        // Demo mode fallback
        if (username === 'admin' && password === 'password') {
          result = { token: 'demo-token-offline-mode', user: { id: 'demo', username: 'admin' } }
          response = { ok: true } as Response
        } else {
          throw new Error('Demo mode: use admin/password')
        }
      }

      if (response.ok && result.token) {
        localStorage.setItem('fantaaiuto_token', result.token)
        console.log('✅ Login successful')
        onLogin(result.user || { id: 'demo', username: username })
      } else {
        throw new Error(result.error || 'Credenziali non valide')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Errore di connessione. Verifica la connessione internet.')
    } finally {
      setIsLoading(false)
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
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? '⏳ Accesso in corso...' : '🔐 Accedi'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg text-center text-sm">
          <p className="font-medium text-gray-900 mb-2">🎮 Account Demo</p>
          <p className="text-gray-700"><strong>Username:</strong> admin</p>
          <p className="text-gray-700"><strong>Password:</strong> password</p>
        </div>
      </div>
    </div>
  )
}