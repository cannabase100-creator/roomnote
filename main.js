const { app, BrowserWindow, Menu, ipcMain, dialog, Notification, shell, nativeTheme } = require('electron')
const path = require('path')
const fs = require('fs')

// Force dark mode
nativeTheme.themeSource = 'dark'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'RoomNote',
    backgroundColor: '#0D0E16',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  })

  mainWindow.loadFile('index.html')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function buildMenu() {
  const send = (ch) => () => { if (mainWindow) mainWindow.webContents.send(ch) }

  const template = [
    {
      label: 'RoomNote',
      submenu: [
        { label: 'About RoomNote', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences…', accelerator: 'Cmd+,', click: send('menu:settings') },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Session',
      submenu: [
        { label: 'New Session',       accelerator: 'Cmd+N',       click: send('menu:new') },
        { type: 'separator' },
        { label: 'Start Recording',   accelerator: 'Cmd+R',       click: send('menu:record') },
        { label: 'Pause / Resume',    accelerator: 'Cmd+Shift+P', click: send('menu:pause') },
        { label: 'Stop & Transcribe', accelerator: 'Cmd+Shift+S', click: send('menu:stop') },
        { type: 'separator' },
        { label: 'Save Session…',     accelerator: 'Cmd+S',       click: send('menu:save') },
        { label: 'Open Session…',     accelerator: 'Cmd+O',       click: send('menu:open') },
        { type: 'separator' },
        { label: 'Name Speakers…',    accelerator: 'Cmd+Shift+N', click: send('menu:speakers') },
      ],
    },
    {
      label: 'Export',
      submenu: [
        { label: 'Export as PDF',      accelerator: 'Cmd+P',       click: send('menu:pdf') },
        { label: 'Copy Full Transcript', accelerator: 'Cmd+Shift+C', click: send('menu:copy') },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find in Transcript…', accelerator: 'Cmd+F', click: send('menu:find') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── IPC ──────────────────────────────────────────────────────────

ipcMain.handle('save-session', async (_e, { filename, data }) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [
      { name: 'RoomNote Session', extensions: ['rn'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  })
  if (canceled || !filePath) return { ok: false }
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    return { ok: true, path: filePath }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('load-session', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'RoomNote Session', extensions: ['rn', 'json'] }],
    properties: ['openFile'],
  })
  if (canceled || !filePaths.length) return { ok: false }
  try {
    const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('notify', (_e, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title, body, silent: false }).show()
})

ipcMain.handle('version', () => app.getVersion())

// ── Lifecycle ────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  buildMenu()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
