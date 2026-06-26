/** Sheet workbook config — mirrors `data/sheet-source.json` for the app bundle. */
export const SHEET_SOURCE = {
  spreadsheetId: '1ko8p-HMzXMnSHT8qPxv14X-TPaac0RJTrfw8PwjikH8',
  spreadsheetUrl:
    'https://docs.google.com/spreadsheets/d/1ko8p-HMzXMnSHT8qPxv14X-TPaac0RJTrfw8PwjikH8/edit',
  eventsTabGid: 1023308778,
  submissionsTabGid: 1055272051,
  csvExportUrl:
    'https://docs.google.com/spreadsheets/d/1ko8p-HMzXMnSHT8qPxv14X-TPaac0RJTrfw8PwjikH8/export?format=csv&gid=1023308778',
  submissionsCsvExportUrl:
    'https://docs.google.com/spreadsheets/d/1ko8p-HMzXMnSHT8qPxv14X-TPaac0RJTrfw8PwjikH8/export?format=csv&gid=1055272051',
} as const

/** Same-origin proxy paths — vite.config.ts (dev) and netlify.toml (prod). */
export const SHEET_CSV_PROXY_PATH = '/api/sheet-csv'
export const SHEET_SUBMISSIONS_CSV_PROXY_PATH = '/api/sheet-submissions-csv'
export const SHEET_SUBMISSIONS_CSV_URL = SHEET_SOURCE.submissionsCsvExportUrl
