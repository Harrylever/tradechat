import type { Metadata } from 'next'

import { Footer } from '../(landing)/components/Footer'

import { LoginCard } from './components/LoginCard'
import { LoginHeader } from './components/LoginHeader'

import { DefaultWidth } from '@/components/molecules/DefaultWidth'

export const metadata: Metadata = {
  title: 'Merchant Login',
  description:
    'Sign in to your Tradechat merchant dashboard securely via WhatsApp OTP. Manage transactions, payment links, and payouts.',
}

export default function LoginPage() {
  return (
    <div className="bg-darkbg relative min-h-screen overflow-hidden">
      <div className="relative flex items-center justify-center">
        {/* Background glow blobs */}
        <div className="bg-primary/10 pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 blur-3xl" />
        <div className="bg-primary/5 pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 blur-3xl" />

        <DefaultWidth>
          <div className="relative z-10 mx-auto mt-12 mb-60 w-full max-w-md sm:mt-24 sm:mb-0">
            <LoginHeader />
            <LoginCard />
            <p className="mt-6 text-center text-xs text-slate-600">
              Only registered merchants can sign in.
            </p>
          </div>
        </DefaultWidth>
      </div>

      <div className="absolute bottom-0 left-0 w-full">
        <Footer />
      </div>
    </div>
  )
}
