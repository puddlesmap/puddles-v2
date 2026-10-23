import type { Metadata } from 'next'
import { StaticCatchAll } from '../../staticCatchAll'
import { seasonalSlugMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const dynamicParams = true

export function generateStaticParams() {
  return [{ slug: 'hello-fall' }, { slug: 'halloween-with-little-ones' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return seasonalSlugMetadata(slug)
}

export default function SeasonalSlugRoute() {
  return <StaticCatchAll />
}
