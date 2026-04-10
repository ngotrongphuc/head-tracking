import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  executeAction: (action: string) => ipcRenderer.send('execute-action', action),
  onSettingsLoaded: (callback: (settings: unknown) => void) => {
    ipcRenderer.on('settings-loaded', (_, settings) => callback(settings))
  },
  saveSettings: (settings: unknown) => ipcRenderer.send('save-settings', settings),
  loadSettings: () => ipcRenderer.send('load-settings')
})
