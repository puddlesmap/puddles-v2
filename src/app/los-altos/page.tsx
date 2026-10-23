import { StaticCatchAll } from '../staticCatchAll'
import { cityMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = cityMetadata('los-altos')

export default function LosAltosRoute() {
  return <StaticCatchAll />
}
