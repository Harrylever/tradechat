import type { Metadata } from 'next'

import { Footer } from '@/app/(landing)/components/Footer'
import { Navbar } from '@/app/(landing)/components/Navbar'
import { DeepLinkCard } from '@/app/get-started/components/DeepLinkCard'
import { GetStartedHeader } from '@/app/get-started/components/GetStartedHeader'
import { QrCodeCard } from '@/app/get-started/components/QrCodeCard'
import { DefaultWidth } from '@/components/molecules/DefaultWidth'

export const metadata: Metadata = {
  title: 'Get Started',
  description: 'Start selling on WhatsApp in 30 seconds.',
}

export default function GetStartedPage() {
  const botNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || '14155238886'
  const message = encodeURIComponent('join why-car')
  const whatsappUrl = `https://wa.me/${botNumber}?text=${message}`

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0f1e] text-white selection:bg-[#4EDEA3]/30 selection:text-white">
      <Navbar />

      <main className="relative pt-20 pb-28 md:pt-20 md:pb-36">
        {/* Ambient Glows */}
        <div className="blur-circle pointer-events-none absolute top-[10%] left-[50%] z-0 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-[#4EDEA3]/15" />
        <div className="blur-circle pointer-events-none absolute bottom-[10%] left-[20%] z-0 h-[300px] w-[400px] rounded-full bg-[#00BD85]/10" />

        <DefaultWidth className="relative z-10 mx-auto max-w-4xl text-center">
          <GetStartedHeader />

          <div className="mx-auto grid max-w-3xl grid-cols-1 items-stretch gap-8 md:grid-cols-2">
            <DeepLinkCard whatsappUrl={whatsappUrl} />
            <QrCodeCard whatsappUrl={whatsappUrl} />
          </div>
        </DefaultWidth>
      </main>

      <Footer />
    </div>
  )
}
