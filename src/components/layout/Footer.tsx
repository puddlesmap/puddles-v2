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

/** Plain anchors: Footer can render outside a matching <Routes> tree (standalone event pages). */
function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="site-footer-link">
      {children}
    </a>
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
  const showExpansionWatch =
    pathname === '/share' || pathname.startsWith('/share-')

  return (
    <footer
      className={`site-footer ${fullBleed ? 'site-footer--full-bleed' : 'mt-16'} ${className}`.trim()}
    >
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <p className="site-footer-brand-name">{SITE.name}</p>
            <p className="site-footer-brand-desc">
              The tot map — local activities for little ones, starting on the South Peninsula.
            </p>
            <div className="site-footer-social site-footer-social--brand">
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
          </div>

          <nav className="site-footer-col" aria-label="Explore">
            <p className="site-footer-col-title">Explore</p>
            <ul className="site-footer-list">
              <li>
                <FooterLink href="/browse">Browse events</FooterLink>
              </li>
              <li>
                <FooterLink href="/guides">Guides</FooterLink>
              </li>
              <li>
                <FooterLink href="/saved">Saved</FooterLink>
              </li>
            </ul>
          </nav>

          <nav className="site-footer-col" aria-label="Locations">
            <p className="site-footer-col-title">Locations</p>
            <ul className="site-footer-list">
              <li>
                <FooterLink href="/palo-alto">Palo Alto</FooterLink>
              </li>
              <li>
                <FooterLink href="/los-altos">Los Altos</FooterLink>
              </li>
              <li>
                <FooterLink href="/mountain-view">Mountain View</FooterLink>
              </li>
              <li>
                <FooterLink href="/sunnyvale">Sunnyvale</FooterLink>
              </li>
              <li>
                <FooterLink href="/discovery">All cities</FooterLink>
              </li>
            </ul>
          </nav>

          <nav className="site-footer-col" aria-label="Puddles">
            <p className="site-footer-col-title">Puddles</p>
            <ul className="site-footer-list">
              <li>
                <FooterLink href="/about">About</FooterLink>
              </li>
              <li>
                <FooterLink href="/share">Share an event</FooterLink>
              </li>
              <li>
                <FooterLink href="/contact">Contact</FooterLink>
              </li>
            </ul>
          </nav>
        </div>

        {showExpansionWatch ? (
          <ExpansionWatch
            sourceContext="footer_about"
            className="site-footer-expansion-watch"
          />
        ) : null}

        <div className="site-footer-bottom">
          <p className="site-footer-copy">© 2026 Puddles LLC</p>
          <FooterLink href="/privacy">Privacy Policy</FooterLink>
        </div>
      </div>
    </footer>
  )
}
