import type { Metadata } from 'next'
import { eventDetailUrl } from '@/utils/eventPages'
import {
  getAllCatalogEventsForLifecycle,
  getEventLifecycleStatus,
  getLifecycleDetailEventById,
  isLifecycleDetailAccessible,
  isLifecycleEventIndexable,
} from '@/utils/eventLifecycle'
import {
  eventMetaDescription,
  eventOgDescription,
  eventOgImageUrl,
  eventPageTitle,
} from '@/utils/eventShare'
import { EventDetailPageLoader } from './EventDetailPageLoader'

/** Prefer static shells on Netlify; avoid build-time SSG of every ended URL (OOM). */
export const dynamic = 'force-static'
export const revalidate = false
/** Ended / archived ids not returned by generateStaticParams still resolve on first request. */
export const dynamicParams = true

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

export async function generateStaticParams() {
  // Prebuild live/upcoming (+ seasonal Hidden drive shells) only.
  // Prebuilding every ended/archived detail page (~600) OOMs Netlify (SIGKILL mid SSG).
  return getAllCatalogEventsForLifecycle()
    .filter(
      (event) =>
        isLifecycleDetailAccessible(event) &&
        (isLifecycleEventIndexable(event) || event.status === 'Hidden'),
    )
    .map((event) => ({ eventId: event.id }))
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  try {
    const { eventId } = await params
    const event = getLifecycleDetailEventById(eventId)

    if (!event) {
      return {
        title: 'Activity unavailable · Puddles',
        description: 'This activity is no longer listed on Puddles.',
        robots: { index: false, follow: false },
      }
    }

    const canonical = eventDetailUrl(event)
    const title = eventPageTitle(event)
    const description = eventMetaDescription(event)
    const socialDescription = eventOgDescription(event)
    const image = eventOgImageUrl(event)

    // Ended / archived pages stay live but out of the index.
    if (!isLifecycleEventIndexable(event)) {
      const status = getEventLifecycleStatus(event)
      return {
        title,
        description,
        alternates: { canonical },
        robots: { index: false, follow: status === 'archived' },
      }
    }

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title: event.title,
        description: socialDescription,
        url: canonical,
        type: 'article',
        siteName: 'Puddles the tot map',
        images: [{ url: image }],
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: socialDescription,
        images: [image],
      },
    }
  } catch {
    return {
      title: 'Puddles',
      robots: { index: false, follow: false },
    }
  }
}

export default async function EventPage() {
  return <EventDetailPageLoader />
}
