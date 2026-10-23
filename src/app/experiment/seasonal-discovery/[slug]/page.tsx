import type { Metadata } from 'next'
import { StaticCatchAll } from '../../../staticCatchAll'
import { experimentSeasonalMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const dynamicParams = true

export function generateStaticParams() {
  return [
    { slug: 'hello-fall' },
    { slug: 'halloween-with-little-ones' },
    { slug: 'calendar' },
    { slug: 'background' },
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return experimentSeasonalMetadata(slug)
}

export default function ExperimentSeasonalSlugRoute() {
  return <StaticCatchAll />
}
