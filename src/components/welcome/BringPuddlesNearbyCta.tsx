interface BringPuddlesNearbyCtaProps {
  onOpen: () => void
  onDismiss: () => void
}

export function BringPuddlesNearbyCta({ onOpen, onDismiss }: BringPuddlesNearbyCtaProps) {
  return (
    <div className="bring-nearby-anchor">
      <div className="bring-nearby-pill">
        <button type="button" className="bring-nearby-fab" onClick={onOpen}>
          Bring Puddles nearby
        </button>
        <button
          type="button"
          className="bring-nearby-dismiss"
          aria-label="Dismiss for 30 days"
          onClick={onDismiss}
        >
          <span aria-hidden>×</span>
        </button>
      </div>
    </div>
  )
}
