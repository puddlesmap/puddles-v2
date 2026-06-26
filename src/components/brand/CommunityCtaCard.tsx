import type { ReactNode } from 'react'

interface CommunityCtaCardProps {
  title: string
  body: string
  children: ReactNode
  className?: string
}

export function CommunityCtaCard({
  title,
  body,
  children,
  className = '',
}: CommunityCtaCardProps) {
  return (
    <div className={`community-cta-card community-cta-card--neutral ${className}`.trim()}>
      <h2 className="cta-title">{title}</h2>
      <p className="cta-body">{body}</p>
      <div className="community-cta-card-actions">{children}</div>
    </div>
  )
}
