import { Link } from 'react-router-dom'

/** Launch announcement — flush under global nav (PlanetBox-style promo bar). */
export const HOME_LAUNCH_PREVIEW_ANNOUNCEMENT =
  'Puddles is now in Sunnyvale 🎉 Plus festivals and Parent & Me activities.'

const BROWSE_SUNNYVALE_HREF = '/browse?city=Sunnyvale'
const BROWSE_FESTIVALS_HREF = `/browse?activity=${encodeURIComponent('Festivals & Community')}`
const BROWSE_PARENT_ME_HREF = `/browse?activity=${encodeURIComponent('Parent & Me')}`

export function HomeLaunchAnnouncement({ message }: { message?: string } = {}) {
  return (
    <div className="home-announcement-bar" role="status">
      <p className="home-announcement-bar__text">
        {message ?? (
          <>
            Puddles is now in{' '}
            <Link to={BROWSE_SUNNYVALE_HREF} className="home-announcement-bar__link">
              Sunnyvale
            </Link>{' '}
            🎉 Plus{' '}
            <Link to={BROWSE_FESTIVALS_HREF} className="home-announcement-bar__link">
              festivals
            </Link>{' '}
            and{' '}
            <Link to={BROWSE_PARENT_ME_HREF} className="home-announcement-bar__link">
              Parent &amp; Me
            </Link>{' '}
            activities.
          </>
        )}
      </p>
    </div>
  )
}
