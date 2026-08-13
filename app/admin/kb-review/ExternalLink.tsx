'use client'

import type { CSSProperties } from 'react'

export function ExternalLink({
  href,
  style,
  children,
}: {
  href: string
  style?: CSSProperties
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={e => e.stopPropagation()}
      style={style}
    >
      {children}
    </a>
  )
}
