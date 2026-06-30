import { Link, useLocation } from 'react-router-dom'
import { ExpansionWatch } from '../expansion-watch/ExpansionWatch'

export function Footer({
  className = '',
  fullBleed = false,
}: {
  className?: string
  fullBleed?: boolean
}) {
  const { pathname } = useLocation()
  const showExpansionWatch = !pathname.startsWith('/about')

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
            <Link to="/share" className="link-tertiary whitespace-nowrap">
              Growing with your help.
            </Link>
          </p>
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
