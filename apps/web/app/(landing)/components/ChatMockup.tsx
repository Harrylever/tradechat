'use client'

import { BotIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'

const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

export function ChatMockup() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="border border-white/10 bg-[#111827]/80 p-5 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl md:p-6">
        {/* Card Header */}
        <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex aspect-square w-[32px] items-center justify-center rounded-full bg-[#00BD85] text-sm font-bold text-black">
            <HugeiconsIcon icon={BotIcon} size={20} />
          </div>
          <div>
            <h3 className="font-heading text-sm leading-tight font-semibold text-white">
              Tradechat
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#4EDEA3]" />
              <span className="text-xs text-slate-400">Always Active</span>
            </div>
          </div>
        </div>

        {/* Fake WhatsApp chat */}
        <div className="space-y-4 font-sans">
          {/* 1. Merchant logs the sale */}
          <motion.div
            className="flex justify-end"
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
          >
            <div className="w-fit max-w-[85%] rounded-[16px] rounded-tr-[4px] bg-[#00BD85] px-4 py-3 text-sm font-medium shadow-md">
              <p className="text-foreground leading-relaxed">
                Sold 5 bags rice to Ade, 87500
              </p>
            </div>
          </motion.div>

          {/* 2. Bot asks the merchant to confirm the parsed order */}
          <motion.div
            className="flex justify-start"
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35, delay: 0.7, ease: 'easeOut' }}
          >
            <div className="w-fit max-w-[85%] rounded-[16px] rounded-tl-[4px] border border-white/5 bg-black/60 px-4 py-3 text-sm font-medium shadow-sm">
              <p className="mb-2.5 leading-relaxed text-white">
                Oga make we confirm the order well well 👇
              </p>
              <div className="mb-2.5 space-y-1.5 rounded-[8px] border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/90">
                <div className="flex justify-between gap-2">
                  <span className="text-white/50">Customer</span>
                  <span className="font-semibold">Ade</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-white/50">Item</span>
                  <span className="font-semibold">Rice (5 bags)</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-white/50">Amount</span>
                  <span className="font-semibold">₦87,500</span>
                </div>
              </div>
              <p className="leading-relaxed text-white">
                Reply <span className="font-bold">1</span> to send payment link,
                or <span className="font-bold">2</span> to cancel.
              </p>
            </div>
          </motion.div>

          {/* 3. Merchant confirms */}
          <motion.div
            className="flex justify-end"
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35, delay: 1.3, ease: 'easeOut' }}
          >
            <div className="w-fit max-w-[85%] shrink-0 rounded-[16px] rounded-tr-[4px] bg-[#00BD85] px-4 py-3 text-sm font-medium shadow-md">
              <p className="text-foreground leading-relaxed">1</p>
            </div>
          </motion.div>

          {/* 4. Bot generates and sends the payment link */}
          <motion.div
            className="flex justify-start"
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35, delay: 1.7, ease: 'easeOut' }}
          >
            <div className="w-full max-w-[85%] rounded-[16px] rounded-tl-[4px] border border-white/5 bg-black/60 px-4 py-3 text-sm font-medium shadow-sm">
              <p className="mb-2.5 leading-relaxed text-white">
                Got it ✅ 5 bags rice → ₦87,500 for Ade. Payment link sent 👇
              </p>
              <div className="flex items-center justify-between gap-2 rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white/90">
                <span className="line-clamp-1 truncate">
                  pay.nomba.com/checkout/t-84j...
                </span>
                <span className="shrink-0 font-bold">↗</span>
              </div>
            </div>
          </motion.div>

          {/* 5. Payment confirmation */}
          <motion.div
            className="flex justify-start"
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35, delay: 2.3, ease: 'easeOut' }}
          >
            <div className="w-full max-w-[85%] rounded-[16px] rounded-tl-[4px] border border-white/5 bg-black/60 px-4 py-3 text-sm font-medium shadow-sm">
              <p className="leading-relaxed text-white">
                💰 Ade don pay — ₦87,500 don land for your balance.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
