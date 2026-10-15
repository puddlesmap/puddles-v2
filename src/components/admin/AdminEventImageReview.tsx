import { useMemo, useState, type ChangeEvent } from 'react'
import { getEventHostImageUrl } from '../../data/eventHostImages'
import { EVENT_FALLBACK_IMAGES } from '../../utils/eventImages'
import { ACTIVITY_TYPES, type ActivityType } from '../../types/event'

type ImageCandidate = {
  imageUrl: string
  sourceUrl: string
  sourceLabel: string
  sourceType: 'official_event' | 'official_social'
  altText: string
  reason: string
}

type Props = {
  title: string
  venue: string
  eventUrl: string
  types: string[]
  imageUrl: string
  busy: boolean
  onChange: (imageUrl: string) => void
}

function primaryType(types: string[]): ActivityType {
  return types.find((type): type is ActivityType => ACTIVITY_TYPES.includes(type as ActivityType)) || 'Other'
}

export function AdminEventImageReview({
  title,
  venue,
  eventUrl,
  types,
  imageUrl,
  busy,
  onChange,
}: Props) {
  const [sourceUrl, setSourceUrl] = useState(eventUrl || '')
  const [candidates, setCandidates] = useState<ImageCandidate[]>([])
  const [selectedSource, setSelectedSource] = useState('')
  const [searching, setSearching] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [message, setMessage] = useState('')

  const hostImage = getEventHostImageUrl(venue)
  const fallbackType = primaryType(types)
  const fallbackImage = EVENT_FALLBACK_IMAGES[fallbackType]
  const safeImageUrl = imageUrl || ''
  const previewUrl = safeImageUrl.trim() || hostImage || fallbackImage
  const fallbackLabel = hostImage
    ? `Official venue fallback · ${venue}`
    : `Puddles clay fallback · ${fallbackType}`
  const currentSource = safeImageUrl.trim()
    ? selectedSource || 'Selected image URL · provenance not recorded'
    : fallbackLabel
  const query = encodeURIComponent([title, venue, 'official'].filter(Boolean).join(' '))
  const webSearchUrl = `https://www.google.com/search?tbm=isch&q=${query}`
  const socialSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ${title} ${venue}`)}`
  const needsSourceImage = !safeImageUrl.trim() && !hostImage

  async function searchOfficialSources() {
    const sourceUrls = [...new Set([eventUrl, sourceUrl].map((url) => String(url || '').trim()).filter((url) => /^https?:\/\//i.test(url)))]
    if (sourceUrls.length === 0) {
      setMessage('Add an official event, organizer or social URL first.')
      return
    }
    setSearching(true)
    setSearched(false)
    setMessage('')
    try {
      const response = await fetch('/api/admin/event-images', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrls }),
      })
      const data = (await response.json()) as {
        ok?: boolean
        candidates?: ImageCandidate[]
        errors?: string[]
        error?: string
      }
      if (!response.ok || data.ok === false) throw new Error(data.error || 'Could not inspect official sources.')
      setCandidates(data.candidates || [])
      setSearched(true)
      setMessage(
        data.candidates?.length
          ? ''
          : data.errors?.[0] || 'No usable images were found on those official pages. Keep the fallback or upload one.',
      )
    } catch (error) {
      setCandidates([])
      setSearched(true)
      setMessage(error instanceof Error ? error.message : 'Could not inspect official sources.')
    } finally {
      setSearching(false)
    }
  }

  function choose(candidate: ImageCandidate) {
    onChange(candidate.imageUrl)
    setSelectedSource(`${candidate.sourceLabel} · ${candidate.sourceUrl}`)
    setMessage('Image selected. Save edits or approve to keep it.')
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setMessage('')
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/admin/event-images', {
        method: 'POST',
        credentials: 'include',
        body,
      })
      const data = (await response.json()) as { ok?: boolean; imageUrl?: string; sourceLabel?: string; error?: string }
      if (!response.ok || !data.imageUrl) throw new Error(data.error || 'Could not upload that image.')
      onChange(data.imageUrl)
      setSelectedSource(data.sourceLabel || `Manual upload · ${file.name}`)
      setMessage('Upload selected. Save edits or approve to keep it.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not upload that image.')
    } finally {
      setUploading(false)
    }
  }

  const candidateCountLabel = useMemo(
    () => candidates.length === 1 ? '1 official candidate' : `${candidates.length} official candidates`,
    [candidates.length],
  )

  return (
    <section className="admin-image-review" aria-label="Event image review">
      <div className="admin-image-review__current">
        <img src={previewUrl} alt="" className="admin-image-review__preview" />
        <div>
          <strong>Current card image</strong>
          <p>{currentSource}</p>
          {needsSourceImage ? (
            <p className="admin-image-review__notice">
              No event or host image is available. The clay fallback stays selected unless you choose another image.
            </p>
          ) : null}
        </div>
      </div>

      <label className="admin-discovery-field">
        <span className="admin-discovery-field__label">Image URL</span>
        <input
          className="admin-discovery-input"
          value={safeImageUrl}
          onChange={(event) => {
            onChange(event.target.value)
            setSelectedSource(event.target.value.trim() ? 'Manually entered image URL' : '')
          }}
          disabled={busy}
          placeholder="Leave blank to keep the current fallback"
        />
      </label>

      <details className="admin-image-search">
        <summary>Find an official image</summary>
        <p className="admin-image-search__help">
          Search the official event page first. You can also paste an official organizer, venue or social post URL.
          Results are never selected automatically.
        </p>
        <div className="admin-image-search__controls">
          <input
            className="admin-discovery-input"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            disabled={busy || searching}
            placeholder="Official event, organizer or social URL"
            inputMode="url"
          />
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={busy || searching}
            onClick={() => void searchOfficialSources()}
          >
            {searching ? 'Searching…' : 'Preview official images'}
          </button>
        </div>
        <div className="admin-image-search__links">
          <a href={webSearchUrl} target="_blank" rel="noreferrer">Search the web ↗</a>
          <a href={socialSearchUrl} target="_blank" rel="noreferrer">Search Instagram ↗</a>
          <span>Verify the organizer and reuse permission before choosing.</span>
        </div>

        {candidates.length > 0 ? (
          <>
            <p className="admin-image-search__count">{candidateCountLabel}</p>
            <div className="admin-image-candidates">
              {candidates.map((candidate) => (
                <article key={candidate.imageUrl} className="admin-image-candidate">
                  <img src={candidate.imageUrl} alt={candidate.altText || 'Official image candidate'} />
                  <div>
                    <strong>{candidate.reason}</strong>
                    <p>{candidate.sourceLabel}</p>
                    <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    disabled={busy}
                    onClick={() => choose(candidate)}
                  >
                    Use this image
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : searched && !message ? (
          <p className="text-sm text-muted">No usable official images found. Keep the fallback or upload one.</p>
        ) : null}

        <div className="admin-image-search__footer">
          <label className="admin-btn admin-btn-secondary admin-image-upload">
            {uploading ? 'Uploading…' : 'Upload manually'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy || uploading}
              onChange={(event) => void upload(event)}
            />
          </label>
          <button
            type="button"
            className="admin-btn admin-btn-text"
            disabled={busy || (!safeImageUrl.trim() && !selectedSource)}
            onClick={() => {
              onChange('')
              setSelectedSource('')
              setMessage('Fallback selected.')
            }}
          >
            Keep fallback
          </button>
        </div>
        {message ? <p className="admin-image-search__message">{message}</p> : null}
      </details>
    </section>
  )
}
