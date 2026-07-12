import { Link } from 'react-router-dom'
import { SharePage } from './SharePage'

export function TypographyAboutStyleSharePage() {
  return (
    <SharePage
      shellClassName="typography-about-style-shell"
      experimentNote={
        <p className="typography-about-style-note">
          Typography experiment — intro line as About-style headline (no tab titles).{' '}
          <Link to="/share" className="typography-about-style-note-link">
            view current Share
          </Link>
        </p>
      }
    />
  )
}
