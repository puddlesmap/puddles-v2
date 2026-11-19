/** Lined heart — outline unsaved, puddles-blue fill when saved. */
const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'

const PUDDLES_BLUE = '#66c5f9'

export function SaveHeartIcon({
  saved,
  size = 24,
  variant = 'card',
}: {
  saved: boolean
  size?: number
  variant?: 'card' | 'chrome' | 'map-sheet' | 'spec'
}) {
  if (variant === 'spec') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden
        className={saved ? 'save-heart-icon save-heart-icon--saved' : 'save-heart-icon'}
      >
        <path
          d={HEART_PATH}
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // Photo card: white outline. Map sheet (light UI): grey outline. Chrome: dark outline.
  const stroke = saved
    ? PUDDLES_BLUE
    : variant === 'card'
      ? '#fff'
      : variant === 'map-sheet'
        ? '#8a8a8a'
        : '#222'
  const fill = saved ? PUDDLES_BLUE : 'none'
  const strokeWidth = variant === 'card' ? 2 : 1.75

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={saved ? 'save-heart-icon save-heart-icon--saved' : 'save-heart-icon'}
      overflow="visible"
    >
      <path
        d={HEART_PATH}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
