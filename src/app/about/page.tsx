import { StaticCatchAll } from '../staticCatchAll'
import { aboutMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = aboutMetadata()

export default function AboutRoute() {
  return <StaticCatchAll />
}
