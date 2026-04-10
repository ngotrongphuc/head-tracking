import type { useHeadTracking } from '../hooks/useHeadTracking'
import { useSettingsStore } from '../store/settings'
import { ActionSelect } from './ActionSelect'
import { Tooltip } from './Tooltip'
import { HEAD_GESTURES } from '../types'

type Props = {
  tracking: ReturnType<typeof useHeadTracking>
}

export function SettingsPanel({ tracking }: Props) {
  const { isTracking, startTracking, stopTracking, calibrate, loading } = tracking

  const enabled = useSettingsStore((s) => s.enabled)
  const sensitivity = useSettingsStore((s) => s.sensitivity)
  const smoothing = useSettingsStore((s) => s.smoothing)
  const debounceMs = useSettingsStore((s) => s.debounceMs)
  const mappings = useSettingsStore((s) => s.mappings)
  const setMapping = useSettingsStore((s) => s.setMapping)
  const setSensitivity = useSettingsStore((s) => s.setSensitivity)
  const setSmoothing = useSettingsStore((s) => s.setSmoothing)
  const setDebounce = useSettingsStore((s) => s.setDebounce)
  const toggleEnabled = useSettingsStore((s) => s.toggleEnabled)
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults)

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Head Tracking</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Control your PC with head movements</p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={isTracking ? stopTracking : startTracking}
          disabled={loading}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isTracking
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          } disabled:opacity-50`}
        >
          {loading ? 'Loading...' : isTracking ? 'Stop' : 'Start'}
        </button>
        <Tooltip text="Set your current head position as the neutral point. All gestures are measured relative to this position.">
          <button
            onClick={calibrate}
            disabled={!isTracking}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            Calibrate
          </button>
        </Tooltip>
      </div>

      {/* Enable/Disable toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <button
          role="switch"
          aria-checked={enabled}
          onClick={toggleEnabled}
          className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${
            enabled ? 'bg-emerald-500' : 'bg-zinc-700'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm">Actions Enabled</span>
      </label>

      {/* Gesture Mappings */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Gesture Mappings</h2>
        <div className="flex flex-col gap-2.5">
          {HEAD_GESTURES.map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <span className="text-sm text-zinc-300 w-24 shrink-0">{label}</span>
              <ActionSelect value={mappings[value]} onChange={(action) => setMapping(value, action)} />
            </div>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm mb-1.5">
            <Tooltip text="How much you need to move your head to trigger a gesture. Low = large movements needed, high = small movements trigger actions.">
              <span className="text-zinc-400 cursor-help border-b border-dashed border-zinc-600">Sensitivity</span>
            </Tooltip>
            <span className="text-zinc-500 font-mono text-xs ml-auto">{sensitivity}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-sm mb-1.5">
            <Tooltip text="Reduces jitter from camera noise. Low = instant response but jittery, high = stable but slower to react.">
              <span className="text-zinc-400 cursor-help border-b border-dashed border-zinc-600">Smoothing</span>
            </Tooltip>
            <span className="text-zinc-500 font-mono text-xs ml-auto">{smoothing}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={smoothing}
            onChange={(e) => setSmoothing(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
            <span>Responsive</span>
            <span>Smooth</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-sm mb-1.5">
            <Tooltip text="Minimum time between repeated actions for the same gesture. Prevents rapid-fire when holding your head in position.">
              <span className="text-zinc-400 cursor-help border-b border-dashed border-zinc-600">Debounce</span>
            </Tooltip>
            <span className="text-zinc-500 font-mono text-xs ml-auto">{debounceMs}ms</span>
          </div>
          <input
            type="range"
            min={100}
            max={1000}
            step={50}
            value={debounceMs}
            onChange={(e) => setDebounce(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={resetToDefaults}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-left"
      >
        Reset to defaults
      </button>
    </div>
  )
}
