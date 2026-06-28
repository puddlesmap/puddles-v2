export const HOME_PAGE_HEADLINE =
  'Find storytimes, music, drop-ins, and local moments for ages 0\u20135.'

export const HOME_EXPERIMENT_SUPPORTING_LINE =
  'Storytimes, parks, music, drop-ins, and small local moments for ages 0–5.'

export const HOME_EXPERIMENT_SOFT_SUPPORTING_LINE =
  'Storytimes, parks, music, drop-ins, and small local moments for 0-5.'

export const HOME_EXPERIMENT_ROTATION_MS = 3500

export const HOME_EXPERIMENT_ACCENTS = [
  {
    id: 'rain',
    src: '/home-experiment/rain.png',
    src2x: '/home-experiment/rain@2x.png',
    width: 111,
    height: 112,
  },
  {
    id: 'boots',
    src: '/home-experiment/boots.png',
    src2x: '/home-experiment/boots@2x.png',
    width: 100,
    height: 112,
  },
  {
    id: 'flower',
    src: '/home-experiment/flower.png',
    src2x: '/home-experiment/flower@2x.png',
    width: 112,
    height: 112,
  },
  {
    id: 'heart',
    src: '/home-experiment/heart.png',
    src2x: '/home-experiment/heart@2x.png',
    width: 108,
    height: 112,
  },
] as const

/** Static decorative set for the soft-accent home experiment. */
export const HOME_EXPERIMENT_SOFT_ACCENTS = HOME_EXPERIMENT_ACCENTS

export const HOME_EXPERIMENT_REFINED_SUPPORTING_LINE =
  'Storytimes, parks, music, drop-ins, free or low-cost local moments for ages 0–5.'

export const HOME_EXPERIMENT_REFINED_CTA_TITLE = 'Know a small local moment?'

export const HOME_EXPERIMENT_REFINED_CTA_BODY =
  'Share a storytime, playground, event, or parent-friendly tip.'
