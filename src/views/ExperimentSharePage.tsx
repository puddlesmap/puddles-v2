import { Link } from 'react-router-dom'
import { SharePage } from './SharePage'

export function ExperimentSharePage() {
  return (
    <SharePage
      shellClassName="share-page-shell--experiment"
      experimentNote={
        <p className="share-experiment-note">
          Share experiment — Puddles design system.{' '}
          <Link to="/share" className="share-experiment-note-link">
            view current share page
          </Link>
        </p>
      }
    />
  )
}
