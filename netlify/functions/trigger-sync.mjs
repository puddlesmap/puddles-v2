import { hasAdminSession, isAdminAuthEnabled, jsonResponse, unauthorizedResponse } from '../lib/admin-session.mjs'

const DEFAULT_REPO = 'puddlesmap/puddles-v2'
const WORKFLOW_FILE = 'sync-events.yml'

function getGitHubConfig() {
  const token = process.env.GITHUB_DEPLOY_TOKEN?.trim()
  const repo = process.env.GITHUB_REPO?.trim() || DEFAULT_REPO
  const [owner, name] = repo.split('/')

  if (!token) {
    return { ok: false, error: 'Publish is not configured. Set GITHUB_DEPLOY_TOKEN on Netlify.' }
  }
  if (!owner || !name) {
    return { ok: false, error: 'Invalid GITHUB_REPO. Use owner/repo format.' }
  }

  return { ok: true, token, owner, name }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' })
  }

  if (!isAdminAuthEnabled() || !hasAdminSession(event)) {
    return unauthorizedResponse()
  }

  const config = getGitHubConfig()
  if (!config.ok) {
    return jsonResponse(503, { ok: false, error: config.error })
  }

  const { token, owner, name } = config

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${name}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ ref: 'main' }),
      },
    )

    if (response.status === 204) {
      return jsonResponse(200, {
        ok: true,
        message: 'Sync started. The public site usually updates in 2–4 minutes.',
      })
    }

    let detail = ''
    try {
      const body = await response.json()
      detail = body?.message || ''
    } catch {
      detail = await response.text()
    }

    return jsonResponse(response.status >= 500 ? 502 : response.status, {
      ok: false,
      error: detail || `GitHub workflow could not be started (${response.status})`,
    })
  } catch (error) {
    return jsonResponse(502, {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not reach GitHub',
    })
  }
}
