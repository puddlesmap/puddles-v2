import { hasAdminSession, isAdminAuthEnabled, unauthorizedResponse } from '../lib/admin-session.mjs'

const SPREADSHEET_ID = '1ko8p-HMzXMnSHT8qPxv14X-TPaac0RJTrfw8PwjikH8'
const SUBMISSIONS_GID = '1055272051'

export async function handler(event) {
  if (isAdminAuthEnabled() && !hasAdminSession(event)) {
    return unauthorizedResponse()
  }

  const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SUBMISSIONS_GID}`

  try {
    const response = await fetch(exportUrl)
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: `Submissions export failed (${response.status})` }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
      body: await response.text(),
    }
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Submissions CSV proxy failed',
      }),
    }
  }
}
