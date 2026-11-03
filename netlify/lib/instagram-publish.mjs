/**
 * Instagram publishing stays mock unless SOCIAL_PUBLISH_MODE=live.
 * Live calls are not made from tests or from the default Admin button.
 */

const GRAPH = 'https://graph.instagram.com/v21.0'

export function publishMode() {
  return process.env.SOCIAL_PUBLISH_MODE === 'live' ? 'live' : 'mock'
}

export function authorizeUrl(redirectUri) {
  const appId = process.env.INSTAGRAM_APP_ID?.trim()
  if (!appId) return null
  const url = new URL('https://www.instagram.com/oauth/authorize')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'instagram_business_basic,instagram_business_content_publish')
  return url.toString()
}

export async function exchangeCode(code, redirectUri) {
  const appId = process.env.INSTAGRAM_APP_ID?.trim()
  const secret = process.env.INSTAGRAM_APP_SECRET?.trim()
  if (!appId || !secret) throw new Error('Instagram app credentials are not configured.')
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: secret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  })
  const short = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body })
  const shortJson = await short.json()
  if (!short.ok) throw new Error(shortJson.error_message || 'Instagram token exchange failed.')
  const long = await fetch(
    `${GRAPH}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(secret)}&access_token=${encodeURIComponent(shortJson.access_token)}`,
  )
  const longJson = await long.json()
  if (!long.ok) throw new Error(longJson.error?.message || 'Instagram long-lived token failed.')
  return {
    accessToken: longJson.access_token,
    userId: String(shortJson.user_id),
    expiresAt: new Date(Date.now() + Number(longJson.expires_in || 0) * 1000).toISOString(),
  }
}

export async function refreshToken(accessToken) {
  const response = await fetch(
    `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(accessToken)}`,
  )
  const json = await response.json()
  if (!response.ok) throw new Error(json.error?.message || 'Instagram token refresh failed.')
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + Number(json.expires_in || 0) * 1000).toISOString(),
  }
}

export async function waitForContainer(containerId, accessToken, options = {}) {
  const fetchImpl = options.fetchImpl || fetch
  const attempts = options.attempts ?? 8
  const delayMs = options.delayMs ?? 1000
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
  let status = 'IN_PROGRESS'
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetchImpl(`${GRAPH}/${containerId}?fields=status_code`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error?.message || 'Instagram could not check this image.')
    status = json.status_code || status
    if (status === 'FINISHED' || status === 'PUBLISHED') return
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error('Instagram could not prepare this image.')
    if (attempt < attempts - 1) await sleep(delayMs)
  }
  throw new Error('Instagram is still preparing the images.')
}

async function graph(path, token, body) {
  const response = await fetch(`${GRAPH}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.error?.message || 'Instagram publish failed.')
  return json
}

export async function publishLive(item, { userId, accessToken, imageUrl }) {
  if (item.format === 'xiaohongshu') {
    throw new Error('Xiaohongshu posts are not sent to Instagram.')
  }
  if (item.format === 'story' && item.storyMode === 'manual') {
    throw new Error('Manual stories are not sent to Instagram.')
  }
  if (item.format === 'story') {
    const container = await graph(`/${userId}/media`, accessToken, {
      image_url: imageUrl(item.approved.slides[0].token),
      media_type: 'STORIES',
    })
    await waitForContainer(container.id, accessToken)
    const published = await graph(`/${userId}/media_publish`, accessToken, { creation_id: container.id })
    return published.id
  }
  const children = []
  for (const slide of item.approved.slides) {
    const child = await graph(`/${userId}/media`, accessToken, {
      image_url: imageUrl(slide.token),
      is_carousel_item: true,
    })
    await waitForContainer(child.id, accessToken)
    children.push(child.id)
  }
  const container = await graph(`/${userId}/media`, accessToken, {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption: item.approved.caption,
  })
  await waitForContainer(container.id, accessToken)
  const published = await graph(`/${userId}/media_publish`, accessToken, { creation_id: container.id })
  return published.id
}
