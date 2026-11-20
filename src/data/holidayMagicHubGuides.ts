/** Intro under “Explore the guides” on the Holiday Magic seasonal hub. */
export const HOLIDAY_MAGIC_GUIDES_HEADING_DEK =
  'Handpicked ideas for little ones, from neighborhood favorites to special outings worth the trip.'

/**
 * Per-guide hub card copy: title emoji + one short description.
 * Finder section titles stay separate (Start Here on guide pages).
 */
export const HOLIDAY_MAGIC_HUB_GUIDE_COPY = {
  'holiday-lights-traditions': {
    emoji: '✨',
    sentence:
      'Explore neighborhood light walks, festive parades, Santa visits, and holiday trains, with helpful tips for planning with little ones.',
  },
  'holiday-stories-play': {
    emoji: '🎭',
    sentence:
      'Discover first theater shows, holiday crafts, and hands-on winter play, with age and timing details to help you choose.',
  },
  'hello-new-year': {
    emoji: '🎉',
    sentence:
      'Find daytime countdowns, balloon drops, and January traditions to welcome the new year together.',
  },
} as const

export type HolidayMagicHubGuideSlug = keyof typeof HOLIDAY_MAGIC_HUB_GUIDE_COPY

/** Finder section titles (Start Here). */
export const HOLIDAY_LIGHTS_FINDER_TITLE = 'Find your kind of winter wonder'
export const HOLIDAY_STORIES_FINDER_TITLE = 'A little holiday magic, their way'
export const HELLO_NEW_YEAR_FINDER_TITLE = 'Little ways to welcome the new year'

/** Finder ledes — sit beneath the finder title. */
export const HOLIDAY_LIGHTS_FINDER_LEDE =
  HOLIDAY_MAGIC_HUB_GUIDE_COPY['holiday-lights-traditions'].sentence
export const HOLIDAY_STORIES_FINDER_LEDE =
  HOLIDAY_MAGIC_HUB_GUIDE_COPY['holiday-stories-play'].sentence
export const HELLO_NEW_YEAR_FINDER_LEDE =
  HOLIDAY_MAGIC_HUB_GUIDE_COPY['hello-new-year'].sentence
