import type { ExpansionWatchPayload } from '../types/expansionWatch'
import { buildExpansionWatchSubmissionRow, callSheetApi } from './sheetApi'

export async function submitExpansionWatch(payload: ExpansionWatchPayload): Promise<void> {
  await callSheetApi({
    action: 'appendSubmission',
    payload: buildExpansionWatchSubmissionRow(payload),
  })
}
