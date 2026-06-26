interface LogoProps {
  src?: string
  src2x?: string
  className?: string
}

const DEFAULT_LOGO_SRC = '/puddles-logo-mark.png'

export function Logo({ src = DEFAULT_LOGO_SRC, src2x, className }: LogoProps) {
  const srcSet = src2x ? `${src} 1x, ${src2x} 2x` : undefined

  return (
    <div className={['logo-mark', className].filter(Boolean).join(' ')} aria-hidden="true">
      <img
        src={src}
        srcSet={srcSet}
        alt=""
        className="logo-mark-img"
        width={32}
        height={32}
        decoding="async"
      />
    </div>
  )
}
