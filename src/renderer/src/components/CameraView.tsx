import type { useHeadTracking } from '../hooks/useHeadTracking'

type Props = {
  tracking: ReturnType<typeof useHeadTracking>
}

const GESTURE_LABELS: Record<string, string> = {
  'head-down': 'DOWN',
  'head-up': 'UP',
  'head-left': 'LEFT',
  'head-right': 'RIGHT'
}

export function CameraView({ tracking }: Props) {
  const { videoRef, canvasRef, gestureState, loading, error, isTracking, cameraReady } = tracking

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <div className="relative flex-1 bg-zinc-900 rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
        />

        {!cameraReady && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-30">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <p className="text-sm">Click Start to begin tracking</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-zinc-400">Loading face tracker...</span>
              <span className="text-xs text-zinc-600">Downloading model (~5MB)</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
            <div className="text-red-400 text-sm text-center px-6 max-w-sm">{error}</div>
          </div>
        )}

        {isTracking && gestureState.gesture && (
          <div className="absolute top-3 left-3 bg-emerald-500/90 text-white text-sm px-3 py-1.5 rounded-lg font-semibold tracking-wide shadow-lg">
            {GESTURE_LABELS[gestureState.gesture]}
          </div>
        )}

        {isTracking && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">LIVE</span>
          </div>
        )}
      </div>

      <div className="flex gap-6 text-xs text-zinc-500 font-mono px-1">
        <span>
          Pitch <span className="text-zinc-400">{gestureState.pose.pitch.toFixed(1)}</span>
        </span>
        <span>
          Yaw <span className="text-zinc-400">{gestureState.pose.yaw.toFixed(1)}</span>
        </span>
        <span>
          Roll <span className="text-zinc-400">{gestureState.pose.roll.toFixed(1)}</span>
        </span>
      </div>
    </div>
  )
}
