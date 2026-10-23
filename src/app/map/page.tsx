import { StaticCatchAll } from '../staticCatchAll'
import { mapMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = mapMetadata()

export default function MapRoute() {
  return <StaticCatchAll />
}
