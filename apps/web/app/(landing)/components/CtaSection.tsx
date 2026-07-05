import { ChevronRight } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'

export function CtaSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 md:px-12">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111827]/60 p-10 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur-xl md:p-16">
        <h2 className="font-heading mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Ready to get started?
        </h2>
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-slate-400 md:text-lg">
          Join thousands of African merchants growing their business on
          WhatsApp.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-[#00BD85] px-8 py-3.5 text-sm font-medium text-[#0a0f1e] shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:bg-[#4EDEA3]"
        >
          Merchant login
          <HugeiconsIcon icon={ChevronRight} size={20} />
        </Link>
      </div>
    </section>
  )
}
