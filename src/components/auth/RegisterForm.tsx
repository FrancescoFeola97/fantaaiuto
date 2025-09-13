import React, { useState, useRef } from 'react'

interface User {
  id: string
  username: string
  email?: string
}

interface RegisterFormProps {
  onRegister: (user: User) => void
  onBackToLogin: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onBackToLogin }) => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterInProgress, setIsRegisterInProgress] = useState(false)
  const lastRegisterAttempt = useRef<number>(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Tutti i campi sono obbligatori')
      return
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono')
      return
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      return
    }

    // Previeni chiamate multiple simultanee con protezione avanzata
    const now = Date.now()
    if (isRegisterInProgress) {
      console.log('⚠️ Registration already in progress, skipping...')
      return
    }
    
    // Previeni tentativi di registrazione troppo frequenti (minimo 2 secondi tra tentativi)
    if (now - lastRegisterAttempt.current < 2000) {
      console.log('⚠️ Registration attempted too frequently, skipping...')
      return
    }
    
    lastRegisterAttempt.current = now

    setIsRegisterInProgress(true)
    setIsLoading(true)
    setError('')
    console.log('📝 Attempting registration for user:', username.trim())

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          email: email.trim(),
          password,
          displayName: displayName.trim() || username.trim()
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const result = await response.json()
        if (response.status === 429) {
          throw new Error('Too many requests from this IP, please try again later.')
        }
        throw new Error(result.error || `Errore ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      localStorage.setItem('fantaaiuto_token', result.token)
      console.log('✅ Registration successful')
      onRegister(result.user)
    } catch (error: any) {
      console.error('❌ Registration error:', error)
      if (error.name === 'AbortError') {
        setError('Timeout: Il server sta impiegando troppo tempo a rispondere. Riprova.')
      } else {
        setError(error.message || 'Errore di connessione al server. Verifica la tua connessione internet.')
      }
    } finally {
      setIsLoading(false)
      setIsRegisterInProgress(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
      <div className="bg-white p-10 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">⚽ FantaAiuto</h1>
          <p className="text-gray-600">Crea il tuo account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Nome utente *
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Scegli un nome utente"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="La tua email"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome visualizzato
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Nome da mostrare (opzionale)"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Almeno 6 caratteri"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Conferma Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Ripeti la password"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || isRegisterInProgress}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creazione account...
              </span>
            ) : '🎯 Crea Account'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Torna al Login
          </button>
        </div>
      </div>
    </div>
  )
}