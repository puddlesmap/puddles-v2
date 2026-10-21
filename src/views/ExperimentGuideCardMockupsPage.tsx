import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './experiment-guide-card-mockups.css'

const COLLECTION = '/experiment/seasonal-discovery/halloween-with-little-ones'
const DESKTOP_WIDTH = 1280
const DESKTOP_HEIGHT = 920
const PHONE_WIDTH = 390
const PHONE_HEIGHT = 844

const VARIANTS = [
  {
    id: 3,
    title: 'Title up, image with description',
    note: 'October guide and the title sit on the first line. The photo and description share the line below.',
  },
  {
    id: 4,
    title: 'Photo on top',
    note: 'The festival photo leads the card. There is no Local Guides heading.',
  },
  {
    id: 5,
    title: 'Guide name as the heading',
    note: 'Halloween with Little Ones replaces Local Guides and matches the Close to home size.',
  },
] as const

function pageSrc(id: number) {
  return `${COLLECTION}?card=${id}`
}

function DesktopFrame({ src, title }: { src: string; title: string }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const update = () => setScale(frame.clientWidth / DESKTOP_WIDTH)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={frameRef}
      className="gcm-frame gcm-frame--desktop"
      style={{ height: DESKTOP_HEIGHT * scale }}
    >
      <iframe
        title={title}
        src={src}
        style={{
          width: DESKTOP_WIDTH,
          height: DESKTOP_HEIGHT,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  )
}

export function ExperimentGuideCardMockupsPage() {
  return (
    <div className="gcm-page">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <main className="gcm-main">
        <header className="gcm-intro">
          <p className="gcm-kicker">Seasonal page</p>
          <h1>Local guide card</h1>
          <p>
            Each pair is the Halloween page with one card. Desktop is a 1280px page. Mobile is a
            390px page. Scroll inside a frame to see Close to home.
          </p>
          <nav className="gcm-jumps" aria-label="Card versions">
            {VARIANTS.map((variant) => (
              <a key={variant.id} href={`#card-${variant.id}`}>
                {variant.id} · {variant.title}
              </a>
            ))}
          </nav>
        </header>

        {VARIANTS.map((variant) => (
          <section key={variant.id} id={`card-${variant.id}`} className="gcm-version">
            <div className="gcm-version__head">
              <h2>
                {variant.id} · {variant.title}
              </h2>
              <p>{variant.note}</p>
              <Link to={pageSrc(variant.id)}>Open this page</Link>
            </div>
            <div className="gcm-pair">
              <figure>
                <figcaption>Desktop</figcaption>
                <DesktopFrame src={pageSrc(variant.id)} title={`Version ${variant.id} desktop`} />
              </figure>
              <figure>
                <figcaption>Mobile</figcaption>
                <div className="gcm-frame gcm-frame--mobile">
                  <iframe
                    title={`Version ${variant.id} mobile`}
                    src={pageSrc(variant.id)}
                    style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT }}
                  />
                </div>
              </figure>
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
