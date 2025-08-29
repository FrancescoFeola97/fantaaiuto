const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

  // File operations
  onNewProject: (callback) => ipcRenderer.on('new-project', callback),
  onLoadExcel: (callback) => ipcRenderer.on('load-excel', callback),
  onExportData: (callback) => ipcRenderer.on('export-data', callback),
  onImportData: (callback) => ipcRenderer.on('import-data', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Platform detection
contextBridge.exposeInMainWorld('platform', {
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux'
});

// Console override for better debugging in production
contextBridge.exposeInMainWorld('debug', {
  log: (...args) => console.log('[FantaAiuto]', ...args),
  warn: (...args) => console.warn('[FantaAiuto]', ...args),
  error: (...args) => console.error('[FantaAiuto]', ...args)
});