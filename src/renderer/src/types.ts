export type HeadGesture =
  | 'head-down'
  | 'head-up'
  | 'head-left'
  | 'head-right'

export type ActionType =
  | 'scroll-down'
  | 'scroll-up'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'page-down'
  | 'page-up'
  | 'volume-up'
  | 'volume-down'
  | 'tab-next'
  | 'tab-prev'
  | 'enter'
  | 'escape'
  | 'space'
  | 'none'

export type GestureMapping = Record<HeadGesture, ActionType>

export type HeadPose = {
  pitch: number
  yaw: number
  roll: number
}

export type GestureState = {
  gesture: HeadGesture | null
  confidence: number
  pose: HeadPose
}

export type Settings = {
  mappings: GestureMapping
  sensitivity: number
  smoothing: number
  debounceMs: number
  enabled: boolean
}

export const HEAD_GESTURES: { value: HeadGesture; label: string }[] = [
  { value: 'head-up', label: 'Head Up' },
  { value: 'head-down', label: 'Head Down' },
  { value: 'head-left', label: 'Head Left' },
  { value: 'head-right', label: 'Head Right' }
]

export const ACTIONS: { value: ActionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'scroll-down', label: 'Scroll Down' },
  { value: 'scroll-up', label: 'Scroll Up' },
  { value: 'arrow-down', label: 'Arrow Down' },
  { value: 'arrow-up', label: 'Arrow Up' },
  { value: 'arrow-left', label: 'Arrow Left' },
  { value: 'arrow-right', label: 'Arrow Right' },
  { value: 'page-down', label: 'Page Down' },
  { value: 'page-up', label: 'Page Up' },
  { value: 'volume-up', label: 'Volume Up' },
  { value: 'volume-down', label: 'Volume Down' },
  { value: 'tab-next', label: 'Next Tab' },
  { value: 'tab-prev', label: 'Prev Tab' },
  { value: 'enter', label: 'Enter' },
  { value: 'escape', label: 'Escape' },
  { value: 'space', label: 'Space' }
]

export const DEFAULT_MAPPINGS: GestureMapping = {
  'head-down': 'arrow-down',
  'head-up': 'arrow-up',
  'head-left': 'arrow-left',
  'head-right': 'arrow-right'
}

export const DEFAULT_SETTINGS: Settings = {
  mappings: DEFAULT_MAPPINGS,
  sensitivity: 5,
  smoothing: 5,
  debounceMs: 300,
  enabled: false
}

declare global {
  interface Window {
    api?: {
      executeAction: (action: string) => void
      onSettingsLoaded: (callback: (settings: Settings | null) => void) => void
      saveSettings: (settings: Partial<Settings>) => void
      loadSettings: () => void
    }
  }
}
