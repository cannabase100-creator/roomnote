const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveSession: (filename, data) => ipcRenderer.invoke('save-session', { filename, data }),
  loadSession: ()              => ipcRenderer.invoke('load-session'),

  // Native notification
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body }),

  // App info
  version: () => ipcRenderer.invoke('version'),

  // Menu events → renderer
  onMenu: (callback) => {
    const events = [
      'menu:new', 'menu:record', 'menu:pause', 'menu:stop',
      'menu:save', 'menu:open', 'menu:pdf', 'menu:copy',
      'menu:find', 'menu:settings', 'menu:speakers',
    ]
    events.forEach(ch => ipcRenderer.on(ch, () => callback(ch.replace('menu:', ''))))
  },
})
