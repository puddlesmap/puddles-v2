/** Launch announcement — flush under global nav (PlanetBox-style promo bar). */
export const HOME_LAUNCH_PREVIEW_ANNOUNCEMENT =
  'Now in Sunnyvale 🎉 Plus more ways to explore: Festivals & Parent + Me.'

const DEFAULT_MESSAGE = HOME_LAUNCH_PREVIEW_ANNOUNCEMENT

export function HomeLaunchAnnouncement({ message = DEFAULT_MESSAGE }: { message?: string }) {
  return (
    <div className="home-announcement-bar" role="status">
      <p className="home-announcement-bar__text">{message}</p>
    </div>
  )
}
