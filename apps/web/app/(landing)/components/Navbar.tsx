'use client'

import { useEffect, useRef, useState } from 'react'

import { ChevronRightIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'

import { NavItem } from './NavItem'

import { DefaultWidth } from '@/components/molecules/DefaultWidth'
import { NavItem as NavItem_ } from '@/lib/types/generic'

const NAV_LINKS: NavItem_[] = [
  {
    slug: 'features',
    label: 'Features',
    href: '/#features',
  },
  {
    slug: 'how-it-works',
    label: 'How it Works',
    href: '/#how-it-works',
  },
  {
    slug: 'faqs',
    label: 'FAQs',
    href: '/#faqs',
  },
]

export function Navbar() {
  const [fullPath, setFullPath] = useState('')
  const [headerHeight, setHeaderHeight] = useState(0)

  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const headerHeight = () => {
      if (!headerRef.current) return 0
      return headerRef.current.getBoundingClientRect().height
    }

    setHeaderHeight(headerHeight)

    window.addEventListener('resize', () => {
      if (headerRef.current) {
        setHeaderHeight(headerHeight)
      }
    })

    return () => {
      window.removeEventListener('resize', () => {})
    }
  }, [])

  return (
    <>
      <header
        ref={headerRef}
        id="tradechat-header"
        className="fixed top-0 left-0 z-999 flex w-full justify-center border-b border-white/6 bg-white/2 backdrop-blur-lg"
      >
        <DefaultWidth>
          <nav className="flex items-center justify-between pt-8 pb-6">
            <Link href="/" className="flex items-center gap-2 select-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-3xl! bg-linear-to-br from-[#4EDEA3] to-[#00BD85] shadow-md shadow-emerald-500/30">
                <span className="text-foreground font-heading text-sm font-bold">
                  T
                </span>
              </div>
              <span className="text-primary text-lg font-bold tracking-tight">
                Tradechat
              </span>
            </Link>

            <div className="hidden items-center justify-center gap-4 md:flex">
              {NAV_LINKS.map((item) => (
                <NavItem
                  key={item.slug}
                  {...item}
                  completePath={fullPath}
                  onPathChange={(path) => setFullPath(path)}
                />
              ))}
            </div>

            <div className="hidden items-center justify-end gap-6 md:flex">
              <Link
                href="/login"
                className="text-primary hover:text-primary/90 text-sm font-semibold transition-all"
              >
                Login
              </Link>
              <Link
                href="/get-started"
                className="border-primary/20 bg-primary text-secondary hover:bg-primary/90 flex items-center justify-center gap-2 border px-4 py-2 text-sm font-semibold transition-all"
              >
                Get Started
                <HugeiconsIcon icon={ChevronRightIcon} size={20} />
              </Link>
            </div>
          </nav>
        </DefaultWidth>
      </header>
      <div style={{ height: headerHeight }} />
    </>
  )
}
