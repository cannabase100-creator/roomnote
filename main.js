const { app, BrowserWindow, Menu, ipcMain, dialog, Notification, shell, nativeTheme } = require('electron')
const path = require('path')
const fs   = require('fs')
const http = require('http')

// Force dark mode
nativeTheme.themeSource = 'dark'

const isMac = process.platform === 'darwin'
let mainWindow

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s) {
  s = Math.max(0, Math.floor(s))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const p = n => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`
}

// Low-level HTTP helper (works reliably on localhost without CORS/fetch issues)
function httpReq(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const winOpts = {
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'RoomNote',
    backgroundColor: '#0D0E16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  }

  // macOS-only window chrome
  if (isMac) {
    winOpts.titleBarStyle       = 'hiddenInset'
    winOpts.trafficLightPosition = { x: 16, y: 16 }
    winOpts.vibrancy             = 'under-window'
    winOpts.visualEffectState    = 'active'
  } else {
    winOpts.titleBarStyle = 'default'
    winOpts.autoHideMenuBar = false
  }

  mainWindow = new BrowserWindow(winOpts)
  mainWindow.loadFile('index.html')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── Menu ──────────────────────────────────────────────────────────────────────

function buildMenu() {
  const send = (ch) => () => { if (mainWindow) mainWindow.webContents.send(ch) }

  const template = [
    ...(isMac ? [{
      label: 'RoomNote',
      submenu: [
        { label: 'About RoomNote', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences…', accelerator: 'Cmd+,', click: send('menu:settings') },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'Session',
      submenu: [
        { label: 'New Session',       accelerator: isMac ? 'Cmd+N' : 'Ctrl+N',       click: send('menu:new') },
        { type: 'separator' },
        { label: 'Start Recording',   accelerator: isMac ? 'Cmd+R' : 'Ctrl+R',       click: send('menu:record') },
        { label: 'Pause / Resume',    accelerator: isMac ? 'Cmd+Shift+P' : 'Ctrl+Shift+P', click: send('menu:pause') },
        { label: 'Stop & Transcribe', accelerator: isMac ? 'Cmd+Shift+S' : 'Ctrl+Shift+S', click: send('menu:stop') },
        { type: 'separator' },
        { label: 'Save Session…',     accelerator: isMac ? 'Cmd+S' : 'Ctrl+S',       click: send('menu:save') },
        { label: 'Open Session…',     accelerator: isMac ? 'Cmd+O' : 'Ctrl+O',       click: send('menu:open') },
        { type: 'separator' },
        { label: 'Name Speakers…',    accelerator: isMac ? 'Cmd+Shift+N' : 'Ctrl+Shift+N', click: send('menu:speakers') },
      ],
    },
    {
      label: 'Export',
      submenu: [
        { label: 'Export as PDF',        accelerator: isMac ? 'Cmd+P' : 'Ctrl+P',         click: send('menu:pdf') },
        { label: 'Export as Word (DOCX)', accelerator: isMac ? 'Cmd+D' : 'Ctrl+D',         click: send('menu:docx') },
        { label: 'Copy Full Transcript',  accelerator: isMac ? 'Cmd+Shift+C' : 'Ctrl+Shift+C', click: send('menu:copy') },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find in Transcript…', accelerator: isMac ? 'Cmd+F' : 'Ctrl+F', click: send('menu:find') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac ? [{ role: 'zoom' }, { type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── IPC: File Operations ───────────────────────────────────────────────────────

ipcMain.handle('save-session', async (_e, { filename, data }) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [
      { name: 'RoomNote Session', extensions: ['rn'] },
      { name: 'JSON',             extensions: ['json'] },
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

// ── IPC: Ollama ───────────────────────────────────────────────────────────────

ipcMain.handle('ollama-check', async () => {
  return new Promise((resolve) => {
    const req = http.get({ hostname: 'localhost', port: 11434, path: '/' }, () => {
      resolve({ running: true })
    })
    req.setTimeout(2000, () => { req.destroy(); resolve({ running: false }) })
    req.on('error', () => resolve({ running: false }))
  })
})

ipcMain.handle('ollama-summarize', async (_e, { transcript, model = 'llama3.2:3b' }) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a professional meeting summariser for a law firm. Be concise, factual, and structured. Do not add commentary or disclaimers.',
    },
    {
      role: 'user',
      content: `Summarise the following meeting transcript. Structure your response as:\n\n**Overview**\n(2–3 sentences)\n\n**Key Points**\n(bullet list)\n\n**Action Items**\n(bullet list, or "None identified" if none)\n\nTranscript:\n\n${transcript}`,
    },
  ]

  const bodyStr = JSON.stringify({ model, stream: false, messages })

  try {
    const result = await httpReq(
      {
        hostname: 'localhost',
        port: 11434,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
        timeout: 180000, // 3 min — large models are slow on CPU
      },
      bodyStr,
    )

    const json = JSON.parse(result.body)

    if (json.error) return { ok: false, error: json.error }

    const summary = json.message?.content || ''
    return { ok: true, summary }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// ── IPC: Export DOCX ─────────────────────────────────────────────────────────

ipcMain.handle('export-docx', async (_e, { sessionName, durSecs, utterances, spkNames, notes }) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: sessionName.replace(/[^\w\s\-]/g, '').trim() + '.docx',
    filters: [{ name: 'Word Document', extensions: ['docx'] }],
  })
  if (canceled || !filePath) return { ok: false }

  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx')

    // Compute speaker order (first-appearance order, same as renderer)
    const seenSpk = new Set()
    const spkOrder = []
    utterances.forEach(u => {
      if (!seenSpk.has(u.speaker)) { seenSpk.add(u.speaker); spkOrder.push(u.speaker) }
    })
    const getSpkName = (spk) => spkNames[spk] || `Speaker ${spkOrder.indexOf(spk) + 1}`

    const dateStr = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    const metaStr = `${dateStr}  ·  ${fmtTime(durSecs)}  ·  ${spkOrder.length} speaker${spkOrder.length !== 1 ? 's' : ''}`

    const children = [
      new Paragraph({
        children: [new TextRun({ text: sessionName, bold: true, size: 36 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: metaStr, color: '666666', size: 20 })],
        spacing: { after: 400 },
      }),
    ]

    utterances.forEach((u, i) => {
      const name = getSpkName(u.speaker)
      const ts   = fmtTime(Math.floor(u.start || 0))

      children.push(new Paragraph({
        children: [
          new TextRun({ text: name + '  ', bold: true, color: '1D4ED8', size: 24 }),
          new TextRun({ text: ts, color: '888888', size: 20 }),
        ],
        spacing: { before: 240, after: 60 },
      }))

      children.push(new Paragraph({
        children: [new TextRun({ text: u.transcript || '', size: 24 })],
        spacing: { after: notes[i] ? 60 : 200 },
      }))

      if (notes[i]) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `📝 NOTE: ${notes[i]}`, color: '78350F', italics: true, size: 22 })],
          spacing: { after: 200 },
        }))
      }
    })

    const doc = new Document({
      creator: 'RoomNote',
      title: sessionName,
      sections: [{ children }],
    })

    const buffer = await Packer.toBuffer(doc)
    fs.writeFileSync(filePath, buffer)
    return { ok: true, path: filePath }
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      return { ok: false, error: 'docx package not installed — run: npm install' }
    }
    return { ok: false, error: e.message }
  }
})

// ── IPC: Misc ─────────────────────────────────────────────────────────────────

ipcMain.handle('notify', (_e, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title, body, silent: false }).show()
})

ipcMain.handle('version', () => app.getVersion())

// ── Lifecycle ─────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  buildMenu()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})
