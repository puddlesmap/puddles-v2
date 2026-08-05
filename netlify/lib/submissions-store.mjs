/**
 * Admin-owned submissions store via GitHub Contents API (sheet-submissions.json).
 * Used by form intake and Admin refresh — no Google Sheet required.
 */

import { getGitHubConfig } from './publish-events.mjs'

const SUBMISSIONS_PATH = 'src/data/sheet-submissions.json'

function generateSubmissionId() {
  const stamp = new Date().toISOString().slice(0, 10)
  const rand = Math.random().toString(16).slice(2, 10)
  return `sub-${stamp}-${rand}`
}

async function githubGetFile({ token, owner, name, path }) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${name}/contents/${path}?ref=main`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Could not read ${path} (${response.status}): ${detail.slice(0, 200)}`)
  }

  const body = await response.json()
  const content = Buffer.from(body.content.replace(/\n/g, ''), 'base64').toString('utf8')
  return { sha: body.sha, content, parsed: JSON.parse(content) }
}

async function githubPutFile({ token, owner, name, path, sha, content, message }) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      sha,
      branch: 'main',
    }),
  })

  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json()
      detail = body?.message || ''
    } catch {
      detail = await response.text()
    }
    throw new Error(detail || `Could not commit ${path} (${response.status})`)
  }

  return response.json()
}

function emptySubmission() {
  return {
    id: '',
    submittedAt: '',
    submissionType: 'Event',
    status: 'New',
    eventType: '',
    eventName: '',
    locationName: '',
    address: '',
    city: '',
    date: '',
    startTime: '',
    endTime: '',
    ageRange: '',
    costType: '',
    costDetail: '',
    cost: '',
    signupRequirement: '',
    signupLinkInfo: '',
    eventDescription: '',
    parentTips: '',
    types: '',
    link: '',
    additionalInfo: '',
    internalNotes: '',
    convertedEventId: '',
    submittedByEmail: '',
    requestedLocation: '',
    sourceContext: '',
    selectedCity: '',
  }
}

/** Map form / Apps Script-style payload → SheetSubmission row. */
export function payloadToSubmission(payload = {}) {
  const submittedAt = payload.submittedAt || new Date().toISOString()
  const id = payload.id || generateSubmissionId()
  const costType = payload.costType || ''
  const costDetail = payload.costDetail || ''
  const submissionType = payload.submissionType || 'Event'

  return {
    ...emptySubmission(),
    id,
    submittedAt,
    submissionType,
    status: payload.status || 'New',
    eventType: payload.eventType || '',
    eventName: payload.eventName || '',
    locationName: payload.locationName || '',
    address: payload.address || '',
    city: payload.city || '',
    date: payload.date || '',
    startTime: payload.startTime || '',
    endTime: payload.endTime || '',
    ageRange: payload.ageRange || '',
    costType,
    costDetail,
    cost: costType === 'Free' ? 'Free' : costDetail || costType || payload.cost || '',
    signupRequirement: payload.signupRequirement || '',
    signupLinkInfo: payload.signupLinkInfo || '',
    eventDescription: payload.eventDescription || '',
    parentTips: payload.parentTips || '',
    types: payload.types || '',
    link: payload.link || '',
    additionalInfo: payload.parentTips || payload.additionalInfo || '',
    internalNotes: payload.internalNotes || '',
    convertedEventId: payload.convertedEventId || '',
    submittedByEmail: payload.submittedByEmail || '',
    requestedLocation: payload.requestedLocation || payload.locationName || payload.city || '',
    sourceContext: payload.sourceContext || '',
    selectedCity: payload.selectedCity || '',
  }
}

export async function loadSubmissionsFromGithub({ env = process.env } = {}) {
  const config = getGitHubConfig(env)
  if (!config.ok) {
    return { ok: false, status: 503, error: config.error }
  }

  try {
    const file = await githubGetFile({
      token: config.token,
      owner: config.owner,
      name: config.name,
      path: SUBMISSIONS_PATH,
    })
    const submissions = Array.isArray(file.parsed) ? file.parsed : []
    return {
      ok: true,
      status: 200,
      submissions,
      sha: file.sha,
      refreshedAt: new Date().toISOString(),
    }
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'Could not load submissions',
    }
  }
}

export async function appendSubmissionToGithub({ payload, env = process.env }) {
  const config = getGitHubConfig(env)
  if (!config.ok) {
    return { ok: false, status: 503, error: config.error }
  }

  const submission = payloadToSubmission(payload)
  if (!submission.eventName && submission.submissionType === 'Event') {
    return { ok: false, status: 400, error: 'Missing event name.' }
  }

  try {
    const file = await githubGetFile({
      token: config.token,
      owner: config.owner,
      name: config.name,
      path: SUBMISSIONS_PATH,
    })
    const list = Array.isArray(file.parsed) ? [...file.parsed] : []
    list.unshift(submission)
    list.sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')))

    await githubPutFile({
      token: config.token,
      owner: config.owner,
      name: config.name,
      path: SUBMISSIONS_PATH,
      sha: file.sha,
      content: `${JSON.stringify(list, null, 2)}\n`,
      message: `chore: new ${submission.submissionType} submission ${submission.id}`,
    })

    return {
      ok: true,
      status: 200,
      submission,
      message: 'Submission received. It will appear in Admin → Submissions after refresh.',
    }
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'Could not save submission',
    }
  }
}

/**
 * Patch one or more submissions by id in the GitHub store.
 * @param {{ updates: Array<{ id: string } & Record<string, unknown>>, env?: NodeJS.ProcessEnv }} input
 */
export async function patchSubmissionsInGithub({ updates, env = process.env }) {
  const config = getGitHubConfig(env)
  if (!config.ok) {
    return { ok: false, status: 503, error: config.error }
  }
  if (!Array.isArray(updates) || updates.length === 0) {
    return { ok: false, status: 400, error: 'No submission updates provided.' }
  }

  try {
    const file = await githubGetFile({
      token: config.token,
      owner: config.owner,
      name: config.name,
      path: SUBMISSIONS_PATH,
    })
    const list = Array.isArray(file.parsed) ? [...file.parsed] : []
    let patched = 0

    for (const update of updates) {
      const id = String(update.id || '').trim()
      if (!id) continue
      const index = list.findIndex((row) => String(row.id || '').trim() === id)
      if (index < 0) continue
      list[index] = { ...list[index], ...update, id }
      patched += 1
    }

    if (patched === 0) {
      return { ok: false, status: 404, error: 'No matching submissions to update.' }
    }

    await githubPutFile({
      token: config.token,
      owner: config.owner,
      name: config.name,
      path: SUBMISSIONS_PATH,
      sha: file.sha,
      content: `${JSON.stringify(list, null, 2)}\n`,
      message: `chore: update ${patched} submission${patched === 1 ? '' : 's'} in Admin`,
    })

    return {
      ok: true,
      status: 200,
      patched,
      submissions: list,
      message: `Updated ${patched} submission${patched === 1 ? '' : 's'}.`,
    }
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'Could not update submissions',
    }
  }
}
