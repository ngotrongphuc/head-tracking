import { useEffect } from 'react'
import { CameraView } from './components/CameraView'
import { SettingsPanel } from './components/SettingsPanel'
import { useHeadTracking } from './hooks/useHeadTracking'
import { useSettingsStore } from './store/settings'

export function App() {
  const loadFromDisk = useSettingsStore((s) => s.loadFromDisk)

  useEffect(() => {
    loadFromDisk()
  }, [loadFromDisk])

  const tracking = useHeadTracking()

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <div className="flex-1 flex flex-col p-4 min-w-0">
        <CameraView tracking={tracking} />
      </div>
      <div className="w-80 border-l border-zinc-800 overflow-y-auto shrink-0">
        <SettingsPanel tracking={tracking} />
      </div>
    </div>
  )
}
