import type { OutdatedReportPayload } from '../types/report'
import type { ActivitySubmissionPayload, IdeaSubmissionPayload } from '../types/submission'
import {
  buildActivitySubmissionRow,
  buildIdeaSubmissionRow,
} from './sheetApi'
import { submitSubmissionToAdmin } from './submissionsApi'

export async function submitActivitySubmission(payload: ActivitySubmissionPayload) {
  await submitSubmissionToAdmin(buildActivitySubmissionRow(payload))
}

export async function submitIdeaSubmission(payload: IdeaSubmissionPayload) {
  await submitSubmissionToAdmin(buildIdeaSubmissionRow(payload))
}

/** Reports tab write-back is not wired yet. */
export async function submitOutdatedReport(payload: OutdatedReportPayload) {
  console.log('Outdated report (not yet saved):', payload)
}
