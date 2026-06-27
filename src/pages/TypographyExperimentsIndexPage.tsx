import { Link } from 'react-router-dom'
import { TYPOGRAPHY_EXPERIMENT_GROUPS } from './typographyExperiments'

export function TypographyExperimentsIndexPage() {
  return (
    <div className="typography-experiments-index">
      <div className="typography-experiments-index-inner layout-container">
        <header className="typography-experiments-index-header">
          <p className="typography-experiments-index-eyebrow">Internal preview</p>
          <h1 className="typography-experiments-index-title">Typography experiments</h1>
          <p className="typography-experiments-index-lede">
            Compare headline treatments on Home, About, and Share. Production pages are unchanged.
          </p>
          <Link to="/" className="typography-experiments-index-back">
            Back to Home
          </Link>
        </header>

        <div className="typography-experiments-index-groups">
          {TYPOGRAPHY_EXPERIMENT_GROUPS.map((group) => (
            <section
              key={group.id}
              className="typography-experiments-index-group"
              aria-labelledby={`typography-experiments-group-${group.id}`}
            >
              <div className="typography-experiments-index-group-head">
                <h2
                  id={`typography-experiments-group-${group.id}`}
                  className="typography-experiments-index-group-title"
                >
                  {group.title}
                </h2>
                <p className="typography-experiments-index-group-desc">{group.description}</p>
              </div>
              <ul className="typography-experiments-index-list">
                {group.experiments.map((experiment) => (
                  <li key={experiment.path}>
                    <Link to={experiment.path} className="typography-experiments-index-card">
                      <span className="typography-experiments-index-card-title">
                        {experiment.title}
                      </span>
                      <span className="typography-experiments-index-card-desc">
                        {experiment.description}
                      </span>
                      <span className="typography-experiments-index-card-path">
                        {experiment.path}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
