import fs from 'node:fs'
import path from 'node:path'
import { TIME_ZONE } from '../../src/utils/socialStudioCore.mjs'
import { readState, saveAsset, writeState } from './social-studio-store.mjs'

const ROOT = process.cwd()

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8').trim()
}

async function slide(relativePath) {
  const bytes = fs.readFileSync(path.join(ROOT, relativePath))
  return saveAsset(bytes, 'png')
}

async function slides(directory, count) {
  const saved = []
  for (let index = 0; index < count; index += 1) {
    const name = fs.readdirSync(path.join(ROOT, directory)).find((file) => file.startsWith(String(index + 1).padStart(2, '0')))
    if (!name) throw new Error(`Missing slide ${index + 1} in ${directory}`)
    saved.push(await slide(path.join(directory, name)))
  }
  return saved
}

async function namedSlides(directory, names) {
  const saved = []
  for (const name of names) {
    saved.push(await slide(path.join(directory, name)))
  }
  return saved
}

function item(fields) {
  return {
    status: 'draft',
    caption: '',
    slides: [],
    eventRefs: [],
    storyMode: null,
    scheduleLocal: { date: fields.date, time: fields.time, timeZone: TIME_ZONE },
    publishAtUtc: null,
    approved: null,
    instagramMediaId: null,
    lastError: null,
    ...fields,
  }
}

// Starting Friday, Oct 16, 2026, the next weekend pack is created here as drafts.
// The first pack that cadence produces is the Oct 17–18 weekend.
// Copy into the weekly folder only when an item is approved. Do not auto-post.
const CALENDAR_VERSION = '2026-10-09-review'
const RETIRED_IDS = new Set(['halloween-this-weekend-carousel', 'halloween-this-weekend-story'])
const REPLACE_CONTENT = new Set([
  'xhs-halloween-part-1',
  'xhs-halloween-part-2',
  'halloween-part-1-carousel',
  'halloween-part-2-carousel',
  'halloween-part-1-story',
  'halloween-today-story',
  'halloween-midweek-story',
  'halloween-day-story',
])

const PACKS = [
  { id: 'halloween-2026', title: 'Halloween 2026', kind: 'seasonal' },
  { id: 'week-2026-10-08', title: 'Week of Oct 8', kind: 'weekly' },
  { id: 'week-2026-10-12', title: 'Week of Oct 12', kind: 'weekly' },
  { id: 'week-2026-10-19', title: 'Week of Oct 19', kind: 'weekly' },
  { id: 'week-2026-10-26', title: 'Week of Oct 26', kind: 'weekly' },
]

function storyCaption(hook, eventIds = []) {
  const lines = [hook, '', 'Manual', 'Link sticker: https://puddlesmap.com']
  if (eventIds.length) lines.push('', 'Events:', ...eventIds.map((id) => `- ${id}`))
  return lines.join('\n')
}

function calendarItems({
  part1Slides = [],
  part1XhsSlides = [],
  part2Slides = [],
  part2XhsSlides = [],
  part1Caption = '',
  part1XhsCaption = '',
  part2Caption = '',
  part2XhsCaption = '',
  weekendSlides = [],
  weekendStories = [],
  weekendSaturday = [],
  weekendSunday = [],
  weekendCaption = '',
  weekendXhsCaption = '',
  weekendXhsSlides = [],
  weekdaySlides = [],
  weekdayXhsSlides = [],
  weekdayStories = [],
  part1StorySlides = [],
  part2TodaySlides = [],
  part2MidweekSlides = [],
  part2DaySlides = [],
  oct17Slides = [],
  oct17Stories = [],
  oct17Friday = [],
  oct17Saturday = [],
  oct17Sunday = [],
  oct17Caption = '',
  oct17XhsCaption = '',
  oct17XhsSlides = [],
} = {}) {
  return [
    item({
      id: 'week-1008-weekend-carousel',
      packId: 'week-2026-10-08',
      lane: 'weekend',
      title: 'Weekend Highlights',
      format: 'carousel',
      date: '2026-10-08',
      time: '12:00',
      caption: weekendCaption,
      slides: weekendSlides,
    }),
    item({
      id: 'week-1008-planning-story',
      packId: 'week-2026-10-08',
      lane: 'weekend',
      title: 'Planning the Weekend?',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-08',
      time: '16:00',
      slides: weekendStories,
    }),
    item({
      id: 'xhs-weekend-1008',
      packId: 'week-2026-10-08',
      lane: 'weekend',
      title: '灣區週末親子活動',
      format: 'xiaohongshu',
      storyMode: 'manual',
      date: '2026-10-08',
      time: '19:00',
      caption: weekendXhsCaption,
      slides: weekendXhsSlides,
    }),
    item({
      id: 'xhs-halloween-part-1',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: 'Halloween Part 1 · Oct 10–17',
      format: 'xiaohongshu',
      storyMode: 'manual',
      date: '2026-10-09',
      time: '12:00',
      caption: part1XhsCaption,
      slides: part1XhsSlides,
    }),
    item({
      id: 'halloween-part-1-carousel',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: 'Halloween Part 1 · Oct 10–17',
      format: 'carousel',
      date: '2026-10-09',
      time: '19:00',
      caption: part1Caption,
      slides: part1Slides,
      eventRefs: [
        { id: 'disc-creepy-carrots-peninsula-youth-theatre-2026-10-10-watchlist-pyt-creepy-carrots-2026-10-10-', date: '2026-10-10' },
        { id: 'otto-family-club-spider-web-sensory-2026-10-10', date: '2026-10-10' },
        { id: 'disc-deer-hollow-spooky-storytime-2026-10-16-16984474', date: '2026-10-16' },
        { id: 'spooky-times-at-deer-holloween-farm-deer-hollow-farm-2026-10-17-10-00', date: '2026-10-17' },
        { id: 'watchlist-sunnyvale-hands-on-the-arts-2026-10-17', date: '2026-10-17' },
      ],
    }),
    item({
      id: 'halloween-part-1-story',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: 'Halloween Part 1 · Reminder',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-13',
      time: '12:00',
      caption: storyCaption('Still looking for Halloween fun?', [
        'disc-deer-hollow-spooky-storytime-2026-10-16-16984474',
        'watchlist-sunnyvale-hands-on-the-arts-2026-10-17',
        'spooky-times-at-deer-holloween-farm-deer-hollow-farm-2026-10-17-10-00',
      ]),
      slides: part1StorySlides,
    }),
    item({
      id: 'week-1010-today-story',
      packId: 'week-2026-10-08',
      lane: 'weekend',
      title: "Today's Picks",
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-10',
      time: '08:30',
      slides: weekendSaturday,
    }),
    item({
      id: 'week-1011-sunday-story',
      packId: 'week-2026-10-08',
      lane: 'weekend',
      title: 'Sunday Outings',
      format: 'story',
      storyMode: 'manual',
      optional: true,
      date: '2026-10-11',
      time: '08:30',
      slides: weekendSunday,
    }),
    item({
      id: 'week-1012-weekday-carousel',
      packId: 'week-2026-10-12',
      lane: 'weekday',
      title: 'Weekday Highlights · This Week with Little Ones',
      format: 'carousel',
      date: '2026-10-11',
      time: '19:00',
      slides: weekdaySlides,
    }),
    item({
      id: 'xhs-weekday-1012',
      packId: 'week-2026-10-12',
      lane: 'weekday',
      title: '灣區週間親子活動',
      format: 'xiaohongshu',
      storyMode: 'manual',
      date: '2026-10-11',
      time: '20:00',
      slides: weekdayXhsSlides,
    }),
    item({
      id: 'week-1012-weekday-story',
      packId: 'week-2026-10-12',
      lane: 'weekday',
      title: 'This Week with Little Ones · Reminder',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-12',
      time: '09:00',
      slides: weekdayStories,
    }),
    item({
      id: 'week-1014-topical-story',
      packId: 'week-2026-10-12',
      lane: 'weekday',
      title: "Today's Picks / Topical Spotlight",
      format: 'story',
      storyMode: 'manual',
      optional: true,
      date: '2026-10-14',
      time: '08:30',
    }),
    item({
      id: 'week-1015-weekend-carousel',
      packId: 'week-2026-10-12',
      lane: 'weekend',
      title: 'Weekend Highlights',
      format: 'carousel',
      date: '2026-10-15',
      time: '12:00',
      caption: oct17Caption,
      slides: oct17Slides,
    }),
    item({
      id: 'week-1015-planning-story',
      packId: 'week-2026-10-12',
      lane: 'weekend',
      title: 'Planning the Weekend?',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-15',
      time: '16:00',
      slides: oct17Stories,
    }),
    item({
      id: 'xhs-weekend-1015',
      packId: 'week-2026-10-12',
      lane: 'weekend',
      title: '灣區週末親子活動',
      format: 'xiaohongshu',
      storyMode: 'manual',
      date: '2026-10-15',
      time: '19:00',
      caption: oct17XhsCaption,
      slides: oct17XhsSlides,
    }),
    item({
      id: 'week-1016-reminder-story',
      packId: 'week-2026-10-12',
      lane: 'weekend',
      title: 'Still Figuring Out the Weekend?',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-16',
      time: '19:00',
      slides: oct17Friday,
    }),
    item({
      id: 'week-1017-today-story',
      packId: 'week-2026-10-12',
      lane: 'weekend',
      title: "Today's Picks",
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-17',
      time: '08:30',
      slides: oct17Saturday,
    }),
    item({
      id: 'week-1018-sunday-story',
      packId: 'week-2026-10-12',
      lane: 'weekend',
      title: 'Sunday Outings',
      format: 'story',
      storyMode: 'manual',
      optional: true,
      date: '2026-10-18',
      time: '08:30',
      slides: oct17Sunday,
    }),
    item({
      id: 'week-weekday-carousel',
      packId: 'week-2026-10-19',
      lane: 'weekday',
      title: 'Weekday Highlights · This Week with Little Ones',
      format: 'carousel',
      date: '2026-10-18',
      time: '19:00',
    }),
    item({
      id: 'xhs-weekday',
      packId: 'week-2026-10-19',
      lane: 'weekday',
      title: '灣區週間親子活動',
      format: 'xiaohongshu',
      storyMode: 'manual',
      date: '2026-10-18',
      time: '20:00',
    }),
    item({
      id: 'week-weekday-story',
      packId: 'week-2026-10-19',
      lane: 'weekday',
      title: 'This Week with Little Ones · Reminder',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-19',
      time: '09:00',
    }),
    item({
      id: 'halloween-part-2-carousel',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: 'Halloween Part 2 · Oct 24–31',
      format: 'carousel',
      date: '2026-10-20',
      time: '19:00',
      caption: part2Caption,
      slides: part2Slides,
      eventRefs: [
        { id: 'monster-bash-rengstorff-park-2026-10-24-10-00', date: '2026-10-24' },
        { id: 'family-fun-days-los-altos-community-center-2026-10-24-10-00', date: '2026-10-24' },
        { id: 'disc-jack-o-lantern-jamboree-2026-10-28-698e5b7094297d3600abe212', date: '2026-10-28' },
        { id: 'watchlist-sunnyvale-spooky-storywalk-2026-10-28', date: '2026-10-28' },
        { id: 'disc-a-boo-tiful-downtown-halloween-2026-10-30-watchlist-dtla-halloween-2026-10-30', date: '2026-10-30' },
      ],
    }),
    item({
      id: 'halloween-part-2-share-story',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: 'Halloween Part 2 · Share to Story',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-20',
      time: '19:15',
      caption: [
        'More Halloween plans for little ones!',
        'Costumes, parades & trick-or-treat. Tap to explore!',
        '',
        'Manual',
        'After the Halloween Part 2 carousel is published, share that post to Story in the Instagram app.',
        'No separate image.',
        'Link sticker: https://puddlesmap.com',
      ].join('\n'),
    }),
    item({
      id: 'week-topical-story',
      packId: 'week-2026-10-19',
      lane: 'weekday',
      title: "Today's Picks / Topical Spotlight",
      format: 'story',
      storyMode: 'manual',
      optional: true,
      date: '2026-10-21',
      time: '08:30',
    }),
    item({
      id: 'xhs-halloween-part-2',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: 'Halloween Part 2 · Oct 24–31',
      format: 'xiaohongshu',
      storyMode: 'manual',
      date: '2026-10-21',
      time: '19:00',
      caption: part2XhsCaption,
      slides: part2XhsSlides,
    }),
    item({
      id: 'week-weekend-carousel',
      packId: 'week-2026-10-19',
      lane: 'weekend',
      title: 'Weekend Highlights',
      format: 'carousel',
      date: '2026-10-22',
      time: '12:00',
    }),
    item({
      id: 'week-planning-story',
      packId: 'week-2026-10-19',
      lane: 'weekend',
      title: 'Planning the Weekend?',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-22',
      time: '16:00',
    }),
    item({
      id: 'xhs-weekend',
      packId: 'week-2026-10-19',
      lane: 'weekend',
      title: '灣區週末親子活動',
      format: 'xiaohongshu',
      storyMode: 'manual',
      date: '2026-10-22',
      time: '19:00',
    }),
    item({
      id: 'week-reminder-story',
      packId: 'week-2026-10-19',
      lane: 'weekend',
      title: 'Still Figuring Out the Weekend?',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-23',
      time: '19:00',
    }),
    item({
      id: 'halloween-today-story',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: "Today's Halloween Picks",
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-24',
      time: '08:30',
      caption: storyCaption('Halloween plans for today?', [
        'monster-bash-rengstorff-park-2026-10-24-10-00',
        'family-fun-days-los-altos-community-center-2026-10-24-10-00',
      ]),
      slides: part2TodaySlides,
    }),
    item({
      id: 'week-sunday-story',
      packId: 'week-2026-10-19',
      lane: 'weekend',
      title: 'Sunday Outings',
      format: 'story',
      storyMode: 'manual',
      optional: true,
      date: '2026-10-25',
      time: '08:30',
    }),
    item({
      id: 'halloween-midweek-story',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: 'Midweek Halloween Activities',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-28',
      time: '12:00',
      caption: storyCaption('Halloween is almost here!', [
        'disc-jack-o-lantern-jamboree-2026-10-28-698e5b7094297d3600abe212',
        'watchlist-sunnyvale-spooky-storywalk-2026-10-28',
        'disc-a-boo-tiful-downtown-halloween-2026-10-30-watchlist-dtla-halloween-2026-10-30',
      ]),
      slides: part2MidweekSlides,
    }),
    item({
      id: 'halloween-weekend-post',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: 'Halloween Weekend Highlights · Oct 31–Nov 1',
      format: 'carousel',
      date: '2026-10-29',
      time: '12:00',
    }),
    item({
      id: 'halloween-day-story',
      packId: 'halloween-2026',
      lane: 'seasonal',
      title: 'Halloween Day Picks',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-31',
      time: '08:30',
      caption: storyCaption('Happy Halloween! Need a plan?'),
      slides: part2DaySlides,
    }),
    item({
      id: 'week-1025-weekday-carousel',
      packId: 'week-2026-10-26',
      lane: 'weekday',
      title: 'Weekday Highlights · This Week with Little Ones',
      format: 'carousel',
      date: '2026-10-25',
      time: '19:00',
    }),
    item({
      id: 'xhs-weekday-1025',
      packId: 'week-2026-10-26',
      lane: 'weekday',
      title: '灣區週間親子活動',
      format: 'xiaohongshu',
      storyMode: 'manual',
      date: '2026-10-25',
      time: '20:00',
    }),
    item({
      id: 'week-1026-weekday-story',
      packId: 'week-2026-10-26',
      lane: 'weekday',
      title: 'This Week with Little Ones · Reminder',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-26',
      time: '09:00',
    }),
    item({
      id: 'week-1028-topical-story',
      packId: 'week-2026-10-26',
      lane: 'weekday',
      title: "Today's Picks / Topical Spotlight",
      format: 'story',
      storyMode: 'manual',
      optional: true,
      date: '2026-10-28',
      time: '08:30',
    }),
    item({
      id: 'week-1029-planning-story',
      packId: 'week-2026-10-26',
      lane: 'weekend',
      title: 'Planning the Weekend?',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-29',
      time: '16:00',
    }),
    item({
      id: 'xhs-weekend-1029',
      packId: 'week-2026-10-26',
      lane: 'weekend',
      title: '灣區週末親子活動',
      format: 'xiaohongshu',
      storyMode: 'manual',
      date: '2026-10-29',
      time: '19:00',
    }),
    item({
      id: 'week-1030-reminder-story',
      packId: 'week-2026-10-26',
      lane: 'weekend',
      title: 'Still Figuring Out the Weekend?',
      format: 'story',
      storyMode: 'manual',
      date: '2026-10-30',
      time: '19:00',
    }),
  ]
}

function applyCalendar(state, built) {
  const byId = new Map(state.items.map((entry) => [entry.id, entry]))
  const calendarIds = new Set(built.map((entry) => entry.id))
  const next = built.map((def) => {
    const existing = byId.get(def.id)
    if (existing && existing.status !== 'draft' && existing.status !== 'cancelled') {
      return { ...existing, lane: def.lane, title: def.title }
    }
    const replace = REPLACE_CONTENT.has(def.id)
    return item({
      ...def,
      slides: !replace && existing?.slides?.length ? existing.slides : def.slides,
      eventRefs: existing?.eventRefs?.length ? existing.eventRefs : def.eventRefs,
      caption: replace ? (def.caption || '') : (existing?.caption || def.caption || ''),
    })
  })
  const retired = state.items
    .filter((entry) => RETIRED_IDS.has(entry.id) && entry.status !== 'draft')
    .map((entry) => (entry.status === 'cancelled' ? entry : { ...entry, status: 'cancelled', publishAtUtc: null }))
  const kept = state.items.filter((entry) => entry.status !== 'draft' && !calendarIds.has(entry.id) && !RETIRED_IDS.has(entry.id))
  return { ...state, packs: PACKS, items: [...next, ...kept, ...retired] }
}

export async function seedStudio() {
  const state = await readState()
  if (state.calendarVersion === CALENDAR_VERSION && state.packs.length > 0) return state
  const part1Dir = 'social/instagram/halloween-mockups/oct-10-17'
  const part2Dir = 'social/instagram/halloween-mockups/oct-24-31'
  const storyDir = 'social/instagram/halloween-mockups/stories'
  const oct17Dir = 'social/instagram/2026-10-17-weekend'
  const part1Slides = await slides(`${part1Dir}/png`, 9)
  const part2Slides = await slides(`${part2Dir}/png`, 10)
  const part1Caption = readText(`${part1Dir}/caption.txt`)
  const part1XhsCaption = readText(`${part1Dir}/xiaohongshu.txt`)
  const part2Caption = readText(`${part2Dir}/caption.txt`)
  const part2XhsCaption = readText(`${part2Dir}/xiaohongshu.txt`)
  const part1StorySlides = await namedSlides(storyDir, ['oct-13-1.png', 'oct-13-2.png'])
  const part2TodaySlides = await namedSlides(storyDir, ['oct-24-1.png'])
  const part2MidweekSlides = await namedSlides(storyDir, ['oct-28-1.png', 'oct-28-2.png'])
  const part2DaySlides = await namedSlides(storyDir, ['oct-31-1.png'])
  const oct17Slides = await namedSlides(oct17Dir, ['ig-1-cover.png', 'ig-2-saturday.png', 'ig-3-free.png', 'ig-4-plan-ahead.png'])
  const oct17Stories = await namedSlides(oct17Dir, ['story-thu-1.png', 'story-thu-2.png'])
  const oct17Friday = await namedSlides(oct17Dir, ['story-fri.png'])
  const oct17Saturday = await namedSlides(oct17Dir, ['story-sat.png'])
  const oct17Sunday = await namedSlides(oct17Dir, ['story-sun.png'])
  const oct17Cover = await slide(`${oct17Dir}/xhs-cover.png`)
  const weekendSlides = await slides('social/instagram/2026-10-10-weekend', 4)
  const weekendStories = await namedSlides('social/instagram/2026-10-10-weekend', ['story-thu-1.png', 'story-thu-2.png'])
  const weekendSaturday = await namedSlides('social/instagram/2026-10-10-weekend', ['story-sat.png'])
  const weekendSunday = await namedSlides('social/instagram/2026-10-10-weekend', ['story-sun.png'])
  const weekendCover = await slide('social/instagram/2026-10-10-weekend/xhs-cover.png')
  const weekdaySlides = await slides('social/instagram/2026-10-12-weekday', 4)
  const weekdayCover = await slide('social/instagram/2026-10-12-weekday/xhs-cover.png')
  const weekdayStories = await namedSlides('social/instagram/2026-10-12-weekday', ['story-1-cover.png', 'story-2-this-week.png'])
  const seeded = applyCalendar(state, calendarItems({
    part1Slides,
    part1XhsSlides: part1Slides,
    part2Slides,
    part2XhsSlides: part2Slides,
    part1Caption,
    part1XhsCaption,
    part2Caption,
    part2XhsCaption,
    part1StorySlides,
    part2TodaySlides,
    part2MidweekSlides,
    part2DaySlides,
    oct17Slides,
    oct17Stories,
    oct17Friday,
    oct17Saturday,
    oct17Sunday,
    oct17Caption: readText(`${oct17Dir}/caption.txt`),
    oct17XhsCaption: readText(`${oct17Dir}/xiaohongshu.txt`),
    oct17XhsSlides: [oct17Cover, ...oct17Slides.slice(1)],
    weekendSlides,
    weekendStories,
    weekendSaturday,
    weekendSunday,
    weekendCaption: readText('social/instagram/2026-10-10-weekend/caption.txt'),
    weekendXhsCaption: readText('social/instagram/2026-10-10-weekend/xiaohongshu.txt'),
    weekendXhsSlides: [weekendCover, ...weekendSlides.slice(1)],
    weekdaySlides,
    weekdayXhsSlides: [weekdayCover, ...weekdaySlides.slice(1)],
    weekdayStories,
  }))
  seeded.calendarVersion = CALENDAR_VERSION
  await writeState(seeded)
  return seeded
}
