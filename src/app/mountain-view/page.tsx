import { StaticCatchAll } from '../staticCatchAll'
import { cityMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = cityMetadata('mountain-view')

export default function MountainViewRoute() {
  return <StaticCatchAll />
}
