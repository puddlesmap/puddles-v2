import { StaticCatchAll } from '../staticCatchAll'
import { cityMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = cityMetadata('sunnyvale')

export default function SunnyvaleRoute() {
  return <StaticCatchAll />
}
