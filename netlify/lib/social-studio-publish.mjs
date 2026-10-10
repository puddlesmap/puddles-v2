import { publishLive, publishMode } from './instagram-publish.mjs'
import { readState } from './social-studio-store.mjs'

export function siteOrigin() {
  return (process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/, '')
}

/** Sends one approved carousel to the connected Instagram account. */
export async function livePublishItem(item) {
  const state = await readState()
  if (!state.instagram?.accessToken || !state.instagram.userId) {
    throw new Error('Instagram is not connected.')
  }
  const host = siteOrigin()
  if (!host.startsWith('https://')) {
    throw new Error('Instagram needs the public site address before it can fetch the images.')
  }
  return publishLive(item, {
    userId: state.instagram.userId,
    accessToken: state.instagram.accessToken,
    imageUrl: (token) => `${host}/api/social-studio/media?token=${token}`,
  })
}

export { publishMode }
