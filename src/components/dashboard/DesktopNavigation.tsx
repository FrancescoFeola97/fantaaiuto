import React, { useRef, useState } from 'react'
import { useLeague } from '../../contexts/LeagueContext'
import { useNotifications } from '../../hooks/useNotifications'
import { PlayerData } from '../../types/Player'

interface NavigationItem {
  id: string
  label: string
  icon: string
  onClick: () => void
}

interface DesktopNavigationProps {
  user: {
    username: string
  }
  currentView: string
  navigationItems: NavigationItem[]
  onLogout: () => void
  onImportExcel?: (players: PlayerData[]) => void
  playersCount?: number
  isImporting?: boolean
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  user,
  currentView,
  navigationItems,
  onLogout,
  onImportExcel,
  isImporting
}) => {
  const { currentLeague } = useLeague()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [xlsxProgress, setXlsxProgress] = useState(0)
  const { success, error: showError } = useNotifications()

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      // Validate file type
      if (!file.name.match(/\.(xlsx?|csv)$/i)) {
        throw new Error('Formato file non supportato. Usa .xlsx, .xls o .csv')
      }

      // Dynamic import for xlsx to reduce bundle size
      const { read, utils } = await import('xlsx')

      setXlsxProgress(20)

      const buffer = await file.arrayBuffer()
      setXlsxProgress(40)

      const workbook = read(buffer, { type: 'buffer' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = utils.sheet_to_json(firstSheet, { header: 1 })

      setXlsxProgress(60)

      if (!jsonData || jsonData.length < 2) {
        throw new Error('Il file Excel è vuoto o non contiene dati validi')
      }

      const headers = (jsonData[0] as string[]).map(h => h?.toString().toLowerCase().trim())
      const dataRows = jsonData.slice(1)

      const requiredColumns = ['nome', 'squadra', 'ruoli', 'fvm', 'prezzo']
      const missingColumns = requiredColumns.filter(col => 
        !headers.some(h => h.includes(col) || col.includes(h))
      )

      if (missingColumns.length > 0) {
        throw new Error(`Colonne mancanti: ${missingColumns.join(', ')}. Verifica che il file contenga: Nome, Squadra, Ruoli, FVM, Prezzo`)
      }

      setXlsxProgress(80)

      const players: PlayerData[] = dataRows.map((row: any) => {
        const nome = row[headers.findIndex(h => h.includes('nome'))]?.toString().trim() || ''
        const squadra = row[headers.findIndex(h => h.includes('squadra'))]?.toString().trim() || ''
        const ruoliStr = row[headers.findIndex(h => h.includes('ruoli') || h.includes('ruolo'))]?.toString().trim() || ''
        const fvm = parseFloat(row[headers.findIndex(h => h.includes('fvm'))] || 0)
        const prezzo = parseFloat(row[headers.findIndex(h => h.includes('prezzo'))] || 0)

        const ruoliMantra = parseRolesMantra(ruoliStr)
        const ruoliClassic = parseRolesClassic(ruoliStr)

        return {
          id: (Date.now() + Math.random()).toString(),
          nome,
          squadra,
          ruoli: ruoliMantra.length > 0 ? ruoliMantra : ['A'],
          ruoliMantra,
          ruoliClassic,
          fvm: isNaN(fvm) ? 0 : fvm,
          prezzo: isNaN(prezzo) ? 0 : prezzo,
          interessante: false,
          status: 'available' as const,
          costoReale: undefined,
          acquistatore: undefined,
          note: undefined,
          prezzoAtteso: undefined
        }
      }).filter(p => {
        const isValid = p.nome.trim().length > 0 && p.nome !== 'Nome' && p.nome !== '' && p.nome !== 'undefined'
        return isValid
      })

      if (players.length === 0) {
        throw new Error('Nessun giocatore valido trovato. Verifica le colonne (Nome, Squadra, Ruoli, FVM, Prezzo)')
      }

      setXlsxProgress(100)
      onImportExcel?.(players)
      success(`✅ Excel importato! ${players.length} giocatori caricati.`)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('❌ Error processing Excel file:', error)
      showError(`❌ Errore parsing Excel: ${error.message}`)
    } finally {
      setIsUploading(false)
      setXlsxProgress(0)
    }
  }

  const parseRolesMantra = (roleStr: string): string[] => {
    if (!roleStr) return []
    
    const roleString = roleStr.toString().trim()
    if (!roleString) return []
    
    const roles = roleString.split(';').map(r => r.trim()).filter(r => r.length > 0)
    const validMantraRoles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc']
    
    const mappedRoles = roles
      .map(role => role.trim())
      .filter(role => validMantraRoles.includes(role))
    
    return [...new Set(mappedRoles)]
  }

  const parseRolesClassic = (roleStr: string): string[] => {
    if (!roleStr) return []
    
    const roleString = roleStr.toString().trim()
    if (!roleString) return []
    
    const roles = roleString.split(';').map(r => r.trim()).filter(r => r.length > 0)
    const mappedRoles: string[] = []
    
    roles.forEach(role => {
      const roleMapping: Record<string, string> = {
        'P': 'P', 'Por': 'P',
        'D': 'D', 'Ds': 'D', 'Dd': 'D', 'Dc': 'D', 'B': 'D',
        'E': 'C', 'C': 'C', 'M': 'C', 'W': 'C', 'T': 'C',
        'A': 'A', 'Pc': 'A'
      }
      
      const mapped = roleMapping[role]
      if (mapped) {
        mappedRoles.push(mapped)
      }
    })
    
    return [...new Set(mappedRoles)]
  }

  return (
    <nav className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.username}</p>
              {currentLeague && (
                <p className="text-sm text-gray-500">{currentLeague.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Logout"
          >
            🚪
          </button>
        </div>
        
        {/* Main Navigation */}
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📱 Navigazione</h3>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* Tools Section */}
        {onImportExcel && (
          <div className="mb-6 p-3 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">⚡ Strumenti</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isImporting}
              className={`w-full px-3 py-2 rounded-lg border transition-colors text-left text-sm ${
                isUploading || isImporting
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
              }`}
            >
              {isUploading ? '⏳ Parsing Excel...' : isImporting ? '☁️ Caricamento...' : '📋 Carica Excel'}
            </button>
            
            {isUploading && xlsxProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${xlsxProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* League Info */}
        {currentLeague && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs font-medium text-blue-900 mb-1">Lega Attiva</div>
            <div className="text-sm font-semibold text-blue-800">{currentLeague.name}</div>
            <div className="text-xs text-blue-600">
              {currentLeague.gameMode} • {currentLeague.code}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}