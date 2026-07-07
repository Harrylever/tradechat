import { ChevronRightIcon, WhatsappIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface DeepLinkCardProps {
  whatsappUrl: string
}

export function DeepLinkCard({ whatsappUrl }: DeepLinkCardProps) {
  return (
    <Card className="flex flex-col justify-between border-white/10 bg-white/5 text-left backdrop-blur-xl transition-all duration-300 hover:border-[#4EDEA3]/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-emerald-500/10">
      <CardHeader className="p-8 pb-4">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00BD85]/20 text-[#4EDEA3]">
          <HugeiconsIcon icon={WhatsappIcon} />
        </div>
        <CardTitle className="mb-2 text-2xl font-bold text-white">
          On Mobile?
        </CardTitle>
        <CardDescription className="text-base leading-relaxed text-slate-400">
          Tap below to open WhatsApp instantly with a pre-filled start message.
          We&apos;ll guide you through setting up your store name and products.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 pt-4">
        <Button
          asChild
          className="group flex h-auto w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-[#00BD85] to-[#00a875] px-6 py-4 text-center font-semibold text-[#0a0f1e] shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] hover:bg-linear-to-r hover:from-[#4EDEA3] hover:to-[#00BD85] active:scale-[0.98]"
        >
          <a
            id="whatsapp-deep-link-btn"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <HugeiconsIcon icon={WhatsappIcon} />
            <span>Open in WhatsApp</span>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
