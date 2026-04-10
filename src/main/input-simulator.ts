import { spawn, type ChildProcess } from 'child_process'

/**
 * Simulates keyboard and mouse input via a persistent PowerShell process
 * calling Win32 user32.dll functions (keybd_event, mouse_event).
 * Zero native module dependencies — works with any Node.js/Electron version.
 */

const VK_CODES: Record<string, number> = {
  'arrow-left': 0x25,
  'arrow-up': 0x26,
  'arrow-right': 0x27,
  'arrow-down': 0x28,
  'page-up': 0x21,
  'page-down': 0x22,
  'enter': 0x0d,
  'escape': 0x1b,
  'space': 0x20,
  'volume-up': 0xaf,
  'volume-down': 0xae,
  'tab': 0x09,
  'ctrl': 0x11,
  'shift': 0x10
}

export class InputSimulator {
  private ps: ChildProcess | null = null
  private ready = false

  async init(): Promise<void> {
    return new Promise((resolve) => {
      this.ps = spawn('powershell.exe', ['-NoProfile', '-NoLogo', '-Command', '-'], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.ps.stderr?.on('data', (data: Buffer) => {
        console.error('[InputSimulator]', data.toString())
      })

      const initScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class HeadTrackInput {
  [DllImport("user32.dll")]
  public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, IntPtr dwExtraInfo);
  [DllImport("user32.dll")]
  public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo);
}
"@
Write-Output "READY"
`

      this.ps.stdout?.on('data', (data: Buffer) => {
        if (data.toString().includes('READY')) {
          this.ready = true
          resolve()
        }
      })

      this.ps.stdin?.write(initScript + '\n')

      this.ps.on('error', () => {
        this.ready = false
      })

      setTimeout(() => {
        if (!this.ready) {
          this.ready = true
          resolve()
        }
      }, 5000)
    })
  }

  private send(command: string): void {
    if (!this.ps?.stdin || !this.ready) return
    this.ps.stdin.write(command + '\n')
  }

  private scrollWheel(amount: number): void {
    this.send(`[HeadTrackInput]::mouse_event(0x0800, 0, 0, ${amount}, [IntPtr]::Zero)`)
  }

  private pressKey(vkCode: number): void {
    this.send(
      `[HeadTrackInput]::keybd_event(${vkCode}, 0, 0, [IntPtr]::Zero); ` +
      `[HeadTrackInput]::keybd_event(${vkCode}, 0, 2, [IntPtr]::Zero)`
    )
  }

  private pressCombo(keys: string[]): void {
    const downs = keys.map((k) => `[HeadTrackInput]::keybd_event(${VK_CODES[k]}, 0, 0, [IntPtr]::Zero)`).join('; ')
    const ups = keys.reverse().map((k) => `[HeadTrackInput]::keybd_event(${VK_CODES[k]}, 0, 2, [IntPtr]::Zero)`).join('; ')
    this.send(`${downs}; ${ups}`)
  }

  executeAction(action: string): void {
    switch (action) {
      case 'scroll-down':
        this.scrollWheel(-120 * 3)
        break
      case 'scroll-up':
        this.scrollWheel(120 * 3)
        break
      case 'tab-next':
        this.pressCombo(['ctrl', 'tab'])
        break
      case 'tab-prev':
        this.pressCombo(['ctrl', 'shift', 'tab'])
        break
      default: {
        const vk = VK_CODES[action]
        if (vk) this.pressKey(vk)
      }
    }
  }

  destroy(): void {
    this.ps?.stdin?.end()
    this.ps?.kill()
    this.ps = null
    this.ready = false
  }
}
