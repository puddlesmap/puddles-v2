/** Intro under “Explore the guides” on the Holiday Magic seasonal hub. */
export const HOLIDAY_MAGIC_GUIDES_HEADING_DEK =
  'Handpicked ideas for little ones, from neighborhood favorites to special outings worth the trip.'

/** Per-guide hub tagline + sentence (also used as finder title / lede on guide pages). */
export const HOLIDAY_MAGIC_HUB_GUIDE_COPY = {
  'holiday-lights-traditions': {
    emoji: '✨',
    tagline: 'Find your kind of winter wonder',
    sentence:
      "From neighborhood lights to glowing gardens, we've picked festive outings with little ones in mind, including helpful details to make planning easier.",
  },
  'holiday-stories-play': {
    emoji: '🎭',
    tagline: 'A little holiday magic, their way',
    sentence:
      'From storytimes and performances to hands-on fun, discover playful holiday experiences for different ages and interests.',
  },
  'hello-new-year': {
    emoji: '🎉',
    tagline: 'Little ways to welcome the new year',
    sentence:
      'From family-friendly celebrations to cultural traditions, find meaningful and playful ways to welcome the new year together.',
  },
} as const

export type HolidayMagicHubGuideSlug = keyof typeof HOLIDAY_MAGIC_HUB_GUIDE_COPY

/** Finder section titles (Start Here). */
export const HOLIDAY_LIGHTS_FINDER_TITLE =
  HOLIDAY_MAGIC_HUB_GUIDE_COPY['holiday-lights-traditions'].tagline
export const HOLIDAY_STORIES_FINDER_TITLE =
  HOLIDAY_MAGIC_HUB_GUIDE_COPY['holiday-stories-play'].tagline
export const HELLO_NEW_YEAR_FINDER_TITLE =
  HOLIDAY_MAGIC_HUB_GUIDE_COPY['hello-new-year'].tagline

/** Finder ledes — sit beneath the finder title. */
export const HOLIDAY_LIGHTS_FINDER_LEDE =
  HOLIDAY_MAGIC_HUB_GUIDE_COPY['holiday-lights-traditions'].sentence
export const HOLIDAY_STORIES_FINDER_LEDE =
  HOLIDAY_MAGIC_HUB_GUIDE_COPY['holiday-stories-play'].sentence
export const HELLO_NEW_YEAR_FINDER_LEDE =
  HOLIDAY_MAGIC_HUB_GUIDE_COPY['hello-new-year'].sentence
