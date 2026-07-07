import { Suspense } from 'react'

import type { Metadata } from 'next'

import VerifyLoading from './loading'
import { PaymentVerifyClient } from './PaymentVerifyClient'

export const metadata: Metadata = {
  title: 'Payment Verification',
  description:
    'Verify your transaction status and view payment details on Tradechat.',
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={<VerifyLoading />}>
      <PaymentVerifyClient />
    </Suspense>
  )
}
