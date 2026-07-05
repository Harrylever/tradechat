import { MouseEvent, useCallback } from 'react'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { NavItem as NavItem_ } from '@/lib/types/generic'
import { cn } from '@/lib/utils'

interface NavItemProps extends NavItem_ {
  completePath: string
  onPathChange: (value: string) => void
}

export function NavItem({
  label,
  href,
  completePath,
  onPathChange,
}: NavItemProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = href === pathname || href === completePath

  const handleSetCompletePath = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      if (!window || typeof window === 'undefined' || !window.location) return

      const newPath = new URL(href, window.location.origin)
      const path = `${newPath.pathname}${newPath.hash}`
      onPathChange(path)

      router.push(path)
    },
    [router, href, onPathChange],
  )

  return (
    <Link
      href={href}
      onClick={handleSetCompletePath}
      className={cn(
        'text-secondary text-sm font-medium transition-colors duration-300 hover:text-white',
        isActive && 'text-primary! font-bold underline',
      )}
    >
      <span>{label}</span>
    </Link>
  )
}
