import type { ReactNode } from 'react'
import type { AdminEventEditableFields } from '../../types/adminEventEdit'
import type { EventStatus } from '../../types/event'
import { ACTIVITY_TYPES } from '../../types/event'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="admin-discovery-field">
      <span className="admin-discovery-field__label">{label}</span>
      {children}
    </label>
  )
}

const STATUS_OPTIONS: EventStatus[] = ['Published', 'Hidden', 'Draft']

interface AdminEventEditFormProps {
  draft: AdminEventEditableFields
  busy?: boolean
  onChange: (draft: AdminEventEditableFields) => void
  showStatus?: boolean
}

export function AdminEventEditForm({
  draft,
  busy = false,
  onChange,
  showStatus = true,
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

  return (
    <div className="admin-discovery-form">
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
      <div className="admin-discovery-form__row">
        <Field label="Date">
          <input
            type="date"
            className="admin-discovery-input"
            value={draft.date}
            onChange={(e) => update('date', e.target.value)}
            disabled={busy}
          />
        </Field>
        <Field label="Start">
          <input
            type="time"
            className="admin-discovery-input"
            value={draft.startTime}
            onChange={(e) => update('startTime', e.target.value)}
            disabled={busy}
          />
        </Field>
        <Field label="End">
          <input
            type="time"
            className="admin-discovery-input"
            value={draft.endTime}
            onChange={(e) => update('endTime', e.target.value)}
            disabled={busy}
          />
        </Field>
      </div>
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
      <div className="admin-discovery-form__row">
        <Field label="City">
          <input
            className="admin-discovery-input"
            value={draft.city}
            onChange={(e) => update('city', e.target.value)}
            disabled={busy}
          />
        </Field>
        <Field label="Ages">
          <input
            className="admin-discovery-input"
            value={draft.ageRange}
            onChange={(e) => update('ageRange', e.target.value)}
            disabled={busy}
            placeholder="0–2, 2–5"
          />
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
      <Field label="Description">
        <textarea
          className="admin-discovery-input admin-discovery-textarea"
          rows={4}
          value={draft.description}
          onChange={(e) => update('description', e.target.value)}
          disabled={busy}
        />
      </Field>
      <Field label="Good to know (tips)">
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
      <Field label="Approved on">
        <input
          type="date"
          className="admin-discovery-input"
          value={draft.lastChecked}
          onChange={(e) => update('lastChecked', e.target.value)}
          disabled={busy}
        />
      </Field>
    </div>
  )
}
