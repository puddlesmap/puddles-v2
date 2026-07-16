/** Renders formatModalDate output with Today/Tomorrow in semibold. */
export function RelativeDateLabel({ label }: { label: string }) {
  const match = /^(Today|Tomorrow)(,?\s*)(.*)$/.exec(label)
  if (!match) return <>{label}</>
  return (
    <>
      <span className="event-detail-relative-day">{match[1]}</span>
      {match[2]}
      {match[3]}
    </>
  )
}
