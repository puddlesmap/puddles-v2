import { StaticCatchAll } from '../staticCatchAll'
import { seasonalIndexMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = seasonalIndexMetadata()

export default function SeasonalRoute() {
  return <StaticCatchAll />
}
