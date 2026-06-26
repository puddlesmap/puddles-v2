export const ABOUT_EYEBROW = 'About'

export const ABOUT_BRAND_NAME = 'Puddles'
export const ABOUT_BRAND_TAG = ' the tot map'

export const ABOUT_TAGLINE = 'It takes a village — here\u2019s where to find it.'

export const ABOUT_MISSION_SUPPORT =
  'Puddles is a small map for easy, nearby family moments.'

export const ABOUT_LEAD_LINES = [
  'Puddles started with a simple question:',
  'What can we do today, without planning too much?',
] as const

export const ABOUT_NARRATIVE_OPEN =
  'As parents, we\u2019re often looking for small things\u2014'
export const ABOUT_NARRATIVE_MIDDLE = 'a storytime,'
export const ABOUT_NARRATIVE_AFTER_MUSIC =
  'a music session, or a place to go right after nap time.'
export const ABOUT_NARRATIVE_CLOSE =
  ' But those moments are often scattered, hard to find, or incredibly easy to miss. So we made a simple map for small, nearby moments.'

/** @deprecated Use AboutIntroNarrative for responsive line breaks. */
export const ABOUT_NARRATIVE = [
  `${ABOUT_NARRATIVE_OPEN}${ABOUT_NARRATIVE_MIDDLE} ${ABOUT_NARRATIVE_AFTER_MUSIC}${ABOUT_NARRATIVE_CLOSE}`,
] as const

export const ABOUT_PILLARS = [
  {
    title: 'Made for today',
    copy: 'Small outings that fit between naps, meals, and everything else.',
  },
  {
    title: 'Low commitment',
    copy: 'Free, low-cost, drop-in, or trial-friendly activities.',
  },
  {
    title: 'Close to home',
    copy: 'Storytimes, music, playgrounds, parks, and community events.',
  },
] as const

export const ABOUT_COMMUNITY_TITLE = 'We\u2019re just getting started'

export const ABOUT_COMMUNITY_PARAS = [
  'Puddles is beginning with a few nearby cities and the kinds of places families already love: libraries, parks, community centers, and small local gatherings.',
  'We\u2019re starting simple, and we\u2019ll keep adding and improving based on what families share with us.',
  'Know a good storytime, a free event, a playground worth sharing, or a parent-friendly local tip? We\u2019d love for you to share it with us.',
  'Puddles isn\u2019t meant to be a big platform built far away from families.',
] as const

export const ABOUT_CTA_TITLE = 'Know a small local moment?'
export const ABOUT_CTA_BODY =
  'Share a storytime, playground, event, or parent-friendly tip.'

export const ABOUT_HERO_ART = {
  src: '/about/hero.png',
  src2x: '/about/hero@2x.png',
  width: 448,
  height: 277,
  displayWidth: 335,
} as const

/** Legacy home experiment CTA copy */
export const ABOUT_SHARE_CTA_BODY =
  'Puddles is just getting started! If you know a great storytime, music circle, or drop-in spot, share it to help grow the map for other families.'
