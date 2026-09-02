import { Link } from 'react-router-dom'
import {
  formatSeasonalDateRange,
  getLiveSeasonalThemeScheduleEntry,
  getSeasonalThemeScheduleStatus,
  SEASONAL_THEME_SCHEDULE,
  seasonalCollectionPath,
  type SeasonalThemeScheduleEntry,
  type SeasonalThemeScheduleStatus,
} from '../../data/seasonalDiscovery'

const STATUS_LABELS: Record<SeasonalThemeScheduleStatus, string> = {
  live: 'Live',
  transition: 'Transition',
  upcoming: 'Upcoming',
  past: 'Past',
  planned: 'Planned',
}

function ScheduleStatusBadge({ status }: { status: SeasonalThemeScheduleStatus }) {
  return (
    <span
      className={[
        'seasonal-theme-calendar__status',
        `seasonal-theme-calendar__status--${status}`,
      ].join(' ')}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function ScheduleRow({ entry, todayLabel }: { entry: SeasonalThemeScheduleEntry; todayLabel: string }) {
  const status = getSeasonalThemeScheduleStatus(entry, new Date(`${todayLabel}T12:00:00`))
  const isHighlighted = status === 'live' || status === 'transition'

  return (
    <tr
      className={[
        'seasonal-theme-calendar__row',
        isHighlighted ? 'seasonal-theme-calendar__row--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <td className="seasonal-theme-calendar__cell seasonal-theme-calendar__cell--theme">
        <div className="seasonal-theme-calendar__theme-cell">
          <img
            src={entry.illustrationSrc}
            alt=""
            className="seasonal-theme-calendar__illustration"
            width={40}
            height={40}
            decoding="async"
          />
          <div>
            <p className="seasonal-theme-calendar__module-title">{entry.moduleTitle}</p>
            <p className="seasonal-theme-calendar__eyebrow-label">
              {entry.emoji} {entry.theme}
            </p>
            {entry.slug ? (
              <Link
                to={seasonalCollectionPath(entry.slug)}
                className="seasonal-theme-calendar__collection-link"
              >
                View collection →
              </Link>
            ) : (
              <span className="seasonal-theme-calendar__collection-link seasonal-theme-calendar__collection-link--muted">
                Collection not built yet
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="seasonal-theme-calendar__cell">{entry.timing}</td>
      <td className="seasonal-theme-calendar__cell seasonal-theme-calendar__cell--dates">
        {formatSeasonalDateRange(entry.activeFrom, entry.activeUntil)}
      </td>
      <td className="seasonal-theme-calendar__cell">
        <ScheduleStatusBadge status={status} />
      </td>
      <td className="seasonal-theme-calendar__cell seasonal-theme-calendar__cell--note">
        {entry.transitionNote ?? '—'}
      </td>
    </tr>
  )
}

interface SeasonalThemeCalendarReviewProps {
  today?: Date
  showRules?: boolean
  compact?: boolean
}

export function SeasonalThemeCalendarReview({
  today = new Date(),
  showRules = true,
  compact = false,
}: SeasonalThemeCalendarReviewProps) {
  const todayLabel = today.toISOString().slice(0, 10)
  const liveEntry = getLiveSeasonalThemeScheduleEntry(today)

  return (
    <section className="seasonal-theme-calendar" aria-labelledby="seasonal-theme-calendar-heading">
      <header className="seasonal-theme-calendar__header">
        <h2 id="seasonal-theme-calendar-heading" className="seasonal-theme-calendar__title">
          Seasonal calendar
        </h2>
        <p className="seasonal-theme-calendar__lede">
          One theme live at a time — Fall with little ones → Halloween with little ones → Holiday
          magic. Content may blend during transition windows; the module title swaps on the start
          date of the next theme.
        </p>
        <p className="seasonal-theme-calendar__today">
          Review date:{' '}
          <strong>
            {today.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </strong>
          {liveEntry ? (
            <>
              {' '}
              · Live module: <strong>{liveEntry.moduleTitle}</strong>
            </>
          ) : (
            <> · No seasonal module scheduled</>
          )}
        </p>
      </header>

      {showRules ? (
        <ul className="seasonal-theme-calendar__rules">
          <li>
            <strong>Featured carousel</strong> rotates ~every 2–3 weeks; leaving featured does not
            remove an event from the full collection.
          </li>
          <li>Show <strong>one seasonal theme</strong> at a time — module windows do not overlap.</li>
          <li>
            <strong>Transition</strong> gradually: early picks from the next theme may appear before
            the title changes.
          </li>
          <li>
            <strong>Replace title/theme</strong> on the next theme&apos;s <code>activeFrom</code>{' '}
            date.
          </li>
        </ul>
      ) : null}

      <div className="seasonal-theme-calendar__table-wrap">
        <table
          className={[
            'seasonal-theme-calendar__table',
            compact ? 'seasonal-theme-calendar__table--compact' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <thead>
            <tr>
              <th scope="col">Module</th>
              <th scope="col">Season</th>
              <th scope="col">Active window</th>
              <th scope="col">Status</th>
              {!compact ? <th scope="col">Transition notes</th> : null}
            </tr>
          </thead>
          <tbody>
            {SEASONAL_THEME_SCHEDULE.map((entry) => (
              <ScheduleRow key={entry.theme} entry={entry} todayLabel={todayLabel} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
