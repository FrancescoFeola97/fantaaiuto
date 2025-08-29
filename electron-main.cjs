const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Development flag  
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: !isDev,
      preload: path.join(__dirname, 'electron-preload.cjs')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#667eea'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8084');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('dist/index.html');
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const currentUrl = new URL(mainWindow.webContents.getURL());
    
    if (parsedUrl.origin !== currentUrl.origin) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Nuovo Progetto',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['Annulla', 'Nuovo Progetto'],
              defaultId: 1,
              message: 'Creare un nuovo progetto?',
              detail: 'Tutti i dati correnti verranno persi. Questa azione non può essere annullata.'
            }).then(result => {
              if (result.response === 1) {
                mainWindow.webContents.send('new-project');
              }
            });
          }
        },
        {
          label: 'Carica Excel',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            }).then(result => {
              if (!result.canceled && result.filePaths.length > 0) {
                mainWindow.webContents.send('load-excel', result.filePaths[0]);
              }
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Esporta Dati',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const date = new Date().toISOString().split('T')[0];
            dialog.showSaveDialog(mainWindow, {
              defaultPath: `fantaaiuto-backup-${date}.json`,
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            }).then(result => {
              if (!result.canceled) {
                mainWindow.webContents.send('export-data', result.filePath);
              }
            });
          }
        },
        {
          label: 'Importa Dati',
          click: () => {
            dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            }).then(result => {
              if (!result.canceled && result.filePaths.length > 0) {
                mainWindow.webContents.send('import-data', result.filePaths[0]);
              }
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Esci',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Modifica',
      submenu: [
        { label: 'Annulla', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Ripeti', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Taglia', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copia', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Incolla', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Seleziona Tutto', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
      ]
    },
    {
      label: 'Visualizza',
      submenu: [
        { label: 'Ricarica', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Ricarica Forzata', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Strumenti Sviluppatore', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Zoom Avanti', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Indietro', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Zoom Reset', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Schermo Intero', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Finestra',
      submenu: [
        { label: 'Minimizza', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Chiudi', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: 'Aiuto',
      submenu: [
        {
          label: 'Info su FantaAiuto',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Info su FantaAiuto',
              message: 'FantaAiuto v2.0.0',
              detail: 'Tracker avanzato per il Fantacalcio Mantra\n\nSviluppato da Francesco\nCon Claude Code'
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'Info su ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Servizi', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Nascondi ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Nascondi Altri', accelerator: 'Command+Alt+H', role: 'hideothers' },
        { label: 'Mostra Tutto', role: 'unhide' },
        { type: 'separator' },
        { label: 'Esci', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });

    // Window menu
    template[4].submenu = [
      { label: 'Chiudi', accelerator: 'CmdOrCtrl+W', role: 'close' },
      { label: 'Minimizza', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
      { label: 'Zoom', role: 'zoom' },
      { type: 'separator' },
      { label: 'Porta Tutto in Primo Piano', role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event listeners
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle file operations
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

// Auto-updater placeholder (for future implementation)
if (!isDev) {
  // Auto-updater logic would go here
}