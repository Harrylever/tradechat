import { ReactNode } from 'react'

import { ConfettiProvider } from './confetti-context'

export default function PaymentVerify({ children }: { children: ReactNode }) {
  return <ConfettiProvider>{children}</ConfettiProvider>
}
