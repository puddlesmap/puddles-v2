import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ALL_EVENTS } from '../data/events'
import {
  EXPERIMENT_LIFECYCLE_SCENARIOS,
  EXPERIMENT_TIME_PRESETS,
} from '../data/experimentExpiredActivity'
import {
  useExperimentLifecycleControls,
  useExperimentLifecycleNow,
} from '../context/ExperimentLifecycleContext'
import {
  getEventEffectiveEndTime,
  getEventLifecycleStatus,
  getLifecycleDiscoveryDelta,
  isDiscoverableLifecycleEvent,
} from '../utils/eventLifecycle'
import { experimentEventDetailPath } from '../utils/eventLifecycleBrowse'
import { ExperimentExpiredActivityNote } from './ExperimentExpiredActivityLayout'

function formatSampleMeta(event: (typeof ALL_EVENTS)[number], now: Date) {
  const status = getEventLifecycleStatus(event, now)
  return `${status} · ${event.date} · ${event.city}`
}

export function ExperimentExpiredActivityPage() {
  const now = useExperimentLifecycleNow()
  const { simulatedNow, setSimulatedNow, setSimulatedOffsetDays } = useExperimentLifecycleControls()

  const delta = useMemo(() => getLifecycleDiscoveryDelta(now), [now])

  const samples = useMemo(() => {
    const ended = ALL_EVENTS.find(
      (event) => event.status === 'Published' && getEventLifecycleStatus(event, now) === 'ended',
    )
    const upcoming = ALL_EVENTS.find((event) => isDiscoverableLifecycleEvent(event, now))
    const cancelled = ALL_EVENTS.find((event) => getEventLifecycleStatus(event, now) === 'cancelled')
    const archivedCandidate = ALL_EVENTS.find((event) => event.status === 'Published' && event.isPast)

    return [
      { label: 'Upcoming sample', event: upcoming },
      { label: 'Ended sample', event: ended ?? archivedCandidate },
      { label: 'Cancelled sample', event: cancelled },
    ].filter((row) => row.event)
  }, [now])

  const archiveSample = samples.find((row) => row.label === 'Ended sample')?.event

  return (
    <div className="experiment-expired-activity-page layout-shell-app">
      <header className="experiment-expired-activity-header">
        <p className="experiment-expired-activity-eyebrow">Internal experiment</p>
        <h1 className="experiment-expired-activity-title">Expired activity lifecycle</h1>
        <ExperimentExpiredActivityNote />
      </header>

      <section className="experiment-expired-activity-panel" aria-labelledby="expired-activity-scenarios">
        <h2 id="expired-activity-scenarios" className="experiment-expired-activity-panel__title">
          States
        </h2>
        <ul className="experiment-expired-activity-scenarios">
          {EXPERIMENT_LIFECYCLE_SCENARIOS.map((scenario) => (
            <li key={scenario.id}>
              <strong>{scenario.label}</strong>
              <span>{scenario.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="experiment-expired-activity-panel" aria-labelledby="expired-activity-time">
        <h2 id="expired-activity-time" className="experiment-expired-activity-panel__title">
          Simulate time
        </h2>
        <p className="experiment-expired-activity-panel__lede">
          Current experiment clock:{' '}
          <strong>{now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
          {simulatedNow ? ' (simulated)' : ' (live)'}
        </p>
        <div className="experiment-expired-activity-time-actions">
          {EXPERIMENT_TIME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (preset.id === 'live') {
                  setSimulatedNow(null)
                  return
                }

                const baseEnd = archiveSample ? getEventEffectiveEndTime(archiveSample) : now
                setSimulatedOffsetDays(preset.offsetDays, baseEnd)
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section className="experiment-expired-activity-panel" aria-labelledby="expired-activity-discovery">
        <h2 id="expired-activity-discovery" className="experiment-expired-activity-panel__title">
          Discovery impact
        </h2>
        <dl className="experiment-expired-activity-metrics">
          <div>
            <dt>Legacy public count</dt>
            <dd>{delta.legacyPublicCount}</dd>
          </div>
          <div>
            <dt>Lifecycle upcoming count</dt>
            <dd>{delta.lifecycleUpcomingCount}</dd>
          </div>
          <div>
            <dt>Ended but still in legacy public</dt>
            <dd>{delta.endedVisibleInLegacy}</dd>
          </div>
        </dl>
        <Link to="/experiment-expired-activity/browse" className="btn-primary">
          Open experiment browse
        </Link>
      </section>

      <section className="experiment-expired-activity-panel" aria-labelledby="expired-activity-samples">
        <h2 id="expired-activity-samples" className="experiment-expired-activity-panel__title">
          Sample detail pages
        </h2>
        <ul className="experiment-expired-activity-samples">
          {samples.map(({ label, event }) => (
            <li key={event!.id}>
              <Link to={experimentEventDetailPath(event!)} className="experiment-expired-activity-sample-link">
                <span className="experiment-expired-activity-sample-link__title">{label}</span>
                <span className="experiment-expired-activity-sample-link__meta">
                  {event!.title} — {formatSampleMeta(event!, now)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
