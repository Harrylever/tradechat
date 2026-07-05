import { ChevronRightIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'

import { ChatMockup } from './ChatMockup'

import { Badge } from '@/components/ui/badge'

export function HeroSection() {
  return (
    <section className="relative min-h-screen px-6 pt-12 pb-20 md:pt-20 md:pb-28 xl:pt-28">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
        <div className="z-10 flex flex-col items-start gap-3 text-left">
          <Badge
            variant="secondary"
            className="text-secondary rounded-full border border-[#3C4A42] bg-[#242C27] px-4 py-3.5 text-xs font-medium"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#4EDEA3]" />
            Powered by Nomba · Built for African Merchants
          </Badge>

          <h1 className="font-heading my-4 text-4xl leading-[1.15] font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Accept payments via{' '}
            <span className="bg-linear-to-r from-[#4EDEA3] to-[#00BD85] bg-clip-text text-transparent">
              WhatsApp
            </span>{' '}
            — no app needed
          </h1>

          <p className="mb-8 max-w-xl text-lg leading-relaxed tracking-tight text-slate-400 sm:text-xl">
            Tradechat turns your WhatsApp into a full payment terminal.
            Customers chat, you get paid — it&apos;s that simple.
          </p>

          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#00BD85] px-8 py-4 text-center text-base font-medium text-[#0a0f1e] shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:bg-[#4EDEA3]"
            >
              Open Dashboard
              <HugeiconsIcon icon={ChevronRightIcon} size={20} />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-center text-base font-medium text-white transition-all hover:bg-white/10"
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="z-10 flex w-full items-center justify-center lg:justify-end">
          <ChatMockup />
        </div>
      </div>

      {/* Ambient Glow */}
      <div className="blur-circle pointer-events-none absolute top-[0%] left-[50%] z-0 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-[#4EDEA3]/20" />
    </section>
  )
}
