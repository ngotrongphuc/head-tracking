import { create } from 'zustand'
import type { Settings, ActionType, HeadGesture } from '../types'
import { DEFAULT_SETTINGS } from '../types'

type SettingsStore = Settings & {
  setMapping: (gesture: HeadGesture, action: ActionType) => void
  setSensitivity: (value: number) => void
  setSmoothing: (value: number) => void
  setDebounce: (value: number) => void
  toggleEnabled: () => void
  setEnabled: (value: boolean) => void
  resetToDefaults: () => void
  loadFromDisk: () => void
  saveToDisk: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  setMapping: (gesture, action) => {
    set((state) => ({
      mappings: { ...state.mappings, [gesture]: action }
    }))
    get().saveToDisk()
  },

  setSensitivity: (value) => {
    set({ sensitivity: value })
    get().saveToDisk()
  },

  setSmoothing: (value) => {
    set({ smoothing: value })
    get().saveToDisk()
  },

  setDebounce: (value) => {
    set({ debounceMs: value })
    get().saveToDisk()
  },

  toggleEnabled: () => {
    set((state) => ({ enabled: !state.enabled }))
  },

  setEnabled: (value) => {
    set({ enabled: value })
  },

  resetToDefaults: () => {
    set({
      mappings: DEFAULT_SETTINGS.mappings,
      sensitivity: DEFAULT_SETTINGS.sensitivity,
      smoothing: DEFAULT_SETTINGS.smoothing,
      debounceMs: DEFAULT_SETTINGS.debounceMs
    })
    get().saveToDisk()
  },

  loadFromDisk: () => {
    window.api?.loadSettings()
    window.api?.onSettingsLoaded((loaded) => {
      const settings = loaded as Settings | null
      if (settings) {
        set({
          mappings: settings.mappings ?? DEFAULT_SETTINGS.mappings,
          sensitivity: settings.sensitivity ?? DEFAULT_SETTINGS.sensitivity,
          smoothing: settings.smoothing ?? DEFAULT_SETTINGS.smoothing,
          debounceMs: settings.debounceMs ?? DEFAULT_SETTINGS.debounceMs
        })
      }
    })
  },

  saveToDisk: () => {
    const { mappings, sensitivity, smoothing, debounceMs } = get()
    window.api?.saveSettings({ mappings, sensitivity, smoothing, debounceMs })
  }
}))
