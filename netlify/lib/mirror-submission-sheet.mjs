/**
 * Best-effort mirror of a submission row to Google Sheet via Apps Script.
 * Admin GitHub store remains source of truth — Sheet failure must not undo Admin save.
 *
 * Optional flag: set SUBMISSIONS_MIRROR_TO_SHEET=0 to skip Sheet even when
 * GOOGLE_APPS_SCRIPT_URL is configured (Admin-only intake).
 */

function sheetMirrorEnabled(env = process.env) {
  const flag = String(env.SUBMISSIONS_MIRROR_TO_SHEET ?? '1').trim().toLowerCase()
  if (flag === '0' || flag === 'false' || flag === 'off' || flag === 'no') return false
  return Boolean(env.GOOGLE_APPS_SCRIPT_URL?.trim())
}

export async function mirrorSubmissionToGoogleSheet({
  payload,
  env = process.env,
} = {}) {
  if (!sheetMirrorEnabled(env)) {
    return {
      ok: false,
      skipped: true,
      error: env.GOOGLE_APPS_SCRIPT_URL?.trim()
        ? 'SUBMISSIONS_MIRROR_TO_SHEET is disabled'
        : 'GOOGLE_APPS_SCRIPT_URL not set',
    }
  }

  const scriptUrl = env.GOOGLE_APPS_SCRIPT_URL.trim()

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'appendSubmission',
        payload,
      }),
      redirect: 'follow',
    })

    const text = await response.text()
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      return {
        ok: false,
        skipped: false,
        error: `Invalid Apps Script response (${response.status})`,
      }
    }

    if (!response.ok || parsed?.ok === false) {
      return {
        ok: false,
        skipped: false,
        error: parsed?.error || `Sheet append failed (${response.status})`,
      }
    }

    return { ok: true, skipped: false }
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error: error instanceof Error ? error.message : 'Sheet append failed',
    }
  }
}
