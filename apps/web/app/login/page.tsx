import type { Metadata } from 'next'

import { Footer } from '../(landing)/components/Footer'

import { LoginCard } from './components/LoginCard'
import { LoginHeader } from './components/LoginHeader'

export const metadata: Metadata = {
  title: 'Merchant Login',
  description:
    'Sign in to your Tradechat merchant dashboard securely via WhatsApp OTP. Manage transactions, payment links, and payouts.',
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0f1e]">
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-emerald-400/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        <LoginHeader />
        <LoginCard />
        <p className="mt-6 text-center text-xs text-slate-600">
          Only registered merchants can sign in.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 w-full">
        <Footer />
      </div>
    </div>
  )
}
