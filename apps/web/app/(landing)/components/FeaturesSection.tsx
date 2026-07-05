import {
  FlashIcon,
  GridViewIcon,
  Message01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { DefaultWidth } from '@/components/molecules/DefaultWidth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  {
    icon: <HugeiconsIcon icon={Message01Icon} />,
    title: 'WhatsApp-Native',
    desc: 'Customers order and pay entirely within WhatsApp. No app download, no account creation.',
  },
  {
    icon: <HugeiconsIcon icon={FlashIcon} />,
    title: 'Instant Checkout',
    desc: 'Our AI converts a chat message into a payment link in seconds, powered by Nomba checkout.',
  },
  {
    icon: <HugeiconsIcon icon={GridViewIcon} />,
    title: 'Business Dashboard',
    desc: 'Track revenue, monitor transactions, and withdraw earnings — all in one clean dashboard.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-12 md:px-12">
      <DefaultWidth className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {FEATURES.map((f) => (
          <Card
            key={f.title}
            className="group border border-white/10 bg-[#111827]/60 p-6 transition-all duration-300 hover:border-[#4EDEA3]/30 hover:bg-[#111827]/80 md:p-8"
          >
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center border border-[#4EDEA3]/20 bg-[#4EDEA3]/10 text-[#4EDEA3] transition-transform duration-300 group-hover:scale-110">
                {f.icon}
              </div>
              <CardTitle className="text-xl font-semibold text-white">
                {f.title}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </DefaultWidth>
    </section>
  )
}
