import { StaticCatchAll } from '../staticCatchAll'
import { guidesMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = guidesMetadata()

export default function GuidesRoute() {
  return <StaticCatchAll />
}
