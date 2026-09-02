import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SeasonalDiscoveryModule } from '../components/seasonal/SeasonalDiscoveryModule'
import { SeasonalColorDiscPicker, parseHexColor } from '../components/seasonal/SeasonalColorDiscPicker'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import {
  getSeasonalCollectionForExperiment,
  resolveFeaturedSeasonalEvents,
  type SeasonalCollection,
} from '../data/seasonalDiscovery'
import { useEventNavigation } from '../hooks/useEventNavigation'
import { HomeExperimentPage } from './HomeExperimentPage'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import './experiment-seasonal-bg-dial.css'
import './seasonal-color-disc-picker.css'

const DEFAULT_SINGLE = '#fff7ed'
const DEFAULT_STOPS = ['#fef2e1', '#fde6cd', '#fbcfa7'] as const
const DEFAULT_GLOW = 0.24
const DEFAULT_ANGLE = 125

type BackgroundMode = 'gradient' | 'solid'

function isSolidBackground(value: string): boolean {
  return !value.includes('gradient')
}

function buildBackground(
  mode: BackgroundMode,
  angle: number,
  stops: string[],
  solidColor: string,
): string {
  if (mode === 'solid') return solidColor
  return buildGradient(angle, stops)
}

function buildGlowRgba(hex: string, alpha: number): string {
  const [red, green, blue] = hexToRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(2)})`
}

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

function hexToHsl(hex: string): [number, number, number] {
  const [red, green, blue] = hexToRgb(hex).map((channel) => channel / 255)
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) return [0, 0, lightness * 100]

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue = 0

  if (max === red) hue = ((green - blue) / delta + (green < blue ? 6 : 0)) / 6
  else if (max === green) hue = ((blue - red) / delta + 2) / 6
  else hue = ((red - green) / delta + 4) / 6

  return [hue * 360, saturation * 100, lightness * 100]
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const h = ((hue % 360) + 360) % 360
  const s = clamp(saturation, 0, 100) / 100
  const l = clamp(lightness, 0, 100) / 100

  if (s === 0) {
    const channel = l * 255
    return rgbToHex(channel, channel, channel)
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    let value = t
    if (value < 0) value += 1
    if (value > 1) value -= 1
    if (value < 1 / 6) return p + (q - p) * 6 * value
    if (value < 1 / 2) return q
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hNorm = h / 360

  return rgbToHex(
    hueToRgb(p, q, hNorm + 1 / 3) * 255,
    hueToRgb(p, q, hNorm) * 255,
    hueToRgb(p, q, hNorm - 1 / 3) * 255,
  )
}

function adjustStop(
  hex: string,
  warmth: number,
  saturationBoost: number,
  lightnessBoost: number,
  solid = false,
): string {
  const [hue, saturation, lightness] = hexToHsl(hex)
  const warmHue = hue + warmth * 0.35
  const nextSaturation = clamp(
    saturation + saturationBoost * 0.55,
    solid ? 12 : 8,
    solid ? 100 : 92,
  )
  const nextLightness = clamp(
    lightness + lightnessBoost * 0.22,
    solid ? 18 : 82,
    solid ? 96 : 98,
  )
  return hslToHex(warmHue, nextSaturation, nextLightness)
}

function formatRgb(hex: string): string {
  const [red, green, blue] = hexToRgb(hex)
  return `rgb(${red}, ${green}, ${blue})`
}

function buildGradient(angle: number, stops: string[]): string {
  return `linear-gradient(${angle}deg, ${stops[0]} 0%, ${stops[1]} 44%, ${stops[2]} 100%)`
}

function buildSnippet(
  mode: BackgroundMode,
  stops: string[],
  solidColor: string,
  glow: number,
  angle: number,
): string {
  if (mode === 'solid') {
    return `// solid: ${solidColor} · ${formatRgb(solidColor)}
background: '${solidColor}',
glow: '${buildGlowRgba(solidColor, glow)}',`
  }

  const stopLines = stops
    .map((stop, index) => `// stop ${index + 1}: ${stop} · ${formatRgb(stop)}`)
    .join('\n')

  return `${stopLines}
background: '${buildGradient(angle, stops)}',
glow: '${buildGlowRgba(stops[1], glow)}',`
}

interface DialFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorDialField({ label, value, onChange }: DialFieldProps) {
  const [hexDraft, setHexDraft] = useState(value)
  const hexFocusedRef = useRef(false)

  useEffect(() => {
    if (!hexFocusedRef.current) setHexDraft(value)
  }, [value])

  const commitHexDraft = () => {
    const parsed = parseHexColor(hexDraft)
    if (parsed) {
      onChange(parsed)
      setHexDraft(parsed)
      return
    }

    setHexDraft(value)
  }

  return (
    <label className="seasonal-bg-dial__field">
      <span className="seasonal-bg-dial__field-label">{label}</span>
      <span className="seasonal-bg-dial__color-input">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        />
        <span className="seasonal-bg-dial__color-values">
          <input
            type="text"
            className="seasonal-bg-dial__hex-input"
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
            aria-label={`${label} hex color`}
          />
          <code className="seasonal-bg-dial__color-rgb">{formatRgb(value)}</code>
        </span>
      </span>
    </label>
  )
}

interface RangeFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  display?: string
  onChange: (value: number) => void
}

function RangeDialField({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: RangeFieldProps) {
  return (
    <label className="seasonal-bg-dial__field seasonal-bg-dial__field--range">
      <span className="seasonal-bg-dial__field-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="seasonal-bg-dial__field-value">{display ?? value}</span>
    </label>
  )
}

export function ExperimentSeasonalBackgroundDialPage() {
  const openEvent = useEventNavigation()
  const baseCollection = getSeasonalCollectionForExperiment()
  const featuredEvents = useMemo(
    () => resolveFeaturedSeasonalEvents(baseCollection),
    [baseCollection],
  )

  const initialBackground = baseCollection.accent.background
  const initialSolid = isSolidBackground(initialBackground)

  const [mode, setMode] = useState<BackgroundMode>(initialSolid ? 'solid' : 'gradient')
  const [singleColor, setSingleColor] = useState(
    initialSolid ? initialBackground : DEFAULT_SINGLE,
  )
  const [baseStops, setBaseStops] = useState<string[]>([...DEFAULT_STOPS])
  const [glow, setGlow] = useState(DEFAULT_GLOW)
  const [angle, setAngle] = useState(DEFAULT_ANGLE)
  const [warmth, setWarmth] = useState(0)
  const [saturationBoost, setSaturationBoost] = useState(0)
  const [lightnessBoost, setLightnessBoost] = useState(0)
  const [copied, setCopied] = useState(false)
  const [activeStop, setActiveStop] = useState(0)

  const renderedSolid = useMemo(
    () => adjustStop(singleColor, warmth, saturationBoost, lightnessBoost, true),
    [singleColor, warmth, saturationBoost, lightnessBoost],
  )

  const renderedStops = useMemo(
    () =>
      baseStops.map((stop) => adjustStop(stop, warmth, saturationBoost, lightnessBoost)),
    [baseStops, warmth, saturationBoost, lightnessBoost],
  )

  const background = useMemo(
    () =>
      buildBackground(
        mode,
        angle,
        renderedStops,
        renderedSolid,
      ),
    [angle, mode, renderedSolid, renderedStops],
  )

  const glowColor = mode === 'solid' ? renderedSolid : renderedStops[1]

  const previewCollection = useMemo<SeasonalCollection>(
    () => ({
      ...baseCollection,
      accent: {
        ...baseCollection.accent,
        background,
        glow: buildGlowRgba(glowColor, glow),
      },
    }),
    [background, baseCollection, glow, glowColor],
  )

  const renderedPalette = useMemo(() => {
    if (mode === 'solid') {
      return [{ label: 'Background (rendered)', hex: renderedSolid }]
    }

    return [
      { label: 'Stop 1 (rendered)', hex: renderedStops[0] },
      { label: 'Stop 2 (rendered)', hex: renderedStops[1] },
      { label: 'Stop 3 (rendered)', hex: renderedStops[2] },
    ]
  }, [mode, renderedSolid, renderedStops])

  const snippet = useMemo(
    () => buildSnippet(mode, renderedStops, renderedSolid, glow, angle),
    [angle, glow, mode, renderedSolid, renderedStops],
  )

  const reset = useCallback(() => {
    setMode('solid')
    setSingleColor(DEFAULT_SINGLE)
    setBaseStops([...DEFAULT_STOPS])
    setGlow(DEFAULT_GLOW)
    setAngle(DEFAULT_ANGLE)
    setWarmth(0)
    setSaturationBoost(0)
    setLightnessBoost(0)
  }, [])

  const copySnippet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }, [snippet])

  const applyRenderedToBase = useCallback(() => {
    if (mode === 'solid') {
      setSingleColor(renderedSolid)
    } else {
      setBaseStops(renderedStops)
    }
    setWarmth(0)
    setSaturationBoost(0)
    setLightnessBoost(0)
  }, [mode, renderedSolid, renderedStops])

  const switchMode = useCallback(
    (nextMode: BackgroundMode) => {
      if (nextMode === mode) return

      if (nextMode === 'solid') {
        setSingleColor(renderedStops[1] ?? renderedSolid)
      } else {
        setBaseStops([renderedSolid, renderedSolid, renderedSolid])
      }

      setMode(nextMode)
    },
    [mode, renderedSolid, renderedStops],
  )

  const previewTopBand = useMemo(
    () => (
      <SeasonalDiscoveryModule
        collection={previewCollection}
        events={featuredEvents}
        onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
        bandLayout="home"
      />
    ),
    [featuredEvents, openEvent, previewCollection],
  )

  return (
    <div className="seasonal-bg-dial-page">
      <div className="seasonal-bg-dial-page__toolbar layout-container">
        <div>
          <p className="seasonal-bg-dial-page__eyebrow">Seasonal discovery · live color dial</p>
          <h1 className="seasonal-bg-dial-page__title">Hello Fall background</h1>
          <p className="seasonal-bg-dial-page__lede">
            Adjust the home band wash live. Copy values into{' '}
            <code>src/data/seasonalDiscovery.ts</code> when you land on a favorite.
          </p>
        </div>
        <div className="seasonal-bg-dial-page__links">
          <Link to="/experiment/seasonal-discovery" className="seasonal-bg-dial-page__back">
            ← Seasonal experiment
          </Link>
          <Link to="/" className="seasonal-bg-dial-page__back">
            Production home
          </Link>
        </div>
      </div>

      <div className="seasonal-bg-dial-page__layout layout-container">
        <aside className="seasonal-bg-dial" aria-label="Background color controls">
          <div className="seasonal-bg-dial__section">
            <h2 className="seasonal-bg-dial__heading">Background type</h2>
            <div className="seasonal-bg-dial__mode-toggle" role="group" aria-label="Background type">
              <button
                type="button"
                className={[
                  'seasonal-bg-dial__mode-btn',
                  mode === 'solid' ? 'seasonal-bg-dial__mode-btn--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => switchMode('solid')}
              >
                Single color
              </button>
              <button
                type="button"
                className={[
                  'seasonal-bg-dial__mode-btn',
                  mode === 'gradient' ? 'seasonal-bg-dial__mode-btn--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => switchMode('gradient')}
              >
                Gradient
              </button>
            </div>
          </div>

          <div className="seasonal-bg-dial__section">
            <h2 className="seasonal-bg-dial__heading">Global dials</h2>
            <RangeDialField
              label="Warmth (yellow → orange)"
              value={warmth}
              min={-40}
              max={40}
              onChange={setWarmth}
            />
            <RangeDialField
              label="Saturation"
              value={saturationBoost}
              min={-30}
              max={40}
              onChange={setSaturationBoost}
            />
            <RangeDialField
              label="Lightness"
              value={lightnessBoost}
              min={-20}
              max={12}
              onChange={setLightnessBoost}
            />
            {mode === 'gradient' ? (
              <RangeDialField
                label="Gradient angle"
                value={angle}
                min={0}
                max={360}
                display={`${angle}°`}
                onChange={setAngle}
              />
            ) : null}
            <RangeDialField
              label="Glow strength"
              value={Math.round(glow * 100)}
              min={0}
              max={35}
              display={glow.toFixed(2)}
              onChange={(value) => setGlow(value / 100)}
            />
            <button type="button" className="seasonal-bg-dial__secondary" onClick={applyRenderedToBase}>
              {mode === 'solid' ? 'Lock dial tweaks into color' : 'Lock dial tweaks into stops'}
            </button>
          </div>

          <div className="seasonal-bg-dial__section">
            <h2 className="seasonal-bg-dial__heading">
              {mode === 'solid' ? 'Disc picker' : 'Disc picker · gradient stop'}
            </h2>
            {mode === 'gradient' ? (
              <div className="seasonal-bg-dial__stop-toggle" role="group" aria-label="Active gradient stop">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    type="button"
                    className={[
                      'seasonal-bg-dial__mode-btn',
                      activeStop === index ? 'seasonal-bg-dial__mode-btn--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setActiveStop(index)}
                  >
                    Stop {index + 1}
                  </button>
                ))}
              </div>
            ) : null}
            <SeasonalColorDiscPicker
              label={mode === 'solid' ? 'Background' : `Stop ${activeStop + 1}`}
              value={mode === 'solid' ? singleColor : baseStops[activeStop]}
              onChange={(hex) => {
                if (mode === 'solid') {
                  setSingleColor(hex)
                  return
                }

                setBaseStops((stops) => {
                  const next = [...stops]
                  next[activeStop] = hex
                  return next
                })
              }}
            />
          </div>

          {mode === 'gradient' ? (
            <div className="seasonal-bg-dial__section">
              <h2 className="seasonal-bg-dial__heading">Gradient stops</h2>
              <ColorDialField
                label="Stop 1 (start)"
                value={baseStops[0]}
                onChange={(value) => setBaseStops([value, baseStops[1], baseStops[2]])}
              />
              <ColorDialField
                label="Stop 2 (mid)"
                value={baseStops[1]}
                onChange={(value) => setBaseStops([baseStops[0], value, baseStops[2]])}
              />
              <ColorDialField
                label="Stop 3 (end)"
                value={baseStops[2]}
                onChange={(value) => setBaseStops([baseStops[0], baseStops[1], value])}
              />
            </div>
          ) : null}

          <div className="seasonal-bg-dial__section">
            <h2 className="seasonal-bg-dial__heading">Rendered RGB</h2>
            <p className="seasonal-bg-dial__section-note">
              Effective colors after global dials — use hex or rgb when updating tokens.
            </p>
            <ul className="seasonal-bg-dial__rgb-list">
              {renderedPalette.map((entry) => (
                <li key={entry.label} className="seasonal-bg-dial__rgb-row">
                  <span className="seasonal-bg-dial__rgb-label">{entry.label}</span>
                  <span className="seasonal-bg-dial__rgb-values">
                    <code>{entry.hex}</code>
                    <code>{formatRgb(entry.hex)}</code>
                  </span>
                </li>
              ))}
              <li className="seasonal-bg-dial__rgb-row">
                <span className="seasonal-bg-dial__rgb-label">Glow</span>
                <span className="seasonal-bg-dial__rgb-values">
                  <code>{buildGlowRgba(glowColor, glow)}</code>
                  <code>{formatRgb(glowColor)}</code>
                </span>
              </li>
            </ul>
          </div>

          <div className="seasonal-bg-dial__swatch" style={{ background }} aria-hidden />

          <div className="seasonal-bg-dial__actions">
            <button type="button" className="seasonal-bg-dial__primary" onClick={copySnippet}>
              {copied ? 'Copied' : 'Copy accent values'}
            </button>
            <button type="button" className="seasonal-bg-dial__secondary" onClick={reset}>
              Reset
            </button>
          </div>

          <pre className="seasonal-bg-dial__snippet">{snippet}</pre>
        </aside>

        <div className="seasonal-bg-dial-page__preview">
          <p className="seasonal-bg-dial-page__preview-label">Live preview</p>
          <div className="seasonal-bg-dial-page__preview-frame">
            <HomeExperimentPage
              pageClassName="home-experiment-page--refined home-experiment-page--seasonal-discovery home-experiment-page--planetbox-band"
              shellClassName="home-experiment-shell--refined"
              heroVariant="refined"
              layout="refined"
              logoOnly={false}
              logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
              logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
              showBrandName={false}
              headerBelow={<HomeLaunchAnnouncement />}
              topBand={previewTopBand}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
