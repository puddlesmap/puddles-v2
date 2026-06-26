import type { ReactNode } from 'react'

type PageLayout = 'app' | 'editorial' | 'wide'

const shellClass: Record<PageLayout, string> = {
  app: 'layout-shell-app',
  editorial: 'layout-shell-editorial',
  wide: 'layout-shell-wide',
}

export function PageContainer({
  children,
  className = '',
  layout = 'app',
}: {
  children: ReactNode
  className?: string
  layout?: PageLayout
}) {
  return <div className={`${shellClass[layout]} ${className}`}>{children}</div>
}
