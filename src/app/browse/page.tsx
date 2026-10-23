import { StaticCatchAll } from '../staticCatchAll'
import { browseMetadata } from '@/seo/publicMetadata'

export const dynamic = 'force-static'
export const metadata = browseMetadata()

export default function BrowseRoute() {
  return <StaticCatchAll />
}
