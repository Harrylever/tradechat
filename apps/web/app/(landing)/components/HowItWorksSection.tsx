import { Tick01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const STEPS = [
  {
    badge: <span className="text-sm font-bold">1</span>,
    title: 'Customer messages you',
    desc: 'They send a message on WhatsApp — e.g. "I want 5 bags of rice"',
  },
  {
    badge: <span className="text-sm font-bold">2</span>,
    title: 'AI creates a payment link',
    desc: 'Tradechat understands the order and generates a Nomba checkout link instantly',
  },
  {
    badge: <HugeiconsIcon icon={Tick01Icon} size={20} />,
    title: 'Payment confirmed',
    desc: 'Customer pays, you get notified, and funds hit your balance in real-time',
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-4xl px-6 py-24 md:px-12"
    >
      <h2 className="font-heading mb-16 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
        How It Works
      </h2>

      <div className="mx-auto flex max-w-xl flex-col">
        {STEPS.map((step, index) => (
          <div key={step.title} className="relative flex gap-5">
            <div className="relative flex flex-col items-center">
              {index < STEPS.length - 1 && (
                <div className="absolute top-10 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-linear-to-b from-[#00BD85]/50 via-[#00BD85]/20 to-[#00BD85]/50" />
              )}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00BD85]/40 bg-[#00BD85]/20 text-[#4EDEA3]">
                {step.badge}
              </div>
            </div>
            <div className={index < STEPS.length - 1 ? 'pt-1 pb-12' : 'pt-1'}>
              <h3 className="mb-1.5 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400 md:text-base">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
