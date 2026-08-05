import type { ExpansionWatchPayload } from '../types/expansionWatch'
import { buildExpansionWatchSubmissionRow } from './sheetApi'
import { submitSubmissionToAdmin } from './submissionsApi'

export async function submitExpansionWatch(payload: ExpansionWatchPayload): Promise<void> {
  await submitSubmissionToAdmin(buildExpansionWatchSubmissionRow(payload))
}
