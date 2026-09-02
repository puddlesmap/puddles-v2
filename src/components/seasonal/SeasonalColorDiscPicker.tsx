import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'

const WHEEL_SIZE = 232
const DISC_RADIUS = 74
const RING_INNER = 84
const RING_OUTER = 116
/** CSS conic-gradient 0deg is top; atan2 0 is right. */
const HUE_OFFSET_DEG = -90
const HISTORY_LIMIT = 10

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const [red, green, blue] = hexToRgb(hex).map((channel) => channel / 255)
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let hue = 0
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta + (green < blue ? 6 : 0)) * 60
    else if (max === green) hue = ((blue - red) / delta + 2) * 60
    else hue = ((red - green) / delta + 4) * 60
  }

  const value = max
  const saturation = max === 0 ? 0 : delta / max

  return {
    h: ((hue % 360) + 360) % 360,
    s: saturation * 100,
    v: value * 100,
  }
}

function hsvToHex(hue: number, saturation: number, value: number): string {
  const h = ((hue % 360) + 360) % 360
  const s = clamp(saturation, 0, 100) / 100
  const v = clamp(value, 0, 100) / 100

  const chroma = v * s
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const match = v - chroma

  let red = 0
  let green = 0
  let blue = 0

  if (h < 60) {
    red = chroma
    green = secondary
  } else if (h < 120) {
    red = secondary
    green = chroma
  } else if (h < 180) {
    green = chroma
    blue = secondary
  } else if (h < 240) {
    green = secondary
    blue = chroma
  } else if (h < 300) {
    red = secondary
    blue = chroma
  } else {
    red = chroma
    blue = secondary
  }

  return rgbToHex((red + match) * 255, (green + match) * 255, (blue + match) * 255)
}

function formatRgb(hex: string): string {
  const [red, green, blue] = hexToRgb(hex)
  return `rgb(${red}, ${green}, ${blue})`
}

export function parseHexColor(raw: string): string | null {
  const trimmed = raw.trim()
  const body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed

  if (!/^[0-9a-fA-F]{3}$/.test(body) && !/^[0-9a-fA-F]{6}$/.test(body)) {
    return null
  }

  const expanded =
    body.length === 3 ? body.split('').map((char) => char + char).join('') : body

  return `#${expanded.toLowerCase()}`
}

interface SeasonalColorDiscPickerProps {
  value: string
  onChange: (hex: string) => void
  label?: string
}

export function SeasonalColorDiscPicker({
  value,
  onChange,
  label = 'Color',
}: SeasonalColorDiscPickerProps) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const dragTargetRef = useRef<'hue' | 'disc' | null>(null)
  const hsvRef = useRef(hexToHsv(value))
  const isDraggingRef = useRef(false)
  const [hsv, setHsv] = useState(() => hexToHsv(value))
  const [history, setHistory] = useState<string[]>([value])
  const [hexDraft, setHexDraft] = useState(value)
  const hexFocusedRef = useRef(false)

  useEffect(() => {
    hsvRef.current = hsv
  }, [hsv])

  useEffect(() => {
    if (isDraggingRef.current) return
    const next = hexToHsv(value)
    hsvRef.current = next
    setHsv(next)
    if (!hexFocusedRef.current) setHexDraft(value)
  }, [value])

  const emitColor = useCallback(
    (nextHsv: { h: number; s: number; v: number }) => {
      const hex = hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v)
      hsvRef.current = nextHsv
      setHsv(nextHsv)
      onChange(hex)
      if (!hexFocusedRef.current) setHexDraft(hex)
      setHistory((prev) => [hex, ...prev.filter((entry) => entry !== hex)].slice(0, HISTORY_LIMIT))
    },
    [onChange],
  )

  const commitHexDraft = useCallback(() => {
    const parsed = parseHexColor(hexDraft)
    if (!parsed) {
      setHexDraft(value)
      return
    }

    const nextHsv = hexToHsv(parsed)
    hsvRef.current = nextHsv
    setHsv(nextHsv)
    setHexDraft(parsed)
    onChange(parsed)
    setHistory((prev) => [parsed, ...prev.filter((entry) => entry !== parsed)].slice(0, HISTORY_LIMIT))
  }, [hexDraft, onChange, value])

  const center = WHEEL_SIZE / 2
  const ringMid = (RING_INNER + RING_OUTER) / 2

  const pointerToWheelCoords = useCallback((clientX: number, clientY: number) => {
    const wheel = wheelRef.current
    if (!wheel) return null

    const rect = wheel.getBoundingClientRect()
    const scale = rect.width / WHEEL_SIZE
    const x = (clientX - rect.left - rect.width / 2) / scale
    const y = (clientY - rect.top - rect.height / 2) / scale
    return { x, y, distance: Math.hypot(x, y) }
  }, [])

  const hueHandle = useMemo(() => {
    const radians = ((hsv.h + HUE_OFFSET_DEG) * Math.PI) / 180
    return {
      left: center + Math.cos(radians) * ringMid,
      top: center + Math.sin(radians) * ringMid,
    }
  }, [center, hsv.h, ringMid])

  const discHandle = useMemo(() => {
    const x = ((hsv.s / 100) * 2 - 1) * DISC_RADIUS
    const y = (1 - hsv.v / 100) * 2 * DISC_RADIUS - DISC_RADIUS
    return {
      left: center + x,
      top: center + y,
    }
  }, [center, hsv.s, hsv.v])

  const pureHue = useMemo(() => hsvToHex(hsv.h, 100, 100), [hsv.h])

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number, target: 'hue' | 'disc') => {
      const coords = pointerToWheelCoords(clientX, clientY)
      if (!coords) return

      const { x, y, distance } = coords
      const current = hsvRef.current

      if (target === 'hue') {
        const hue =
          (Math.atan2(y, x) * 180) / Math.PI - HUE_OFFSET_DEG
        emitColor({ ...current, h: ((hue % 360) + 360) % 360 })
        return
      }

      if (distance > DISC_RADIUS) return

      const saturation = clamp(((x / DISC_RADIUS + 1) / 2) * 100, 0, 100)
      const brightness = clamp((1 - (y / DISC_RADIUS + 1) / 2) * 100, 0, 100)
      emitColor({ ...current, s: saturation, v: brightness })
    },
    [emitColor, pointerToWheelCoords],
  )

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const wheel = wheelRef.current
      if (!wheel) return

      const coords = pointerToWheelCoords(event.clientX, event.clientY)
      if (!coords) return

      let target: 'hue' | 'disc' | null = null
      if (coords.distance >= RING_INNER && coords.distance <= RING_OUTER) target = 'hue'
      else if (coords.distance <= DISC_RADIUS) target = 'disc'

      if (!target) return

      isDraggingRef.current = true
      dragTargetRef.current = target
      wheel.setPointerCapture(event.pointerId)
      updateFromPointer(event.clientX, event.clientY, target)
    },
    [pointerToWheelCoords, updateFromPointer],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const target = dragTargetRef.current
      if (!target) return
      updateFromPointer(event.clientX, event.clientY, target)
    },
    [updateFromPointer],
  )

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false
    dragTargetRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  return (
    <div className="seasonal-color-disc-picker">
      <div className="seasonal-color-disc-picker__header">
        <span className="seasonal-color-disc-picker__label">{label}</span>
        <span
          className="seasonal-color-disc-picker__preview"
          style={{ backgroundColor: value }}
          aria-hidden
        />
      </div>

      <div
        ref={wheelRef}
        className="seasonal-color-disc-picker__wheel"
        style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="application"
        aria-label={`${label} disc picker`}
      >
        <div className="seasonal-color-disc-picker__ring" aria-hidden />
        <div
          className="seasonal-color-disc-picker__disc"
          style={{
            width: DISC_RADIUS * 2,
            height: DISC_RADIUS * 2,
            backgroundColor: `hsl(${hsv.h} 100% 50%)`,
          }}
          aria-hidden
        />
        <span
          className="seasonal-color-disc-picker__handle seasonal-color-disc-picker__handle--hue"
          style={{
            left: `${(hueHandle.left / WHEEL_SIZE) * 100}%`,
            top: `${(hueHandle.top / WHEEL_SIZE) * 100}%`,
            backgroundColor: pureHue,
          }}
          aria-hidden
        />
        <span
          className="seasonal-color-disc-picker__handle seasonal-color-disc-picker__handle--disc"
          style={{
            left: `${(discHandle.left / WHEEL_SIZE) * 100}%`,
            top: `${(discHandle.top / WHEEL_SIZE) * 100}%`,
            backgroundColor: value,
          }}
          aria-hidden
        />
      </div>

      <div className="seasonal-color-disc-picker__readout">
        <label className="seasonal-color-disc-picker__hex-field">
          <span className="seasonal-color-disc-picker__hex-label">Hex</span>
          <input
            type="text"
            className="seasonal-color-disc-picker__hex-input"
            value={hexDraft}
            onChange={(event) => setHexDraft(event.target.value)}
            onFocus={() => {
              hexFocusedRef.current = true
            }}
            onBlur={() => {
              hexFocusedRef.current = false
              commitHexDraft()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
            spellCheck={false}
            autoComplete="off"
            inputMode="text"
            aria-label={`${label} hex color`}
          />
        </label>
        <code>{formatRgb(value)}</code>
      </div>

      {history.length > 0 ? (
        <div className="seasonal-color-disc-picker__history">
          <div className="seasonal-color-disc-picker__history-head">
            <span>History</span>
            <button type="button" onClick={() => setHistory([value])}>
              Clear
            </button>
          </div>
          <div className="seasonal-color-disc-picker__history-swatches" role="list">
            {history.map((hex) => (
              <button
                key={hex}
                type="button"
                className={[
                  'seasonal-color-disc-picker__swatch',
                  hex === value ? 'seasonal-color-disc-picker__swatch--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ backgroundColor: hex }}
                aria-label={`Use ${hex}`}
                onClick={() => emitColor(hexToHsv(hex))}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
