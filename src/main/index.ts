import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { InputSimulator } from './input-simulator'

let mainWindow: BrowserWindow | null = null
const inputSimulator = new InputSimulator()

function getSettingsPath(): string {
  const dir = join(app.getPath('userData'), 'config')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'settings.json')
}

function loadSettings(): object | null {
  const path = getSettingsPath()
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

function saveSettings(settings: object): void {
  writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2))
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 800,
    minHeight: 560,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false
    },
    title: 'Head Tracking',
    autoHideMenuBar: true,
    backgroundColor: '#09090b'
  })

  // Allow MediaPipe CDN resources (WASM + model files)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net; " +
          "connect-src 'self' blob: https://cdn.jsdelivr.net https://storage.googleapis.com; " +
          "worker-src 'self' blob:; " +
          "media-src 'self' blob: mediastream:"
        ]
      }
    })
  })

  // Grant camera permission automatically
  mainWindow.webContents.session.setPermissionRequestHandler((_, permission, callback) => {
    callback(permission === 'media')
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  await inputSimulator.init()

  ipcMain.on('execute-action', (_, action: string) => {
    inputSimulator.executeAction(action)
  })

  ipcMain.on('save-settings', (_, settings) => {
    saveSettings(settings)
  })

  ipcMain.on('load-settings', (event) => {
    const settings = loadSettings()
    event.sender.send('settings-loaded', settings)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  inputSimulator.destroy()
  app.quit()
})
