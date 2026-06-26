export type DropletExpression =
  | 'happy'
  | 'curious'
  | 'content'
  | 'excited'
  | 'sleepy'
  | 'surprised'
  | 'cheeky'
  | 'neutral'

interface PuddlesDropletProps {
  size?: number
  expression?: DropletExpression
  className?: string
  /** Gentle bounce — loading states */
  animate?: boolean
  /** Show simple line arms/feet */
  withLimbs?: boolean
}

const BRAND = '#66C5F9'

function Eye({ cx, cy, pupilDx = 0, pupilDy = 0, closed = false }: {
  cx: number
  cy: number
  pupilDx?: number
  pupilDy?: number
  closed?: boolean
}) {
  if (closed) {
    return (
      <path
        d={`M ${cx - 2.2} ${cy} Q ${cx} ${cy + 1.4} ${cx + 2.2} ${cy}`}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    )
  }

  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="2.6" ry="3.1" fill="white" />
      <ellipse cx={cx + pupilDx} cy={cy + pupilDy} rx="1.15" ry="1.35" fill="#1a1a1a" />
    </g>
  )
}

function Mouth({ expression }: { expression: DropletExpression }) {
  switch (expression) {
    case 'excited':
    case 'surprised':
      return <ellipse cx="24" cy="30" rx="1.6" ry="2" fill="#1a1a1a" />
    case 'sleepy':
      return <ellipse cx="24" cy="30.5" rx="1.1" ry="1.3" fill="#1a1a1a" />
    case 'cheeky':
      return (
        <>
          <path
            d="M 21.5 30.5 Q 24 32.5 27 30.5"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <ellipse cx="28.2" cy="31.2" rx="1.1" ry="0.75" fill="#1a1a1a" />
        </>
      )
    case 'content':
    case 'happy':
    case 'curious':
    case 'neutral':
    default:
      return (
        <path
          d="M 21 30 Q 24 32.2 27 30"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      )
  }
}

function Face({ expression }: { expression: DropletExpression }) {
  switch (expression) {
    case 'curious':
      return (
        <>
          <Eye cx={20.5} cy={24} pupilDx={0.3} pupilDy={-0.6} />
          <Eye cx={27.5} cy={24} pupilDx={0.5} pupilDy={-0.6} />
          <Mouth expression={expression} />
        </>
      )
    case 'content':
      return (
        <>
          <Eye cx={20.5} cy={24.5} closed />
          <Eye cx={27.5} cy={24.5} closed />
          <Mouth expression={expression} />
        </>
      )
    case 'excited':
      return (
        <>
          <Eye cx={20} cy={23.5} pupilDx={0.4} pupilDy={-0.8} />
          <Eye cx={28} cy={23.5} pupilDx={0.6} pupilDy={-0.8} />
          <Mouth expression={expression} />
        </>
      )
    case 'sleepy':
      return (
        <>
          <path d="M 18.5 25 H 22.5" stroke="#1a1a1a" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M 25.5 25 H 29.5" stroke="#1a1a1a" strokeWidth="1.1" strokeLinecap="round" />
          <Mouth expression={expression} />
        </>
      )
    case 'surprised':
      return (
        <>
          <Eye cx={21} cy={25} pupilDx={0.8} pupilDy={0.5} />
          <Eye cx={27} cy={25} pupilDx={0.6} pupilDy={0.4} />
          <Mouth expression={expression} />
        </>
      )
    case 'cheeky':
      return (
        <>
          <Eye cx={20.5} cy={24} pupilDx={0.8} pupilDy={-0.4} />
          <Eye cx={27.5} cy={24} pupilDx={0.5} pupilDy={-0.5} />
          <Mouth expression={expression} />
        </>
      )
    case 'happy':
    case 'neutral':
    default:
      return (
        <>
          <Eye cx={20.5} cy={25} />
          <Eye cx={27.5} cy={25} />
          <Mouth expression={expression} />
        </>
      )
  }
}

function Limbs({ expression }: { expression: DropletExpression }) {
  const raised = expression === 'excited' || expression === 'happy'
  const leftArm = raised
    ? 'M 14 28 Q 10 22 8 18'
    : 'M 14 30 Q 10 32 8 34'
  const rightArm = raised
    ? 'M 34 28 Q 38 22 40 18'
    : 'M 34 30 Q 38 32 40 34'

  return (
    <g stroke={BRAND} strokeWidth="1.4" strokeLinecap="round" fill="none">
      <path d={leftArm} />
      <path d={rightArm} />
      <path d="M 20 42 Q 20 44 20 45" />
      <path d="M 28 42 Q 28 44 28 45" />
    </g>
  )
}

export function PuddlesDroplet({
  size = 80,
  expression = 'happy',
  className,
  animate = false,
  withLimbs = false,
}: PuddlesDropletProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={[animate ? 'puddles-droplet--animate' : '', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      {withLimbs && <Limbs expression={expression} />}
      <path
        d="M24 4C16 4 10 12 10 22c0 8 6 16 14 22 8-6 14-14 14-22C38 12 32 4 24 4z"
        fill={BRAND}
      />
      <Face expression={expression} />
    </svg>
  )
}
