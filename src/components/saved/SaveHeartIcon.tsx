/** Valentine heart — white stroke, dark fill unsaved, white fill saved. */
const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'

export function SaveHeartIcon({
  saved,
  size = 24,
  variant = 'card',
}: {
  saved: boolean
  size?: number
  variant?: 'card' | 'chrome' | 'spec'
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

  const card = variant === 'card'
  const fill = card ? (saved ? '#fff' : 'rgba(0, 0, 0, 0.55)') : saved ? '#e61e4d' : '#222'
  const stroke = '#fff'

  return (
    <svg
      width={size}
      height={size}
      viewBox="-2 -2 28 28"
      aria-hidden
      className={saved ? 'save-heart-icon save-heart-icon--saved' : 'save-heart-icon'}
      overflow="visible"
    >
      <path
        d={HEART_PATH}
        fill={fill}
        stroke={stroke}
        strokeWidth={card ? 2 : 1.5}
        strokeLinejoin="miter"
        strokeLinecap="round"
        paintOrder="stroke"
      />
    </svg>
  )
}
