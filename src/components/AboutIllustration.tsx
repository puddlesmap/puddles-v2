interface AboutIllustrationProps {
  src: string
  src2x?: string
  intrinsicWidth: number
  intrinsicHeight: number
  displayWidth: number
  sizes?: string
  className?: string
  loading?: 'lazy' | 'eager'
}

/** Serves full-resolution art with an optional @2x variant for retina displays. */
export function AboutIllustration({
  src,
  src2x,
  intrinsicWidth,
  intrinsicHeight,
  displayWidth,
  sizes,
  className = '',
  loading = 'lazy',
}: AboutIllustrationProps) {
  const resolved2x = src2x ?? src.replace(/(\.\w+)$/, '@2x$1')
  const srcSet = src2x || resolved2x !== src
    ? `${src} 1x, ${resolved2x} 2x`
    : `${src} ${intrinsicWidth}w`

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes ?? `${displayWidth}px`}
      alt=""
      className={className}
      width={intrinsicWidth}
      height={intrinsicHeight}
      decoding={loading === 'eager' ? 'sync' : 'async'}
      loading={loading}
      fetchPriority={loading === 'eager' ? 'high' : undefined}
    />
  )
}
