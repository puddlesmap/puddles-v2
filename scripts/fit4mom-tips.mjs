/** Good-to-know copy for FIT4MOM weekly Parent & Me classes. */

export const FIT4MOM_WEEKLY_SCHEDULE_LINE =
  'Weekly classes — check the official schedule for current times.'

const RAIN_BY_VENUE = {
  'Cuesta Park': "Rainy day: Meet under the overhang at St. Timothy’s, 2094 Grant Rd.",
  'Mitchell Park':
    "Rainy day: Meet under the overhang by Mitchell Park Library / Ada's Cafe.",
  'Las Palmas Park':
    'Rainy day: Pre-enroll on sunnyvale.fit4mom.com for weather emails with the alternate meet-up spot.',
}

function extrasFor(title, venue) {
  const normalized = String(title || '').toLowerCase()

  if (normalized.includes('family strides')) {
    return ['Saturdays: meet near the playgroup gazebo.']
  }

  if (venue === 'Mitchell Park' && normalized.includes('stroller barre')) {
    return ['Meet at the multipurpose bowl.']
  }

  if (normalized.includes('mommy') && normalized.includes('yoga')) {
    return ['Bring a yoga mat or blanket.']
  }

  return []
}

export function buildFit4momGoodToKnow({ title, venue }) {
  const rain = RAIN_BY_VENUE[venue]
  return [FIT4MOM_WEEKLY_SCHEDULE_LINE, rain, ...extrasFor(title, venue)]
    .filter(Boolean)
    .join('\n')
}

export function buildFit4momSeriesGoodToKnow({ title, venue, dayLabel }) {
  const seriesLine = `Weekly · ${dayLabel} at ${venue}. One series row — not separate weekly events.`
  return [seriesLine, buildFit4momGoodToKnow({ title, venue })].join('\n')
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
