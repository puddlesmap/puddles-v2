import type { OutdatedReportPayload } from '../types/report'
import type { ActivitySubmissionPayload, IdeaSubmissionPayload } from '../types/submission'
import {
  buildActivitySubmissionRow,
  buildIdeaSubmissionRow,
  callSheetApi,
} from './sheetApi'

export async function submitActivitySubmission(payload: ActivitySubmissionPayload) {
  await callSheetApi({
    action: 'appendSubmission',
    payload: buildActivitySubmissionRow(payload),
  })
}

export async function submitIdeaSubmission(payload: IdeaSubmissionPayload) {
  await callSheetApi({
    action: 'appendSubmission',
    payload: buildIdeaSubmissionRow(payload),
  })
}

/** Reports tab write-back is not wired yet. */
export async function submitOutdatedReport(payload: OutdatedReportPayload) {
  console.log('Outdated report (not yet saved to sheet):', payload)
}
