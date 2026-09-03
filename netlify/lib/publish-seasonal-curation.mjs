/**
 * Publish Admin seasonal curation IDs into seasonal-curation-overrides.json via GitHub.
 */

import { getGitHubConfig, githubGetFile, githubPutFile } from './publish-events.mjs'

const OVERRIDES_PATH = 'src/data/seasonal-curation-overrides.json'

/**
 * @param {{
 *   themeSlug: string
 *   collectionEventIds: string[]
 *   driveEventIds: string[]
 *   env?: NodeJS.ProcessEnv
 * }} input
 */
export async function publishSeasonalCurationToGithub({
  themeSlug,
  collectionEventIds,
  driveEventIds,
  env = process.env,
}) {
  const config = getGitHubConfig(env)
  if (!config.ok) {
    return { ok: false, status: 503, error: config.error }
  }

  const slug = String(themeSlug || '').trim()
  if (!slug) {
    return { ok: false, status: 400, error: 'themeSlug is required.' }
  }
  if (!Array.isArray(collectionEventIds) || !Array.isArray(driveEventIds)) {
    return { ok: false, status: 400, error: 'collectionEventIds and driveEventIds must be arrays.' }
  }

  const closeIds = collectionEventIds.map((id) => String(id || '').trim()).filter(Boolean)
  const driveIds = driveEventIds.map((id) => String(id || '').trim()).filter(Boolean)

  const { token, owner, name } = config

  try {
    const file = await githubGetFile({ token, owner, name, path: OVERRIDES_PATH })
    const current =
      file.parsed && typeof file.parsed === 'object' && !Array.isArray(file.parsed)
        ? { ...file.parsed }
        : {}

    current[slug] = {
      collectionEventIds: closeIds,
      driveEventIds: driveIds,
      updatedAt: new Date().toISOString(),
    }

    await githubPutFile({
      token,
      owner,
      name,
      path: OVERRIDES_PATH,
      sha: file.sha,
      content: `${JSON.stringify(current, null, 2)}\n`,
      message: `chore: publish seasonal curation (${slug})`,
    })

    return {
      ok: true,
      status: 200,
      message: `Published ${slug} curation (${closeIds.length} close to home, ${driveIds.length} worth a drive). Site updates in ~2–4 minutes.`,
      themeSlug: slug,
      closeCount: closeIds.length,
      driveCount: driveIds.length,
    }
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'Could not publish seasonal curation',
    }
  }
}
