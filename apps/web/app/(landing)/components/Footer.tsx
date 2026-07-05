import Link from 'next/link'

import { DefaultWidth } from '@/components/molecules/DefaultWidth'

export function Footer() {
  return (
    <footer className="mt-12 border-t border-white/6 py-4 sm:py-6">
      <DefaultWidth>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center bg-linear-to-br from-[#4EDEA3] to-[#00BD85] shadow-sm shadow-emerald-500/30">
                <span className="text-xs font-bold text-[#003824]">T</span>
              </div>
              <span className="font-bold tracking-tight text-white">
                Tradechat
              </span>
            </div>
            <p className="text-xs text-slate-500">
              © 2026 Tradechat. All rights reserved. Built for high-velocity
              commerce.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <Link href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              WhatsApp Integration
            </Link>
            {/* <Link href="#" className="transition-colors hover:text-white">
            API Docs
          </Link> */}
            <Link href="#" className="transition-colors hover:text-white">
              Contact Support
            </Link>
          </div>
        </div>
      </DefaultWidth>
    </footer>
  )
}
