import { useEffect, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  LogoExploration1,
  LogoExploration2,
  LogoExploration3,
  LogoExploration4,
  LogoExploration5,
  LogoExploration6,
  type LogoExplorationProps,
} from '../components/brand/logos'

interface Exploration {
  id: number
  title: string
  description: string
  png: string
  Component: ComponentType<LogoExplorationProps>
  compactPreview?: boolean
}

const EXPLORATIONS: Exploration[] = [
  {
    id: 1,
    title: 'Simple wordmark',
    description: 'Custom organic blob letters in soft blue tints — lumi-style, no character moment.',
    png: '/logo-explorations/puddles-logo-01-wordmark.png',
    Component: LogoExploration1,
  },
  {
    id: 2,
    title: 'Eyes inside the “u”',
    description: 'Thick rounded u with tiny dot eyes and a gentle smile in the bowl.',
    png: '/logo-explorations/puddles-logo-02-eyes-in-u.png',
    Component: LogoExploration2,
  },
  {
    id: 3,
    title: 'Droplet “d”',
    description: 'First d as a soft teardrop blob with micro face; remaining letters stay organic.',
    png: '/logo-explorations/puddles-logo-03-droplet-d.png',
    Component: LogoExploration3,
  },
  {
    id: 4,
    title: 'Puddle underline',
    description: 'Organic sky-blue blob beneath the wordmark, wider under “ddles”.',
    png: '/logo-explorations/puddles-logo-04-puddle-underline.png',
    Component: LogoExploration4,
  },
  {
    id: 5,
    title: 'Icon + wordmark lockup',
    description: 'Circular puddle icon with overlapping dots, wordmark and subtitle to the right.',
    png: '/logo-explorations/puddles-logo-05-icon-lockup.png',
    Component: LogoExploration5,
  },
  {
    id: 6,
    title: 'Compact mobile header',
    description: 'Icon + “Puddles” only — fits ~32px header height, no subtitle.',
    png: '/logo-explorations/puddles-logo-06-compact.png',
    Component: LogoExploration6,
    compactPreview: true,
  },
]

function useLogoLabFonts() {
  useEffect(() => {
    const id = 'logo-lab-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Comfortaa:wght@300&family=Quicksand:wght@700&display=swap'
    document.head.appendChild(link)
  }, [])
}

export function LogoLabPage() {
  useLogoLabFonts()

  return (
    <div className="logo-lab">
      <div className="logo-lab-inner layout-container">
        <header className="logo-lab-header">
          <p className="logo-lab-eyebrow">Exploratory — not live branding</p>
          <h1 className="logo-lab-title">Puddles logo explorations</h1>
          <div className="logo-lab-reference">
            <img
              src="/logo-explorations/lumi-reference.png"
              alt="lumi logo style reference"
              className="logo-lab-reference-img"
            />
            <p className="logo-lab-reference-caption">
              Style reference: thick organic blob letterforms + thin subtitle (lumi)
            </p>
          </div>
          <p className="logo-lab-lede">
            Six directions inspired by soft custom wordmarks like <strong>lumi</strong> and Bambi Mini —
            thick organic blob letterforms, gentle character moments, and a thin Comfortaa subtitle.
            Brand color <code>#66C5F9</code>.
          </p>
          <Link to="/" className="logo-lab-back">
            ← Back to Puddles
          </Link>
        </header>

        <div className="logo-lab-grid">
          {EXPLORATIONS.map(({ id, title, description, png, Component, compactPreview }) => (
            <article key={id} className="logo-lab-card">
              <div className="logo-lab-card-head">
                <span className="logo-lab-card-num">{id}/6</span>
                <h2 className="logo-lab-card-title">{title}</h2>
                <p className="logo-lab-card-desc">{description}</p>
              </div>

              <div className="logo-lab-card-mockup">
                <img src={png} alt={`${title} mockup`} className="logo-lab-png" loading="lazy" />
              </div>

              <div className="logo-lab-card-live">
                <p className="logo-lab-live-label">Live SVG</p>
                <div className="logo-lab-live-stage">
                  <Component size="default" showSubtitle />
                </div>
              </div>

              {compactPreview && (
                <div className="logo-lab-card-header-preview">
                  <p className="logo-lab-live-label">Header scale (~32px)</p>
                  <div className="logo-lab-header-bar">
                    <Component size="compact" showSubtitle={false} />
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
