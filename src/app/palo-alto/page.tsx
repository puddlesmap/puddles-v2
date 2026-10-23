import { StaticCatchAll } from '../staticCatchAll'
import { cityMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = cityMetadata('palo-alto')

export default function PaloAltoRoute() {
  return <StaticCatchAll />
}
