/** Good-to-know copy for FIT4MOM weekly Parent & Me classes.
 * Source of truth: https://sunnyvale.fit4mom.com/our-workouts + /faqs
 */

const SCHEDULE_LINE = 'Check the official schedule for current class times.'

const CUESTA_RAIN = "Rainy day: Meet under the overhang at St. Timothy’s, 2094 Grant Rd."
const MITCHELL_RAIN =
  "Rainy day: Meet under the overhang by Mitchell Park Library / Ada's Cafe."

/** Stroller Strides / Barre / Family Strides — official: stroller-aged kids; carrier OK. */
const STROLLER_CLASS_WHO =
  'Stroller-aged little ones come along — in a stroller or baby carrier.'

function weeklyGoodToKnow({ dayLabel, venue, rainyDayLine, extraLines = [] }) {
  return [
    STROLLER_CLASS_WHO,
    `Weekly · ${dayLabel} at ${venue}.`,
    SCHEDULE_LINE,
    rainyDayLine,
    ...extraLines,
  ]
    .filter(Boolean)
    .join('\n')
}

function lasPalmasGoodToKnow({ dayLabel, extraLines = [] }) {
  return [
    `Weekly · ${dayLabel} at Las Palmas Park.`,
    'Pre-enroll for schedule updates and rainy-day location changes.',
    ...extraLines,
  ]
    .filter(Boolean)
    .join('\n')
}

/** Las Palmas Mommy & Baby — schedule lives in description, not Good to know. */
export const FIT4MOM_LAS_PALMAS_MOMMY_BABY_YOGA = {
  description:
    'Outdoor caregiver & baby yoga at Las Palmas Park, with gentle poses for grown-ups and little ones together. Check the official schedule for current class times.',
  tips: lasPalmasGoodToKnow({
    dayLabel: 'Tuesdays',
    extraLines: ['Bring a yoga mat or blanket.'],
  }),
}

/** Canonical description + Good to know for FIT4MOM series rows in Events. */
export const FIT4MOM_SERIES_COPY = {
  'watchlist-fit4mom-stroller-strides-laspalmas-series': {
    description:
      'Stroller workout for caregivers with baby in tow — cardio & strength at Las Palmas Park.',
    tips: [
      STROLLER_CLASS_WHO,
      'Weekly · Tuesdays at Las Palmas Park.',
      SCHEDULE_LINE,
      'Pre-enroll for schedule updates and rainy-day location changes.',
    ].join('\n'),
  },
  'watchlist-fit4mom-mommy-baby-yoga-laspalmas-series': FIT4MOM_LAS_PALMAS_MOMMY_BABY_YOGA,
  'watchlist-fit4mom-stroller-strides-cuesta-series': {
    description:
      'Stroller workout for caregivers with baby in tow — cardio & strength at Cuesta Park.',
    tips: weeklyGoodToKnow({
      dayLabel: 'Mondays & Fridays',
      venue: 'Cuesta Park',
      rainyDayLine: CUESTA_RAIN,
    }),
  },
  'watchlist-fit4mom-stroller-barre-cuesta-series': {
    description:
      'Barre-style workout for caregivers with little ones in strollers at Cuesta Park.',
    tips: weeklyGoodToKnow({
      dayLabel: 'Wednesdays',
      venue: 'Cuesta Park',
      rainyDayLine: CUESTA_RAIN,
    }),
  },
  'watchlist-fit4mom-fourth-trimester-cuesta-series': {
    description: 'Postpartum movement class for caregivers, with babies welcome.',
    tips: [
      'Weekly · Wednesdays at Cuesta Park.',
      SCHEDULE_LINE,
      CUESTA_RAIN,
    ].join('\n'),
  },
  'watchlist-fit4mom-family-strides-cuesta-series': {
    description:
      'Family stroller fitness for caregivers with kids along — workout at Cuesta Park.',
    tips: weeklyGoodToKnow({
      dayLabel: 'Saturdays',
      venue: 'Cuesta Park',
      rainyDayLine: CUESTA_RAIN,
    }),
  },
  'watchlist-fit4mom-stroller-barre-mitchell-series': {
    description:
      'Stroller Barre workout for caregivers with child in stroller at Mitchell Park.',
    tips: weeklyGoodToKnow({
      dayLabel: 'Thursdays',
      venue: 'Mitchell Park',
      rainyDayLine: MITCHELL_RAIN,
    }),
  },
}

const TITLE_TO_SERIES_ID = [
  [/stroller strides.*cuesta/i, 'watchlist-fit4mom-stroller-strides-cuesta-series'],
  [/stroller barre.*cuesta/i, 'watchlist-fit4mom-stroller-barre-cuesta-series'],
  [/fourth trimester.*cuesta/i, 'watchlist-fit4mom-fourth-trimester-cuesta-series'],
  [/family strides.*cuesta/i, 'watchlist-fit4mom-family-strides-cuesta-series'],
  [/stroller barre.*mitchell/i, 'watchlist-fit4mom-stroller-barre-mitchell-series'],
  [/stroller strides.*las palmas/i, 'watchlist-fit4mom-stroller-strides-laspalmas-series'],
  [/mommy.*baby yoga.*las palmas/i, 'watchlist-fit4mom-mommy-baby-yoga-laspalmas-series'],
]

export function resolveFit4momSeriesId(title) {
  const hay = String(title || '')
  for (const [pattern, seriesId] of TITLE_TO_SERIES_ID) {
    if (pattern.test(hay)) return seriesId
  }
  return null
}

/** Discovery queue rows — same copy as series. */
export function buildFit4momDiscoveryCopy(candidate) {
  const seriesId = resolveFit4momSeriesId(candidate.title)
  if (seriesId && FIT4MOM_SERIES_COPY[seriesId]) {
    return FIT4MOM_SERIES_COPY[seriesId]
  }
  return {
    description: String(candidate.description || '').split('\n')[0].trim(),
    tips: weeklyGoodToKnow({
      dayLabel: 'see schedule',
      venue: candidate.venue || 'Cuesta Park',
      rainyDayLine: CUESTA_RAIN,
    }),
  }
}

/** @deprecated Use FIT4MOM_SERIES_COPY or buildFit4momDiscoveryCopy. */
export function buildFit4momGoodToKnow({ title, venue }) {
  return buildFit4momDiscoveryCopy({ title, venue, description: '' }).tips
}

/** Marti Foster + other weekly outdoor Parent & Me series. */
export function buildMartiGoodToKnow() {
  return [
    'Weekly classes — check martifosteryoga.com for current times.',
    'Rainy day: Outdoor class — contact Marti if rain is likely.',
    'Bring a large blanket, yoga mat, long scarf, baby carrier, and water.',
    'Limited to about 8 moms with babies — register ahead.',
  ].join('\n')
}

export function buildSunnyvaleLibrarySeriesGoodToKnow(dayLabel) {
  return [
    'Weekly classes — check the library events calendar for current times and holiday closures.',
    `Meets ${dayLabel.toLowerCase()}.`,
  ].join('\n')
}
