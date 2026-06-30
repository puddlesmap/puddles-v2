export const IDEA_CHIPS = [
  { key: 'make_filters_easier', label: 'Make filters easier' },
  { key: 'child_exact_age', label: "Find events for my child's exact age" },
  { key: 'search_activities', label: 'Search for specific activities' },
  { key: 'add_neighborhood_or_city', label: 'Add my neighborhood or city' },
  { key: 'save_for_later', label: 'Save activities for later' },
  { key: 'other', label: 'Something else' },
] as const

export type IdeaChipKey = (typeof IDEA_CHIPS)[number]['key']

export interface IdeaFeedbackPayload {
  chips: IdeaChipKey[]
  detail: string | null
}

export function hasValidIdeaFeedback(chips: IdeaChipKey[], detail: string): boolean {
  const nonOther = chips.filter((c) => c !== 'other')
  if (nonOther.length > 0) return true
  if (detail.trim().length > 0) return true
  return false
}

interface IdeaFeedbackCardProps {
  selectedChips: IdeaChipKey[]
  onToggleChip: (key: IdeaChipKey) => void
  detail: string
  onDetailChange: (value: string) => void
  showHeadline?: boolean
}

export function IdeaFeedbackCard({
  selectedChips,
  onToggleChip,
  detail,
  onDetailChange,
  showHeadline = true,
}: IdeaFeedbackCardProps) {
  return (
    <div>
      {showHeadline && (
        <>
          <h2 className="font-display text-[26px] text-charcoal">
            Let&apos;s build Puddles together
          </h2>
          <p className="mt-2 text-[15px] text-muted">
            Tap what features or fixes would make your life easier.
          </p>
        </>
      )}

      <div
        role="group"
        aria-label="Suggestion options"
        className={`idea-chip-wrap ${showHeadline ? 'mt-6' : ''}`}
      >
        {IDEA_CHIPS.map(({ key, label }) => {
          const selected = selectedChips.includes(key)
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggleChip(key)}
              className={`pill-select ${selected ? 'pill-select-active' : ''}`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <label className="share-field-label mt-6 mb-2 block">
        Want to add more? <span className="font-normal text-muted">optional</span>
      </label>
      <textarea
        value={detail}
        onChange={(e) => onDetailChange(e.target.value)}
        rows={4}
        placeholder="Share any thoughts, wishes, or ideas."
        className="input-field resize-y"
      />
    </div>
  )
}
