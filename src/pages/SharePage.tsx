import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IdeaFeedbackCard,
  hasValidIdeaFeedback,
  type IdeaChipKey,
} from '../components/IdeaFeedbackCard'
import { PageContainer } from '../components/layout/PageContainer'
import { AppHeader } from '../components/layout/AppHeader'
import {
  ShareActivityForm,
  type ShareActivityFormHandle,
} from '../components/share/ShareActivityForm'
import type { ActivitySubmissionPayload } from '../types/submission'
import { submitActivitySubmission, submitIdeaSubmission } from '../utils/intake'
import { track } from '../utils/analytics'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

type ShareTab = 'activity' | 'idea'
type View = 'form' | 'success'

function ShareSideIntro({ tab }: { tab: ShareTab }) {
  if (tab === 'idea') {
    return (
      <div className="share-side-intro">
        <p className="share-page-body">What would make Puddles more helpful?</p>
        <p className="share-page-body-muted">
          Your ideas help us grow a small, trustworthy guide for local family moments.
        </p>
      </div>
    )
  }

  return (
    <div className="share-side-intro">
      <div className="share-page-activity-intro">
        <p className="share-page-body">
          Know a great local activity? Share it with nearby families.
        </p>
        <div className="share-page-body-muted share-page-activity-details">
          <p className="share-page-activity-details-lead">
            We&apos;re looking for easy, casual fun like:
          </p>
          <ul className="share-page-activity-examples">
            <li>Free/Low-cost: Storytimes &amp; open gym times</li>
            <li>Drop-in: Music circle &amp; art classes</li>
            <li>Casual: Park concerts &amp; outdoor gatherings</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function TabSwitcher({ tab, onChange }: { tab: ShareTab; onChange: (t: ShareTab) => void }) {
  return (
    <div className="share-tab-switcher" role="tablist" aria-label="Share page tabs">
      {(
        [
          ['activity', 'Share activity'],
          ['idea', 'Suggest an idea'],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={tab === key}
          onClick={() => onChange(key)}
          className={tab === key ? 'share-tab-active' : ''}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ShareSubmitBlock({
  tab,
  isSubmitting,
  canSubmitActivity,
  canSubmitIdea,
  onSubmit,
  className = '',
}: {
  tab: ShareTab
  isSubmitting: boolean
  canSubmitActivity: boolean
  canSubmitIdea: boolean
  onSubmit: () => void
  className?: string
}) {
  const disabled = tab === 'activity' ? !canSubmitActivity : !canSubmitIdea
  const label = isSubmitting
    ? 'Sending…'
    : tab === 'activity'
      ? 'Submit activity'
      : 'Submit idea'

  return (
    <div className={`share-submit-block ${className}`.trim()}>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="btn-primary w-full disabled:opacity-40"
      >
        {label}
      </button>
      <p className="share-submit-consent">
        By sharing, you help us keep the map current and helpful for all local families.
      </p>
    </div>
  )
}

interface SharePageProps {
  shellClassName?: string
  useHomeHeader?: boolean
  experimentNote?: ReactNode
}

export function SharePage({
  shellClassName,
  useHomeHeader = true,
  experimentNote,
}: SharePageProps = {}) {
  const navigate = useNavigate()
  const activityFormRef = useRef<ShareActivityFormHandle>(null)
  const [view, setView] = useState<View>('form')
  const [tab, setTab] = useState<ShareTab>('activity')
  const [submittedReviewOnly, setSubmittedReviewOnly] = useState(false)

  const [selectedChips, setSelectedChips] = useState<IdeaChipKey[]>([])
  const [ideaDetail, setIdeaDetail] = useState('')
  const [submittedByEmail, setSubmittedByEmail] = useState('')

  const [canSubmitActivity, setCanSubmitActivity] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const root = document.querySelector('.layout-root')
    root?.classList.add('layout-root--share-refined')

    return () => {
      root?.classList.remove('layout-root--share-refined')
    }
  }, [])

  const canSubmitIdea = tab === 'idea' && hasValidIdeaFeedback(selectedChips, ideaDetail) && !isSubmitting

  function resetForm() {
    setSubmittedReviewOnly(false)
    setSelectedChips([])
    setIdeaDetail('')
    setSubmittedByEmail('')
    setSubmitError(null)
    setView('form')
  }

  function toggleChip(key: IdeaChipKey) {
    setSelectedChips((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    )
  }

  function handleTabChange(next: ShareTab) {
    if (next !== tab) {
      track('share_tab_change', { tab: next })
    }
    setTab(next)
  }

  async function handleActivitySubmit(payload: ActivitySubmissionPayload) {
    await submitActivitySubmission(payload)
    track('share_submit', {
      type: 'activity',
      city_bucket: payload.reviewOnly ? 'other' : 'in_market',
      review_only: payload.reviewOnly,
    })
    setSubmittedReviewOnly(payload.reviewOnly)
    setView('success')
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      if (tab === 'activity') {
        await activityFormRef.current?.submit()
      } else {
        await submitIdeaSubmission({
          submissionType: 'Idea',
          ideaTypes: selectedChips,
          additionalInfo: ideaDetail.trim(),
          submittedByEmail: submittedByEmail.trim(),
          submittedAt: new Date().toISOString(),
        })
        track('share_submit', {
          type: 'idea',
          city_bucket: 'in_market',
          review_only: false,
        })
        setSubmittedReviewOnly(false)
        setView('success')
      }
    } catch (error) {
      track('share_submit_error', {
        type: tab,
        reason: 'api',
      })
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Could not send your submission. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (view === 'success') {
    return (
      <div className="share-page-shell">
        <PageContainer className="flex min-h-[70dvh] flex-col justify-center pt-8">
          <div className="share-success-panel animate-fade-in text-center">
            <h1 className="share-page-title">Thanks for helping out!</h1>
            <p className="share-page-body-muted">
              {submittedReviewOnly
                ? "We'll review your submission manually since it's outside our current cities. We'll follow up if we expand there."
                : "We'll quickly review the details to make sure everything is accurate, then add it live to the neighborhood map so other families can find it."}
            </p>
            <div className="mt-10 space-y-3">
              <Link to="/" className="btn-primary block w-full">
                Find something nearby
              </Link>
              <button type="button" onClick={resetForm} className="share-page-text-action">
                Share Another
              </button>
            </div>
          </div>
        </PageContainer>
      </div>
    )
  }

  return (
    <div className={['share-page-shell', shellClassName].filter(Boolean).join(' ')}>
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
        trailing={
          useHomeHeader ? undefined : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="app-header-close"
              aria-label="Close"
            >
              ✕
            </button>
          )
        }
      />

      <div className="share-page-main pb-40 md:pb-8">
        <PageContainer className="pt-6">
          <div className="share-layout">
            <aside className="hidden lg:block">
              <ShareSideIntro tab={tab} />
            </aside>

            <div className="share-layout-form">
              <div className="lg:hidden">
                <ShareSideIntro tab={tab} />
                <div className="mt-6">
                  <TabSwitcher tab={tab} onChange={handleTabChange} />
                </div>
              </div>

              <div className="hidden lg:block">
                <TabSwitcher tab={tab} onChange={handleTabChange} />
              </div>

              <div key={tab} className="share-form-card motion-feed-in">
                {tab === 'activity' ? (
                  <ShareActivityForm
                    ref={activityFormRef}
                    isSubmitting={isSubmitting}
                    onSubmit={handleActivitySubmit}
                    onCanSubmitChange={setCanSubmitActivity}
                  />
                ) : (
                  <div className="space-y-8">
                    <IdeaFeedbackCard
                      selectedChips={selectedChips}
                      onToggleChip={toggleChip}
                      detail={ideaDetail}
                      onDetailChange={setIdeaDetail}
                      showHeadline={false}
                    />

                    <div>
                      <label className="share-field-label mb-2 block">
                        Your info <span className="font-normal text-muted">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={submittedByEmail}
                        onChange={(e) => setSubmittedByEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="input-field"
                      />
                      <p className="share-field-hint mt-2">
                        Only if we need to follow up. We&apos;ll never share it.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <ShareSubmitBlock
                tab={tab}
                isSubmitting={isSubmitting}
                canSubmitActivity={canSubmitActivity}
                canSubmitIdea={canSubmitIdea}
                onSubmit={handleSubmit}
                className="share-submit-inline"
              />
              {submitError && (
                <p className="mt-3 text-sm text-red-700" role="alert">
                  {submitError}
                </p>
              )}
            </div>
          </div>
        </PageContainer>

        <div className="share-submit-bar">
          <div className="layout-container py-4">
            <ShareSubmitBlock
              tab={tab}
              isSubmitting={isSubmitting}
              canSubmitActivity={canSubmitActivity}
              canSubmitIdea={canSubmitIdea}
              onSubmit={handleSubmit}
            />
            {submitError && (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {submitError}
              </p>
            )}
          </div>
        </div>
        {experimentNote ? (
          <PageContainer className="pb-8">{experimentNote}</PageContainer>
        ) : null}
      </div>
    </div>
  )
}
