import { useLocation } from 'react-router-dom'
import { SITE } from '../../config/site'
import { ExpansionWatch } from '../expansion-watch/ExpansionWatch'

function InstagramIcon() {
  return (
    <svg
      className="site-footer-social-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg
      className="site-footer-social-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.4V9.84c0-2.37 1.4-3.69 3.56-3.69 1.03 0 2.12.19 2.12.19v2.34h-1.2c-1.18 0-1.55.74-1.55 1.49v1.79h2.64l-.42 2.91h-2.22V22c4.78-.75 8.44-4.91 8.44-9.93z" />
    </svg>
  )
}

export function Footer({
  className = '',
  fullBleed = false,
}: {
  className?: string
  fullBleed?: boolean
}) {
  const { pathname } = useLocation()
  // Home/Browse use the floating CTA; About uses a text link. Keep footer form on Share only.
  const showExpansionWatch =
    pathname === '/share' || pathname.startsWith('/share-')

  return (
    <footer
      className={`site-footer ${fullBleed ? 'site-footer--full-bleed' : 'mt-16'} py-10 text-center ${className}`.trim()}
    >
      <div className="site-footer-inner">
        <div className="site-footer-lead">
          <p className="site-footer-lead-line">
            Starting in Palo Alto, Los Altos, and Mountain View.
          </p>
          <p className="site-footer-lead-line">
            {/*
              Real navigation (not a react-router <Link>): the shared footer renders
              in several router contexts — including the standalone event page whose
              in-memory router has no matching <Routes>, where a <Link> is inert. A
              plain anchor guarantees "Growing with your help" always lands on the
              Share with Us page at the top, with normal history/back, on every page.
            */}
            <a href="/share" className="link-tertiary whitespace-nowrap">
              Growing with your help.
            </a>
          </p>
        </div>

        <div className="site-footer-social">
          <p className="site-footer-social-label">Follow Puddles</p>
          <div className="site-footer-social-links">
            <a
              href={SITE.social.instagram}
              className="site-footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Puddles on Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href={SITE.social.facebook}
              className="site-footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Puddles on Facebook"
            >
              <FacebookIcon />
            </a>
          </div>
        </div>

        {showExpansionWatch ? (
          <ExpansionWatch
            sourceContext="footer_about"
            className="site-footer-expansion-watch"
          />
        ) : null}
        <p className="site-footer-copy">© 2026 Puddles LLC</p>
      </div>
    </footer>
  )
}
