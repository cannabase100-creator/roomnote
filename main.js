'use strict';

const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#111111',
    titleBarStyle: 'hiddenInset',
    title: 'RoomNote',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Auto-approve microphone permission — macOS will still show its own system prompt
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    callback(permission === 'media');
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Save transcript to disk via native save dialog
ipcMain.handle('save-file', async (event, { content, filename }) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath('documents'), filename || 'RoomNote_Transcript.txt'),
    filters: [{ name: 'Text Document', extensions: ['txt'] }]
  });
  if (!canceled && filePath) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true, path: filePath };
  }
  return { success: false };
});

// Expose app userData path so renderer can set Hugging Face cache dir
ipcMain.handle('get-user-data', () => app.getPath('userData'));
