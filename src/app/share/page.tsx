import { StaticCatchAll } from '../staticCatchAll'
import { shareMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = shareMetadata()

export default function ShareRoute() {
  return <StaticCatchAll />
}
