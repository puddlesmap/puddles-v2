import { refreshToken } from '../lib/instagram-publish.mjs'
import { livePublishItem, publishMode } from '../lib/social-studio-publish.mjs'
import { readState, runTick, writeState } from '../lib/social-studio-store.mjs'

export const config = {
  schedule: '*/5 * * * *',
}

async function emailOpenAlerts() {
  const to = process.env.SOCIAL_ALERT_EMAIL?.trim()
  const key = process.env.RESEND_API_KEY?.trim()
  if (!to || !key) return
  const state = await readState()
  let changed = false
  for (const reminder of state.reminders || []) {
    if (!['manual', 'failed'].includes(reminder.kind) || reminder.emailedAt) continue
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.SOCIAL_ALERT_FROM || 'Puddles <alerts@puddlesmap.com>',
        to: [to],
        subject: reminder.kind === 'failed' ? 'A Puddles post failed' : 'A Puddles story needs a manual post',
        text: `${reminder.message || reminder.kind}\n${reminder.href}`,
      }),
    })
    if (response.ok) {
      reminder.emailedAt = new Date().toISOString()
      changed = true
    }
  }
  if (changed) await writeState(state)
}

export async function handler() {
  const now = new Date()
  if (publishMode() === 'live') {
    const state = await readState()
    const expires = Date.parse(state.instagram?.expiresAt || '')
    if (state.instagram?.accessToken && Number.isFinite(expires) && expires - Date.now() < 7 * 24 * 60 * 60 * 1000) {
      try {
        const next = await refreshToken(state.instagram.accessToken)
        state.instagram = { ...state.instagram, ...next }
        await writeState(state)
      } catch (error) {
        state.reminders = [...(state.reminders || []), {
          id: `connection-${Date.now()}`,
          itemId: '',
          kind: 'connection',
          href: '/admin/social',
          message: error.message,
          createdAt: now.toISOString(),
        }]
        await writeState(state)
      }
    }
  }
  const studio = await runTick(now, publishMode() === 'live' ? { livePublish: livePublishItem } : {})
  await emailOpenAlerts()
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, mode: publishMode(), published: studio.published, skipped: studio.skipped }),
  }
}
