/** Escape and join rows for CSV download in the browser. */
function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export interface CsvColumn<T> {
  key: string
  label: string
  value: (row: T) => unknown
}

export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvCell(column.label)).join(',')
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvCell(column.value(row))).join(','),
  )
  return [header, ...body].join('\n')
}

export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadRowsAsCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
) {
  if (rows.length === 0) return false
  downloadCsv(filename, rowsToCsv(rows, columns))
  return true
}
