import { useId, useState, type FormEvent } from 'react'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import {
  CONTACT_TOPIC_OPTIONS,
  submitContactMessage,
  type ContactTopic,
} from '../utils/contactApi'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './share-page.css'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export function ContactPage() {
  const formId = useId()
  const [topic, setTopic] = useState<ContactTopic | ''>('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    Boolean(topic) && email.trim().includes('@') && message.trim().length >= 5 && status !== 'submitting'

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!topic || !canSubmit) return

    setStatus('submitting')
    setError(null)
    try {
      await submitContactMessage({
        topic,
        email,
        message,
        company,
      })
      setStatus('success')
      setTopic('')
      setEmail('')
      setMessage('')
      setCompany('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Could not send your message. Please try again.')
    }
  }

  return (
    <div className="share-page-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <div className="share-page-main pb-40 md:pb-8">
        <PageContainer className="pt-6">
          {status === 'success' ? (
            <div className="share-success-panel animate-fade-in" role="status">
              <h1 className="share-page-title">Thanks for reaching out!</h1>
              <p className="share-page-body-muted">We&apos;ve received your message.</p>
              <button
                type="button"
                className="btn-primary mt-8 w-full"
                onClick={() => setStatus('idle')}
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="share-layout-form max-w-xl">
              <header>
                <h1 className="share-page-title">Contact Puddles</h1>
                <p className="share-page-body">
                  Have a question, an idea to share, or a privacy request? We&apos;d love to hear from
                  you.
                </p>
              </header>

              <form className="share-form-card share-layout-form" onSubmit={onSubmit} noValidate>
                <div className="contact-field">
                  <label className="share-field-label mb-2 block" htmlFor={`${formId}-topic`}>
                    Topic
                  </label>
                  <select
                    id={`${formId}-topic`}
                    className="input-field input-field-select"
                    value={topic}
                    required
                    onChange={(e) => setTopic(e.target.value as ContactTopic | '')}
                  >
                    <option value="" disabled>
                      Choose a topic
                    </option>
                    {CONTACT_TOPIC_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="contact-field">
                  <label className="share-field-label mb-2 block" htmlFor={`${formId}-email`}>
                    Email
                  </label>
                  <input
                    id={`${formId}-email`}
                    type="email"
                    className="input-field"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="contact-field">
                  <label className="share-field-label mb-2 block" htmlFor={`${formId}-message`}>
                    Message
                  </label>
                  <textarea
                    id={`${formId}-message`}
                    className="input-field"
                    rows={6}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      topic === 'privacy'
                        ? 'Tell us whether you need access, a correction, or deletion of your information…'
                        : undefined
                    }
                  />
                  {topic === 'privacy' ? (
                    <p className="share-field-hint mt-2">
                      We may need to verify your identity before releasing or deleting account
                      information.
                    </p>
                  ) : null}
                </div>

                <div className="contact-honeypot" aria-hidden="true">
                  <label htmlFor={`${formId}-company`}>Company</label>
                  <input
                    id={`${formId}-company`}
                    tabIndex={-1}
                    autoComplete="off"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                {error ? (
                  <p className="contact-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button type="submit" className="btn-primary" disabled={!canSubmit}>
                  {status === 'submitting' ? 'Sending…' : 'Send message'}
                </button>
              </form>
            </div>
          )}
        </PageContainer>
      </div>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}
