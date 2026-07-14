export const ABOUT_BRAND_NAME = 'Puddles'
export const ABOUT_BRAND_TAG = ' the tot map'

export const ABOUT_TAGLINE = 'It takes a village — here\u2019s where to find it.'

export const ABOUT_LEAD_LINES = [
  `${ABOUT_BRAND_NAME}${ABOUT_BRAND_TAG} started with a simple question:`,
  'What can we do today, without planning too much?',
] as const

export const ABOUT_INTRO_NARRATIVE = [
  'As parents, we\u2019re often looking for small things\u2014a storytime, a music session, a drop-in activity, or something easy to do after nap time. But those moments are often scattered, hard to find, or incredibly easy to miss.',
  'So we made a simple map for small, nearby moments with little ones.',
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
    copy: 'Simple neighborhood activities just a few minutes away.',
  },
] as const

export const ABOUT_COMMUNITY_TITLE = 'We\u2019re just getting started'

export const ABOUT_COMMUNITY_PARAS = [
  'Puddles is beginning with a few nearby cities and the kinds of places families already look to: libraries, community centers, local programs, and small neighborhood gatherings.',
  'We\u2019re starting simple, and we\u2019ll keep adding and improving based on what families share with us.',
  'Know a good storytime, drop-in activity, free event, or parent-friendly local tip? We\u2019d love for you to share it with us.',
  'Puddles isn\u2019t meant to be a big platform built far away from families. It\u2019s a small map that grows with the people who use it.',
] as const

export const ABOUT_CTA_TITLE = 'Know a small local moment?'
export const ABOUT_CTA_BODY =
  'Share a storytime, a parent-friendly tip, or an idea for Puddles.'

export const ABOUT_HERO_ART = {
  src: '/about/hero.png?v=5',
  src2x: '/about/hero@2x.png?v=5',
  width: 501,
  height: 386,
  displayWidth: 335,
} as const

/** Legacy home experiment CTA copy */
export const ABOUT_SHARE_CTA_BODY =
  'Puddles is just getting started! If you know a great storytime, music circle, or drop-in spot, share it to help grow the map for other families.'
