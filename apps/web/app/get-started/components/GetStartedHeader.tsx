import { Badge } from '@/components/ui/badge'

export function GetStartedHeader() {
  return (
    <>
      <Badge
        variant="secondary"
        className="mb-6 rounded-full border border-[#3C4A42] bg-[#242C27] px-4 py-3 text-xs font-medium text-gray-300"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#4EDEA3]" />
        Fast 30-Second Onboarding
      </Badge>

      <h1
        id="get-started-heading"
        className="font-heading mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
      >
        Start selling on{' '}
        <span className="bg-linear-to-r from-[#4EDEA3] to-[#00BD85] bg-clip-text text-transparent">
          WhatsApp
        </span>
      </h1>

      <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
        No app download required. Connect your store directly on WhatsApp and
        start issuing payment links in seconds.
      </p>
    </>
  )
}
