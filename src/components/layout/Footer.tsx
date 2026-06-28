import { Link } from 'react-router-dom'

export function Footer({
  className = '',
  fullBleed = false,
}: {
  className?: string
  fullBleed?: boolean
}) {
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
        <p className="site-footer-copy">© 2026 Puddles LLC</p>
      </div>
    </footer>
  )
}
