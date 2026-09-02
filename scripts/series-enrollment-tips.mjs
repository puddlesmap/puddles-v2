/** Good-to-know copy for semester / multi-section enrollment series. */

export const SERIES_AVAILABILITY_LINE =
  'Some sections may fill or move to waitlist — check the official registration page for current availability.'

export const MUSIC_TOGETHER_FALL_2026 = {
  description:
    '10-week caregiver + child music series for babies through preschoolers and their grown-ups. Fall classes begin Sep 9 or Sep 14, depending on section, and run through Nov 18 at Unity Church. Multiple class times are offered each week.',
  tips: [
    'For babies through preschoolers with a grown-up.',
    'Weekly · registration required · semester package, not drop-in.',
    'Multiple Mon, Wed & Fri class times available.',
    SERIES_AVAILABILITY_LINE,
    'Free demo class available before enrolling.',
  ].join('\n'),
  /** Editorial only — do not show on the public site. */
  seriesNote: '10-week fall semester · one series row (not weekly duplicates).',
}

/** Strip volatile seat/waitlist lines from tips (discovery scrape cleanup). */
export function stripVolatileSeatAvailability(tips) {
  if (!tips) return tips
  return String(tips)
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return false
      if (/^open seats as of\b/i.test(trimmed)) return false
      if (/\bwaitlist:\s/i.test(trimmed)) return false
      if (/\b\d{1,2}:\d{2}\b.*\bwaitlist\b/i.test(trimmed)) return false
      return true
    })
    .join('\n')
}
