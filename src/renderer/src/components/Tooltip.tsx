import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  text: string
  children: ReactNode
}

const TOOLTIP_W = 208
const GAP = 8
const PADDING = 8

export function Tooltip({ text, children }: Props) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const reposition = useCallback(() => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!trigger || !tooltip) return

    const tr = trigger.getBoundingClientRect()
    const th = tooltip.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Vertical: prefer top, fall back to bottom
    let y: number
    let place: 'top' | 'bottom'
    if (tr.top - th - GAP >= PADDING) {
      y = tr.top - th - GAP
      place = 'top'
    } else {
      y = tr.bottom + GAP
      place = 'bottom'
    }

    // Clamp bottom edge
    if (y + th > vh - PADDING) {
      y = vh - PADDING - th
    }
    // Clamp top edge
    if (y < PADDING) {
      y = PADDING
    }

    // Horizontal: center on trigger, clamp to viewport
    let x = tr.left + tr.width / 2 - TOOLTIP_W / 2
    if (x + TOOLTIP_W > vw - PADDING) {
      x = vw - PADDING - TOOLTIP_W
    }
    if (x < PADDING) {
      x = PADDING
    }

    setCoords({ x, y })
    setPlacement(place)
  }, [])

  useEffect(() => {
    if (!visible) return
    reposition()
  }, [visible, reposition])

  // Reposition on scroll/resize while visible
  useEffect(() => {
    if (!visible) return
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [visible, reposition])

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              top: coords.y,
              left: coords.x,
              width: TOOLTIP_W,
              zIndex: 9999
            }}
            className={`px-3 py-2 text-xs text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl leading-relaxed pointer-events-none transition-opacity ${
              placement === 'top' ? 'origin-bottom' : 'origin-top'
            }`}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  )
}
