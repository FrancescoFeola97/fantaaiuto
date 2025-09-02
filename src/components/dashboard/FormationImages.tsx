import React, { useState, useEffect, useRef } from 'react'

interface FormationImage {
  id: string
  filename: string
  originalName: string
  description?: string
  uploadedAt: string
}

interface FormationImagesProps {
  onBackToPlayers: () => void
}

export const FormationImages: React.FC<FormationImagesProps> = ({ onBackToPlayers }) => {
  const [images, setImages] = useState<FormationImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/formations/images', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      } else {
        throw new Error('Errore caricamento immagini')
      }
    } catch (error: any) {
      console.error('❌ Error loading images:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('❌ Per favore seleziona un file immagine (PNG, JPG, etc.)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Il file è troppo grande (max 10MB)')
      return
    }

    setIsUploading(true)

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const formData = new FormData()
      formData.append('image', file)
      formData.append('description', file.name)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/formations/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setImages(prev => [...prev, data.image])
        alert('✅ Immagine caricata con successo!')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Errore caricamento immagine')
      }
    } catch (error: any) {
      console.error('❌ Error uploading image:', error)
      if (error.name === 'AbortError') {
        alert('❌ Timeout: Upload troppo lento. Riprova con un file più piccolo.')
      } else {
        alert(`❌ Errore: ${error.message}`)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) return

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/formations/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId))
        alert('✅ Immagine eliminata!')
      } else {
        throw new Error('Errore eliminazione immagine')
      }
    } catch (error: any) {
      alert(`❌ Errore: ${error.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento immagini...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📸 Immagini Formazioni</h2>
          <p className="text-sm text-gray-600">{images.length} immagini caricate</p>
        </div>
        <div className="flex space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isUploading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isUploading ? '⏳ Caricamento...' : '📸 Carica Immagine'}
          </button>
          <button
            onClick={onBackToPlayers}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            ← Torna ai Giocatori
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📸</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna immagine caricata</h3>
          <p className="text-gray-600 mb-4">Carica le immagini delle tue formazioni per tenerle sempre a portata di mano.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            📸 Carica Prima Immagine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map(image => (
            <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <img 
                  src={`https://fantaaiuto-backend.onrender.com/api/formations/images/${image.id}/view`}
                  alt={image.originalName}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = '<div class="text-gray-400 text-4xl">🖼️</div><p class="text-sm text-gray-500 mt-2">Immagine non disponibile</p>'
                  }}
                />
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate">{image.originalName}</h3>
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Elimina immagine"
                  >
                    🗑️
                  </button>
                </div>
                
                {image.description && (
                  <p className="text-sm text-gray-600 mb-2">{image.description}</p>
                )}
                
                <p className="text-xs text-gray-500">
                  Caricata: {new Date(image.uploadedAt).toLocaleDateString('it-IT')}
                </p>
                
                <div className="flex space-x-2 mt-3">
                  <button 
                    onClick={() => window.open(`https://fantaaiuto-backend.onrender.com/api/formations/images/${image.id}/view`, '_blank')}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 text-sm transition-colors"
                  >
                    👁️ Visualizza
                  </button>
                  <button 
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = `https://fantaaiuto-backend.onrender.com/api/formations/images/${image.id}/download`
                      link.download = image.originalName
                      link.click()
                    }}
                    className="flex-1 py-2 px-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 text-sm transition-colors"
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}