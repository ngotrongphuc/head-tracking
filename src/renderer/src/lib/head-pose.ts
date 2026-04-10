import type { HeadPose, HeadGesture } from '../types'

/**
 * Extracts Euler angles (degrees) from MediaPipe's 4x4 row-major
 * facial transformation matrix using ZYX convention.
 */
export function extractEulerAngles(matrix: Float32Array | number[]): HeadPose {
  const m = matrix
  const sy = Math.sqrt(m[0] * m[0] + m[4] * m[4])
  const singular = sy < 1e-6

  let pitch: number
  let yaw: number
  let roll: number

  if (!singular) {
    pitch = Math.atan2(m[9], m[10])
    yaw = Math.atan2(-m[8], sy)
    roll = Math.atan2(m[4], m[0])
  } else {
    pitch = Math.atan2(-m[6], m[5])
    yaw = Math.atan2(-m[8], sy)
    roll = 0
  }

  return {
    pitch: pitch * (180 / Math.PI),
    yaw: yaw * (180 / Math.PI),
    roll: roll * (180 / Math.PI)
  }
}

/** Exponential moving average smoother for head pose */
export class PoseSmoother {
  private smoothed: HeadPose = { pitch: 0, yaw: 0, roll: 0 }
  private initialized = false

  smooth(current: HeadPose, alpha: number): HeadPose {
    if (!this.initialized) {
      this.smoothed = { ...current }
      this.initialized = true
      return this.smoothed
    }

    this.smoothed = {
      pitch: alpha * current.pitch + (1 - alpha) * this.smoothed.pitch,
      yaw: alpha * current.yaw + (1 - alpha) * this.smoothed.yaw,
      roll: alpha * current.roll + (1 - alpha) * this.smoothed.roll
    }

    return { ...this.smoothed }
  }

  reset(): void {
    this.initialized = false
    this.smoothed = { pitch: 0, yaw: 0, roll: 0 }
  }
}

/** Detects which gesture the user is performing based on relative head pose */
export function detectGesture(
  relativePose: HeadPose,
  threshold: number
): HeadGesture | null {
  const { pitch, yaw } = relativePose

  // Pitch: invert — MediaPipe positive pitch = head tilted up
  if (pitch > threshold) return 'head-up'
  if (pitch < -threshold) return 'head-down'

  // Yaw: positive = turned right, negative = turned left
  if (yaw > threshold) return 'head-right'
  if (yaw < -threshold) return 'head-left'

  return null
}

/**
 * Maps sensitivity (1-10) to angle threshold in degrees.
 * Low sensitivity = large threshold (needs big movement).
 * High sensitivity = small threshold (small movements trigger).
 */
export function sensitivityToThreshold(sensitivity: number): number {
  return 27.5 - sensitivity * 2.5
}

/**
 * Maps smoothing (1-10) to EMA alpha value.
 * Low smoothing = high alpha (responsive, jittery).
 * High smoothing = low alpha (smooth, laggy).
 */
export function smoothingToAlpha(smoothing: number): number {
  return 0.85 - smoothing * 0.08
}
