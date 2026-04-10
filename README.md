# Head Tracker

A desktop app that uses your webcam to track head movements and maps them to keyboard/mouse actions. Read a book in the browser, scroll through slides, or navigate pages — all hands-free.

## Features

- **Real-time head tracking** — MediaPipe Face Mesh detects your face and estimates head orientation (pitch, yaw, roll) at ~30fps
- **Configurable gesture mappings** — map head up/down/left/right to arrow keys, scroll, page navigation, volume, tab switching, and more
- **Background operation** — keeps tracking and sending inputs even when the app is not focused
- **Calibration** — set your natural head position as the neutral point so only intentional movements trigger actions
- **Tunable parameters** — adjust sensitivity, smoothing, and debounce to match your setup
- **Persistent settings** — your mappings and preferences are saved automatically

## Quick Start

```bash
# Install dependencies
yarn install

# Run in development mode
yarn dev
```

## Usage

1. Click **Start** to activate the camera and load the face tracking model (~5MB download on first launch)
2. Look straight at the camera and click **Calibrate** to set your neutral head position
3. Configure gesture mappings in the sidebar (defaults: arrow keys)
4. Toggle **Actions Enabled** to start sending inputs to the OS
5. Switch to your target app (browser, reader, etc.) — tracking continues in the background

## Default Mappings

| Gesture    | Action     |
| ---------- | ---------- |
| Head Up    | Arrow Up   |
| Head Down  | Arrow Down |
| Head Left  | Arrow Left |
| Head Right | Arrow Right|

## Pitch, Yaw, Roll

The app tracks three axes of head rotation, displayed in real-time below the camera feed:

```
         Pitch (nod)              Yaw (turn)             Roll (tilt)
            ↑                       ↑                       
        ┌───┐                   ┌───┐                   ┌───┐
        │   │ ← up              │   │ ← left        ──→ │   │ ←──
        │ o │                   │ o │                    │ o │
        │   │ ← down            │   │ ← right           │   │
        └───┘                   └───┘                   └───┘
   Nodding up/down         Turning left/right      Tilting ear to shoulder
```

- **Pitch** — nodding up and down (chin toward chest or looking at ceiling)
- **Yaw** — turning left and right (looking over your shoulder)
- **Roll** — tilting sideways (ear toward shoulder)

Currently pitch controls up/down gestures and yaw controls left/right gestures.

## Settings

| Setting     | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| Sensitivity | How much head movement is needed to trigger a gesture (1 = large, 10 = small) |
| Smoothing   | Filters out camera jitter (1 = responsive but jittery, 10 = smooth but laggy) |
| Debounce    | Minimum time between repeated actions for the same gesture (100ms–1000ms)     |

Click **Reset to defaults** at the bottom of the sidebar to restore all settings to their original values.

## Tech Stack

- **Electron** — desktop shell with camera access
- **React + TypeScript** — UI
- **Vite** (via electron-vite) — build tooling
- **Tailwind CSS** — styling
- **MediaPipe FaceLandmarker** — face mesh detection + head pose estimation
- **Zustand** — state management
- **PowerShell + user32.dll** — system input simulation (Windows)

## How It Works

1. Camera feed is processed by MediaPipe's FaceLandmarker in the renderer process
2. The model outputs a 4x4 facial transformation matrix encoding head orientation
3. Euler angles (pitch/yaw/roll) are extracted and smoothed via exponential moving average
4. Angles are compared against the calibrated neutral position
5. When an angle exceeds the sensitivity threshold, the mapped action fires
6. Actions are sent to the main process via IPC, which calls Win32 `keybd_event`/`mouse_event` through a persistent PowerShell process

## Building

```bash
# Build for production
yarn build

# Package as Windows installer (.exe)
yarn package
```

The installer will be in the `dist/` folder.

## Requirements

- Windows 10/11
- Webcam
- Node.js 20+

## License

MIT
