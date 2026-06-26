export function PuddlesLoading({ label = 'Loading Puddles…' }: { label?: string }) {
  return (
    <div className="puddles-loading" role="status" aria-live="polite">
      <p className="puddles-loading-label">{label}</p>
    </div>
  )
}
