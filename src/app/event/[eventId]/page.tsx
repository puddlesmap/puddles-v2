import type { Metadata } from 'next'
import { getPublicEventsFromCatalog } from '@/data/events'
import {
  getPublicEventById,
  isEventIndexable,
  eventDetailUrl,
} from '@/utils/eventPages'
import {
  eventMetaDescription,
  eventOgDescription,
  eventOgImageUrl,
  eventPageTitle,
} from '@/utils/eventShare'
import { EventDetailPageLoader } from './EventDetailPageLoader'

/** Fully static — avoid Netlify ISR/serverless invocations that were 502'ing. */
export const dynamic = 'force-static'
export const revalidate = false

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

export async function generateStaticParams() {
  return getPublicEventsFromCatalog().map((event) => ({ eventId: event.id }))
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  try {
    const { eventId } = await params
    const publicEvent = getPublicEventById(eventId)

    if (!publicEvent || !isEventIndexable(publicEvent)) {
      return {
        title: 'Activity unavailable · Puddles',
        description: 'This activity is no longer listed on Puddles.',
        robots: { index: false, follow: false },
      }
    }

    const canonical = eventDetailUrl(publicEvent)
    const title = eventPageTitle(publicEvent)
    const description = eventMetaDescription(publicEvent)
    const socialDescription = eventOgDescription(publicEvent)
    const image = eventOgImageUrl(publicEvent)

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title: publicEvent.title,
        description: socialDescription,
        url: canonical,
        type: 'article',
        siteName: 'Puddles the tot map',
        images: [{ url: image }],
      },
      twitter: {
        card: 'summary_large_image',
        title: publicEvent.title,
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
