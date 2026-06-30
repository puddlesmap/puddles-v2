import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import {
  findShareVenueById,
  getAllShareVenues,
  getShareVenuesForCity,
  SHARE_CITY_OPTIONS,
  type ShareCity,
  type ShareVenue,
} from '../../data/shareVenues'
import type {
  ActivitySubmissionPayload,
  ShareAgeRange,
  ShareCostType,
  ShareSignupRequirement,
} from '../../types/submission'
import { canSubmitShareActivity, isLaunchCity, isShareCityOther } from '../../utils/shareFormValidation'

type Category = 'one-time' | 'recurring'

const COST_OPTIONS: ShareCostType[] = ['Free', 'Paid / Ticketed', 'Not sure']

const SIGNUP_OPTIONS: ShareSignupRequirement[] = [
  'Drop-in / just show up!',
  'RSVP recommended',
  'Registration required',
  'Not sure',
]

const AGE_OPTIONS: ShareAgeRange[] = ['0–2', '2–5', '5+', 'All ages', 'Not sure']

const RECURRING_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

function formatTimeLabel(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return minutes === 0 ? `${hour12} ${period}` : `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

function buildRecurringSchedule(day: string, startTime: string, endTime: string, notes: string): string {
  let schedule = `Every ${day}`
  if (startTime) schedule += ` at ${formatTimeLabel(startTime)}`
  if (endTime) schedule += ` – ${formatTimeLabel(endTime)}`
  const trimmedNotes = notes.trim()
  if (trimmedNotes) schedule += `. ${trimmedNotes}`
  return schedule
}

interface ShareActivityFormProps {
  isSubmitting: boolean
  onSubmit: (payload: ActivitySubmissionPayload) => Promise<void>
  onCanSubmitChange?: (canSubmit: boolean) => void
}

export interface ShareActivityFormHandle {
  submit: () => Promise<void>
}

export const ShareActivityForm = forwardRef<ShareActivityFormHandle, ShareActivityFormProps>(
  function ShareActivityForm({ isSubmitting, onSubmit, onCanSubmitChange }, ref) {
  const [category, setCategory] = useState<Category | null>(null)
  const [title, setTitle] = useState('')
  const [city, setCity] = useState<ShareCity | null>(null)
  const [cityOther, setCityOther] = useState('')
  const [placeQuery, setPlaceQuery] = useState('')
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [eventDate, setEventDate] = useState('')
  const [recurringDay, setRecurringDay] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [scheduleDescription, setScheduleDescription] = useState('')
  const [ageRange, setAgeRange] = useState<ShareAgeRange | ''>('')
  const [link, setLink] = useState('')
  const [costType, setCostType] = useState<ShareCostType | ''>('')
  const [costDetail, setCostDetail] = useState('')
  const [signupRequirement, setSignupRequirement] = useState<ShareSignupRequirement | ''>('')
  const [signupLinkInfo, setSignupLinkInfo] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [parentTips, setParentTips] = useState('')
  const [submittedByEmail, setSubmittedByEmail] = useState('')
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false)
  const venueRef = useRef<HTMLDivElement>(null)

  const selectedVenue = selectedVenueId ? findShareVenueById(selectedVenueId) : null
  const searchVenues = useMemo(() => {
    if (city === 'Other') return []
    if (city && isLaunchCity(city)) return getShareVenuesForCity(city)
    return getAllShareVenues()
  }, [city])
  const trimmedPlaceQuery = placeQuery.trim()
  const filteredVenues = useMemo(() => {
    const q = trimmedPlaceQuery.toLowerCase()
    if (!q) return []
    return searchVenues
      .filter(
        (venue) =>
          venue.name.toLowerCase().includes(q) || venue.address.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [searchVenues, trimmedPlaceQuery])
  const canSearchVenues = !isShareCityOther(city)

  const placeOrAddress = selectedVenue
    ? `${selectedVenue.name}, ${selectedVenue.address}`
    : trimmedPlaceQuery
  const usingTypedPlace = !selectedVenueId && trimmedPlaceQuery.length >= 2

  const formState = {
    category,
    title,
    city,
    cityOther,
    venueId: selectedVenueId,
    placeOrAddress,
    useCustomLocation: usingTypedPlace || isShareCityOther(city),
    eventDate,
    recurringDay,
    startTime,
    endTime,
    scheduleDescription,
    link,
    submittedByEmail,
  }

  const canSubmit = canSubmitShareActivity(formState, isSubmitting)

  useEffect(() => {
    onCanSubmitChange?.(canSubmit)
  }, [canSubmit, onCanSubmitChange])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (venueRef.current && !venueRef.current.contains(event.target as Node)) {
        setShowVenueSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function clearLocation() {
    setSelectedVenueId(null)
    setPlaceQuery('')
    setShowVenueSuggestions(false)
  }

  function handleCityChange(nextCity: ShareCity) {
    setCity(nextCity)
    if (nextCity === 'Other') {
      setSelectedVenueId(null)
    } else if (selectedVenueId) {
      const venue = findShareVenueById(selectedVenueId)
      if (venue && venue.city !== nextCity) {
        setSelectedVenueId(null)
      }
    }
    if (nextCity !== 'Other') {
      setCityOther('')
    }
  }

  function selectVenue(venue: ShareVenue) {
    setSelectedVenueId(venue.id)
    setCity(venue.city)
    setPlaceQuery('')
    setShowVenueSuggestions(false)
  }

  function handlePlaceQueryChange(value: string) {
    setPlaceQuery(value)
    setSelectedVenueId(null)
    setShowVenueSuggestions(true)
  }

  async function handleSubmit() {
    if (!category || !city || !canSubmit) return

    const reviewOnly = isShareCityOther(city)

    await onSubmit({
      submissionType: 'Event',
      eventType: category === 'recurring' ? 'Recurring class' : 'One-time event',
      eventName: title.trim(),
      city: reviewOnly ? 'Other' : city,
      cityOther: reviewOnly ? cityOther.trim() : '',
      placeOrAddress: placeOrAddress.trim(),
      venueId: selectedVenueId && !reviewOnly ? selectedVenueId : 'custom',
      date: category === 'one-time' ? eventDate : '',
      recurringDay: category === 'recurring' ? recurringDay : '',
      startTime,
      endTime,
      scheduleDescription:
        category === 'recurring'
          ? buildRecurringSchedule(recurringDay, startTime, endTime, scheduleDescription)
          : '',
      ageRange,
      link: link.trim(),
      costType,
      costDetail: costType === 'Paid / Ticketed' ? costDetail.trim() : '',
      signupRequirement,
      signupLinkInfo:
        signupRequirement === 'RSVP recommended' ||
        signupRequirement === 'Registration required'
          ? signupLinkInfo.trim()
          : '',
      eventDescription: eventDescription.trim(),
      parentTips: parentTips.trim(),
      submittedByEmail: submittedByEmail.trim(),
      submittedAt: new Date().toISOString(),
      reviewOnly,
    })
  }

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
  }))

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-base font-semibold">1. What kind of activity is this?</legend>
        <div className="pill-wrap">
          {(
            [
              ['one-time', 'One-Time Event'],
              ['recurring', 'Recurring Class'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setCategory(val)}
              className={`pill-select ${category === val ? 'pill-select-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="mb-2 block font-semibold" htmlFor="share-title">
          2. What is it called?
        </label>
        <input
          id="share-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Music & Movement in the Park"
          className="input-field"
        />
      </div>

      <div ref={venueRef}>
        <p className="mb-4 font-semibold">3. Where is it?</p>

        <div className="space-y-4">
          <label className="share-time-field block">
            <span className="share-time-label">City</span>
            <select
              id="share-city"
              value={city ?? ''}
              onChange={(e) => handleCityChange(e.target.value as ShareCity)}
              className="input-field input-field-select"
            >
              <option value="" disabled>
                Select a city
              </option>
              {SHARE_CITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {isShareCityOther(city) && (
            <>
              <input
                value={cityOther}
                onChange={(e) => setCityOther(e.target.value)}
                placeholder="Which city or neighborhood?"
                className="input-field"
              />
              <p className="share-field-hint">
                We&apos;ll review Other-area submissions manually. They won&apos;t appear on the map
                automatically.
              </p>
            </>
          )}

          {selectedVenue ? (
            <label className="share-time-field block">
              <span className="share-time-label">Place name or address</span>
              <div className="input-field flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{selectedVenue.name}</div>
                  <div className="share-field-hint mt-1">{selectedVenue.address}</div>
                </div>
                <button type="button" onClick={clearLocation} aria-label="Clear place">
                  ✕
                </button>
              </div>
            </label>
          ) : (
            <label className="share-time-field block">
              <span className="share-time-label">Place name or address</span>
              <input
                id="share-place"
                value={placeQuery}
                onChange={(e) => handlePlaceQueryChange(e.target.value)}
                onFocus={() => setShowVenueSuggestions(true)}
                placeholder="e.g., Mitchell Park Library, Shoup Park, or 1276 Harriet St"
                className="input-field"
              />
              <p className="share-field-hint mt-2">
                A place name is enough if you don&apos;t know the exact address.
              </p>
              {canSearchVenues &&
                showVenueSuggestions &&
                trimmedPlaceQuery.length > 0 &&
                filteredVenues.length > 0 && (
                  <ul className="mt-2 overflow-hidden rounded-lg border border-border bg-white shadow-card">
                    {filteredVenues.map((venue) => (
                      <li key={venue.id}>
                        <button
                          type="button"
                          onClick={() => selectVenue(venue)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-surface-muted"
                        >
                          <div className="font-medium">{venue.name}</div>
                          <div className="share-field-hint">
                            {venue.address} · {venue.city}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </label>
          )}
        </div>
      </div>

      {category && (
        <div>
          <label className="mb-2 block font-semibold">4. When is it?</label>
          {category === 'one-time' ? (
            <div className="share-time-grid">
              <label className="share-time-field">
                <span className="share-time-label">Date</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="input-field"
                />
              </label>
              <label className="share-time-field">
                <span className="share-time-label">Start time</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field"
                />
              </label>
              <label className="share-time-field">
                <span className="share-time-label">End time (optional)</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="share-time-field block">
                <span className="share-time-label mb-2 block">Day</span>
                <select
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(e.target.value)}
                  className="input-field input-field-select"
                >
                  <option value="" disabled>
                    Select a day
                  </option>
                  {RECURRING_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <div className="share-time-grid">
                <label className="share-time-field">
                  <span className="share-time-label">Start time</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-field"
                  />
                </label>
                <label className="share-time-field">
                  <span className="share-time-label">End time (optional)</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-field"
                  />
                </label>
              </div>
              <div>
                <input
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  placeholder="Anything else about the schedule? (optional)"
                  className="input-field"
                />
                <p className="share-field-hint mt-2">
                  e.g., &quot;Runs through June&quot; or &quot;No class on holidays.&quot;
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <fieldset>
        <legend className="mb-2 block font-semibold">
          5. Best for what age? <span className="font-normal text-muted">(Optional)</span>
        </legend>
        <p className="share-field-hint mb-3">
          A guess is okay — we&apos;ll review before posting.
        </p>
        <div className="pill-wrap">
          {AGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAgeRange((current) => (current === option ? '' : option))}
              className={`pill-select ${ageRange === option ? 'pill-select-active' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="mb-2 block font-semibold" htmlFor="share-link">
          6. Link to the event <span className="font-normal text-muted">(Optional)</span>
        </label>
        <input
          id="share-link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className="input-field"
        />
        <p className="share-field-hint mt-2">
          Paste a website, Instagram post, or library link to help us cross-check the details.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 block font-semibold">
          7. Is there a cost? <span className="font-normal text-muted">(Optional)</span>
        </legend>
        <p className="share-field-hint mb-3">
          Free is wonderful to know — but if it costs money, a rough estimate helps.
        </p>
        <div className="pill-wrap">
          {COST_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setCostType((current) => (current === option ? '' : option))
                if (option !== 'Paid / Ticketed') setCostDetail('')
              }}
              className={`pill-select ${costType === option ? 'pill-select-active' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
        {costType === 'Paid / Ticketed' && (
          <label className="share-time-field mt-4 block">
            <span className="share-time-label">How much?</span>
            <input
              value={costDetail}
              onChange={(e) => setCostDetail(e.target.value)}
              placeholder="e.g., $5 drop-in, $20 per child, or free for babies under 12 months"
              className="input-field"
            />
          </label>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 block font-semibold">
          8. Do families need to sign up first?{' '}
          <span className="font-normal text-muted">(Optional)</span>
        </legend>
        <p className="share-field-hint mb-3">
          Can we just show up, or do we need to book a spot ahead of time?
        </p>
        <div className="pill-wrap">
          {SIGNUP_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setSignupRequirement((current) => (current === option ? '' : option))
                if (option !== 'RSVP recommended' && option !== 'Registration required') {
                  setSignupLinkInfo('')
                }
              }}
              className={`pill-select ${signupRequirement === option ? 'pill-select-active' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
        {(signupRequirement === 'RSVP recommended' ||
          signupRequirement === 'Registration required') && (
          <label className="share-time-field mt-4 block">
            <span className="share-time-label">Where should families sign up?</span>
            <input
              value={signupLinkInfo}
              onChange={(e) => setSignupLinkInfo(e.target.value)}
              placeholder="Link to the sign-up page, RSVP link, or contact info."
              className="input-field"
            />
          </label>
        )}
      </fieldset>

      <div>
        <label className="mb-2 block font-semibold" htmlFor="share-description">
          9. What happens at the activity?{' '}
          <span className="font-normal text-muted">(Optional)</span>
        </label>
        <textarea
          id="share-description"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          rows={4}
          placeholder="e.g., A casual storytime with upbeat songs and simple crafts, or open-ended play with large LEGO blocks and sensory bins."
          className="input-field"
        />
        <p className="share-field-hint mt-2">
          A quick sentence or two so other parents know what to expect.
        </p>
      </div>

      <div>
        <label className="mb-2 block font-semibold" htmlFor="share-tips">
          10. Parent-to-parent insider tips{' '}
          <span className="font-normal text-muted">(Optional)</span>
        </label>
        <textarea
          id="share-tips"
          value={parentTips}
          onChange={(e) => setParentTips(e.target.value)}
          rows={4}
          placeholder="e.g., Tiny parking lot but plenty of street parking on Elm St. Bathrooms are close to the sandbox, and there’s great shade under the big oak tree until noon. Best for walkers!"
          className="input-field"
        />
        <p className="share-field-hint mt-2">
          The real logistics! Share the little details that make a trip smooth.
        </p>
      </div>

      <div>
        <label className="share-field-label mb-2 block" htmlFor="share-email">
          Email <span className="font-normal text-muted">(Optional)</span>
        </label>
        <input
          id="share-email"
          type="email"
          value={submittedByEmail}
          onChange={(e) => setSubmittedByEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="input-field"
        />
        <p className="share-field-hint mt-2">
          We&apos;ll only use this if we have a quick question about your event.
        </p>
      </div>
    </div>
  )
},
)
