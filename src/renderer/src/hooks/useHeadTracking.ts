import { useRef, useCallback, useEffect, useState } from 'react'
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult
} from '@mediapipe/tasks-vision'
import type { HeadPose, HeadGesture, GestureState } from '../types'
import {
  extractEulerAngles,
  PoseSmoother,
  detectGesture,
  sensitivityToThreshold,
  smoothingToAlpha
} from '../lib/head-pose'
import { useSettingsStore } from '../store/settings'

export function useHeadTracking() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
  const smootherRef = useRef(new PoseSmoother())
  const neutralPoseRef = useRef<HeadPose | null>(null)
  const lastGestureRef = useRef<HeadGesture | null>(null)
  const lastTriggerTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Use refs for values read inside the rAF loop to keep callback identity stable
  const enabledRef = useRef(false)
  const sensitivityRef = useRef(5)
  const smoothingRef = useRef(5)
  const debounceMsRef = useRef(300)
  const mappingsRef = useRef(useSettingsStore.getState().mappings)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gestureState, setGestureState] = useState<GestureState>({
    gesture: null,
    confidence: 0,
    pose: { pitch: 0, yaw: 0, roll: 0 }
  })
  const [isTracking, setIsTracking] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  // Sync store values into refs
  useEffect(() => {
    const unsub = useSettingsStore.subscribe((state) => {
      enabledRef.current = state.enabled
      sensitivityRef.current = state.sensitivity
      smoothingRef.current = state.smoothing
      debounceMsRef.current = state.debounceMs
      mappingsRef.current = state.mappings
    })
    // Init from current state
    const s = useSettingsStore.getState()
    enabledRef.current = s.enabled
    sensitivityRef.current = s.sensitivity
    smoothingRef.current = s.smoothing
    debounceMsRef.current = s.debounceMs
    mappingsRef.current = s.mappings
    return unsub
  }, [])

  const initFaceLandmarker = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true
      })

      faceLandmarkerRef.current = landmarker
      setLoading(false)
    } catch (err) {
      setError(`Failed to load face tracker: ${err}`)
      setLoading(false)
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch (err) {
      setError(`Camera access denied: ${err}`)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraReady(false)
  }, [])

  const calibrate = useCallback(() => {
    neutralPoseRef.current = { ...gestureState.pose }
  }, [gestureState.pose])

  const drawLandmarks = useCallback((result: FaceLandmarkerResult) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (result.faceLandmarks?.[0]) {
      const landmarks = result.faceLandmarks[0]

      ctx.fillStyle = '#00ff88'
      for (const point of landmarks) {
        ctx.beginPath()
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Highlight key landmarks (nose tip, eyes, mouth corners, forehead, chin)
      const keyIndices = [1, 33, 263, 61, 291, 10, 152]
      ctx.fillStyle = '#ff4444'
      for (const idx of keyIndices) {
        if (!landmarks[idx]) continue
        ctx.beginPath()
        ctx.arc(
          landmarks[idx].x * canvas.width,
          landmarks[idx].y * canvas.height,
          4,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
    }
  }, [])

  // Use setTimeout instead of rAF — rAF gets throttled to ~1fps when window
  // loses focus, but we need tracking to keep working in the background.
  const detect = useCallback(() => {
    const video = videoRef.current
    const landmarker = faceLandmarkerRef.current

    if (!video || !landmarker || video.readyState < 2) {
      timerRef.current = setTimeout(detect, 33)
      return
    }

    const result = landmarker.detectForVideo(video, performance.now())

    if (result.facialTransformationMatrixes?.[0]) {
      const matrix = result.facialTransformationMatrixes[0].data
      const rawPose = extractEulerAngles(matrix)
      const alpha = smoothingToAlpha(smoothingRef.current)
      const smoothedPose = smootherRef.current.smooth(rawPose, alpha)

      const neutral = neutralPoseRef.current ?? { pitch: 0, yaw: 0, roll: 0 }
      const relativePose: HeadPose = {
        pitch: smoothedPose.pitch - neutral.pitch,
        yaw: smoothedPose.yaw - neutral.yaw,
        roll: smoothedPose.roll - neutral.roll
      }

      const threshold = sensitivityToThreshold(sensitivityRef.current)
      const gesture = detectGesture(relativePose, threshold)

      setGestureState({ gesture, confidence: gesture ? 1 : 0, pose: smoothedPose })

      if (enabledRef.current && gesture) {
        const now = Date.now()
        const action = mappingsRef.current[gesture]

        if (action && action !== 'none') {
          const isNewGesture = gesture !== lastGestureRef.current
          const debounceElapsed = now - lastTriggerTimeRef.current > debounceMsRef.current

          if (isNewGesture || debounceElapsed) {
            window.api?.executeAction(action)
            lastTriggerTimeRef.current = now
          }
        }
      }

      lastGestureRef.current = gesture
      drawLandmarks(result)
    }

    timerRef.current = setTimeout(detect, 33) // ~30fps
  }, [drawLandmarks])

  const startTracking = useCallback(async () => {
    if (!faceLandmarkerRef.current) await initFaceLandmarker()
    if (!streamRef.current) await startCamera()
    setIsTracking(true)
  }, [initFaceLandmarker, startCamera])

  const stopTracking = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setIsTracking(false)
    smootherRef.current.reset()
    lastGestureRef.current = null
    setGestureState({ gesture: null, confidence: 0, pose: { pitch: 0, yaw: 0, roll: 0 } })
  }, [])

  // Start/stop detection loop
  useEffect(() => {
    if (isTracking && cameraReady && faceLandmarkerRef.current) {
      timerRef.current = setTimeout(detect, 33)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isTracking, cameraReady, detect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      stopCamera()
      faceLandmarkerRef.current?.close()
    }
  }, [stopCamera])

  return {
    videoRef,
    canvasRef,
    loading,
    error,
    gestureState,
    isTracking,
    cameraReady,
    startTracking,
    stopTracking,
    calibrate
  }
}
