/**
 * Best-effort mirror of a submission row to Google Sheet via Apps Script.
 * Admin GitHub store remains source of truth — Sheet failure must not undo Admin save.
 */

export async function mirrorSubmissionToGoogleSheet({
  payload,
  env = process.env,
} = {}) {
  const scriptUrl = env.GOOGLE_APPS_SCRIPT_URL?.trim()
  if (!scriptUrl) {
    return { ok: false, skipped: true, error: 'GOOGLE_APPS_SCRIPT_URL not set' }
  }

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
