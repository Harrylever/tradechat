import { UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { Bubble, BubbleContent, BubbleReactions } from '@/components/ui/bubble'

export function ChatMockup() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl md:p-6">
        {/* Card Header */}
        <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="text-foreground flex aspect-square w-[32px] items-center justify-center rounded-full bg-gray-300">
            <HugeiconsIcon icon={UserIcon} size={20} />
          </div>
          <div>
            <h3 className="text-sm leading-tight font-semibold text-white">
              Customer
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#4EDEA3]" />
              <span className="text-xs text-slate-400">Online</span>
            </div>
          </div>
        </div>

        {/* Fake WhatsApp chat */}
        <div className="space-y-4 font-sans">
          {/* Customer Message */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/5 bg-white/8 px-4 py-3 text-sm text-white shadow-sm">
              <p className="leading-relaxed">
                Hi! I want 5 bags of basmati rice 🙏
              </p>
            </div>
          </div>

          {/* Merchant / AI Message */}
          <div className="flex justify-end">
            <Bubble className="max-w-[85%]">
              <BubbleContent className="w-full rounded-2xl rounded-tr-sm bg-[#00BD85] px-4 py-3 text-sm font-medium shadow-md">
                <p className="text-foreground mb-2.5 leading-relaxed">
                  Hello! That would be ₦87,500 for 5 bags. Here&apos;s your
                  secure payment link 👇
                </p>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/15 px-3 py-2 font-mono text-xs text-black/90">
                  <span className="line-clamp-1 truncate">
                    pay.nomba.com/checkout/t-84j...
                  </span>
                  <span className="shrink-0 font-bold">↗</span>
                </div>
              </BubbleContent>
              <BubbleReactions
                className="bg-foreground ring-foreground"
                role="img"
                align="end"
                aria-label="Reaction: thumbs up"
              >
                <span>👍</span>
              </BubbleReactions>
            </Bubble>
          </div>

          {/* Confirmation Message */}
          <div className="flex justify-start">
            <div className="flex max-w-[85%] items-center gap-2.5 rounded-2xl rounded-tl-sm border border-white/5 bg-white/8 px-4 py-3 text-sm text-white shadow-sm">
              <p className="leading-relaxed font-medium">
                Just paid. Thanks so much!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
