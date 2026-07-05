import { CtaSection } from '@/app/(landing)/components/CtaSection'
import { FaqSection } from '@/app/(landing)/components/FaqSection'
import { FeaturesSection } from '@/app/(landing)/components/FeaturesSection'
import { Footer } from '@/app/(landing)/components/Footer'
import { HeroSection } from '@/app/(landing)/components/HeroSection'
import { HowItWorksSection } from '@/app/(landing)/components/HowItWorksSection'
import { Navbar } from '@/app/(landing)/components/Navbar'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0f1e] text-white selection:bg-[#4EDEA3]/30 selection:text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <FaqSection />
      <Footer />
    </div>
  )
}
