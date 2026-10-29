import type { ReactNode } from 'react'
import type { AdminEventEditableFields } from '../../types/adminEventEdit'
import type { EventStatus } from '../../types/event'
import { ACTIVITY_TYPES } from '../../types/event'
import { ageTagSelectOptions, formatPublicAgeRangeLabel } from '../../utils/ageRange'
import { browseCityBucket, browsePlacementLabel } from '../../utils/adminCatalogPlacement.mjs'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="admin-discovery-field">
      <span className="admin-discovery-field__label">{label}</span>
      {children}
    </label>
  )
}

const STATUS_OPTIONS: EventStatus[] = ['Published', 'Cancelled', 'Hidden', 'Draft']

interface AdminEventEditFormProps {
  draft: AdminEventEditableFields
  busy?: boolean
  onChange: (draft: AdminEventEditableFields) => void
  showStatus?: boolean
  twoColumn?: boolean
}

export function AdminEventEditForm({
  draft,
  busy = false,
  onChange,
  showStatus = true,
  twoColumn = false,
}: AdminEventEditFormProps) {
  function update<K extends keyof AdminEventEditableFields>(
    key: K,
    value: AdminEventEditableFields[K],
  ) {
    onChange({ ...draft, [key]: value })
  }

  function toggleType(type: string) {
    const has = draft.types.includes(type)
    onChange({
      ...draft,
      types: has ? draft.types.filter((t) => t !== type) : [...draft.types, type],
    })
  }

  const browseLabel = browsePlacementLabel(draft.city)
  const isCoreCity = browseCityBucket(draft.city) === 'core'
  const includeInSeasonal = draft.isSeasonal
  const worthADrive = draft.isRegional

  function setIncludeInSeasonal(checked: boolean) {
    onChange({
      ...draft,
      isSeasonal: checked,
      isRegional: checked && !isCoreCity ? draft.isRegional : false,
    })
  }

  function setWorthADrive(checked: boolean) {
    onChange({ ...draft, isRegional: checked, isSeasonal: checked ? true : draft.isSeasonal })
  }

  const coreFields = (
    <>
      {showStatus ? (
        <Field label="Status">
          <select
            className="admin-discovery-input"
            value={draft.status}
            onChange={(e) => update('status', e.target.value as EventStatus)}
            disabled={busy}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label="Title">
        <input
          className="admin-discovery-input"
          value={draft.title}
          onChange={(e) => update('title', e.target.value)}
          disabled={busy}
        />
      </Field>
      <div className="admin-discovery-form__row admin-discovery-form__row--2">
        <Field label="Start date">
          <input
            type="date"
            className="admin-discovery-input"
            value={draft.date}
            onChange={(e) => update('date', e.target.value)}
            disabled={busy}
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            className="admin-discovery-input"
            value={draft.closingDate}
            onChange={(e) => update('closingDate', e.target.value)}
            disabled={busy}
          />
        </Field>
      </div>
      <div className="admin-discovery-form__row admin-discovery-form__row--2">
        <Field label="Start time">
          <input
            type="time"
            className="admin-discovery-input"
            value={draft.startTime}
            onChange={(e) => update('startTime', e.target.value)}
            disabled={busy}
          />
        </Field>
        <Field label="End time">
          <input
            type="time"
            className="admin-discovery-input"
            value={draft.endTime}
            onChange={(e) => update('endTime', e.target.value)}
            disabled={busy}
          />
        </Field>
      </div>
      <p className="admin-discovery-fieldset__hint">
        End date is for multi-day festivals and seasonal runs. Leave blank for a single day, or when
        no closing date is listed.
      </p>
      <div className="admin-discovery-form__row">
        <Field label="Venue">
          <input
            className="admin-discovery-input"
            value={draft.venue}
            onChange={(e) => update('venue', e.target.value)}
            disabled={busy}
          />
        </Field>
        <Field label="Room">
          <input
            className="admin-discovery-input"
            value={draft.room}
            onChange={(e) => update('room', e.target.value)}
            disabled={busy}
          />
        </Field>
      </div>
      <Field label="Address">
        <input
          className="admin-discovery-input"
          value={draft.address}
          onChange={(e) => update('address', e.target.value)}
          disabled={busy}
        />
      </Field>
      <Field label="City">
        <input
          className="admin-discovery-input"
          value={draft.city}
          onChange={(e) => update('city', e.target.value)}
          disabled={busy}
        />
      </Field>
    </>
  )

  const restFields = (
    <>
      <div className="admin-discovery-form__row">
        <Field label="Ages">
          <select
            className="admin-discovery-input"
            value={formatPublicAgeRangeLabel(draft.ageRange)}
            onChange={(e) => update('ageRange', e.target.value)}
            disabled={busy}
          >
            {ageTagSelectOptions(draft.ageRange).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cost">
          <select
            className="admin-discovery-input"
            value={draft.cost}
            onChange={(e) => update('cost', e.target.value)}
            disabled={busy}
          >
            <option value="Free">Free</option>
            <option value="Low-cost">Low-cost</option>
            <option value="Paid">Paid</option>
          </select>
        </Field>
      </div>
      <Field label="Best for">
        <input
          className="admin-discovery-input"
          value={draft.bestFor ?? ''}
          placeholder="Only when the official source names an age or audience"
          onChange={(e) => update('bestFor', e.target.value)}
          disabled={busy}
        />
      </Field>
      <p className="admin-discovery-fieldset__hint">
        Parent-facing and optional. Leave blank when the official source does not name a specific age.
      </p>
      <Field label="Types">
        <div className="admin-discovery-types">
          {ACTIVITY_TYPES.map((type) => (
            <label key={type} className="admin-discovery-type">
              <input
                type="checkbox"
                checked={draft.types.includes(type)}
                onChange={() => toggleType(type)}
                disabled={busy}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </Field>
      <fieldset className="admin-discovery-fieldset">
        <legend className="admin-discovery-field__label">Catalog placement</legend>
        <p className="admin-discovery-fieldset__hint">
          <strong>{browseLabel}</strong> — core listings stay on Home &amp; Browse unless Hidden.
          Seasonal collection adds the holiday page; Worth a little drive hides from Browse
          (destinations outside core cities).
        </p>
        <div className="admin-discovery-types">
          <label className="admin-discovery-type">
            <input
              type="checkbox"
              checked={includeInSeasonal}
              onChange={(e) => setIncludeInSeasonal(e.target.checked)}
              disabled={busy}
            />
            <span>Include in seasonal collection</span>
          </label>
          {!isCoreCity && includeInSeasonal ? (
            <label className="admin-discovery-type">
              <input
                type="checkbox"
                checked={worthADrive}
                onChange={(e) => setWorthADrive(e.target.checked)}
                disabled={busy}
              />
              <span>Worth a little drive (hidden from Browse)</span>
            </label>
          ) : null}
        </div>
      </fieldset>
      <Field label="Description">
        <textarea
          className="admin-discovery-input admin-discovery-textarea"
          rows={4}
          value={draft.description}
          onChange={(e) => update('description', e.target.value)}
          disabled={busy}
        />
      </Field>
      <Field label="Before you go">
        <textarea
          className="admin-discovery-input admin-discovery-textarea"
          rows={3}
          value={draft.tips}
          onChange={(e) => update('tips', e.target.value)}
          disabled={busy}
          placeholder="Bring a blanket… registration notes…"
        />
      </Field>
      <Field label="Official URL">
        <input
          className="admin-discovery-input"
          value={draft.eventUrl}
          onChange={(e) => update('eventUrl', e.target.value)}
          disabled={busy}
        />
      </Field>
      <Field label="Image URL">
        <input
          className="admin-discovery-input"
          value={draft.imageUrl}
          onChange={(e) => update('imageUrl', e.target.value)}
          disabled={busy}
        />
      </Field>
      <Field label="Last checked">
        <p className="text-sm text-muted">
          Saving sets this to today. Parents see it after the header Publish.
        </p>
      </Field>
    </>
  )

  if (twoColumn) {
    return (
      <div className="admin-discovery-form admin-discovery-form--two-col">
        <div className="admin-discovery-form__col">{coreFields}</div>
        <div className="admin-discovery-form__col">{restFields}</div>
      </div>
    )
  }

  return (
    <div className="admin-discovery-form">
      {coreFields}
      {restFields}
    </div>
  )
}
