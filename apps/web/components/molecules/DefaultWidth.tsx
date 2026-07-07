import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function DefaultWidth({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      role="figure"
      className={cn('mx-auto w-full max-w-7xl px-8 sm:px-10', className)}
    >
      {children}
    </div>
  )
}
