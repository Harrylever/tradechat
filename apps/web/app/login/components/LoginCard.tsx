'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { OtpStep } from './OtpStep'
import { PhoneStep } from './PhoneStep'

import { Card } from '@/components/ui/card'
import { useRequestOtp, useVerifyOtp } from '@/hooks/use-auth'

function formatNigerianPhone(input: string): {
  isValid: boolean
  formatted: string
} {
  const stripped = input.replace(/[\s\-+]/g, '')

  if (!stripped || isNaN(Number(stripped)) || /\D/.test(stripped)) {
    return { isValid: false, formatted: '' }
  }

  // Matches Nigerian phone numbers:
  // - 10 digits starting with 7, 8, or 9 (e.g., 8012345678)
  // - 11 digits starting with 0 followed by 7, 8, or 9 (e.g., 08012345678)
  // - 13 digits starting with 234 followed by 7, 8, or 9 (e.g., 2348012345678)
  // - Must match only numerals/digits; should return error if NaN
  const regex = /^(?:234|0)?([789]\d{9})$/
  const match = stripped.match(regex)

  if (!match || !match[1]) {
    return { isValid: false, formatted: '' }
  }

  return { isValid: true, formatted: `+234${match[1]}` }
}

export function LoginCard() {
  const router = useRouter()
  const { mutateAsync: requestOtpMutation, isPending: isRequestingOtp } =
    useRequestOtp()
  const { mutateAsync: verifyOtpMutation, isPending: isVerifyingOtp } =
    useVerifyOtp()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')

  async function handleRequestOtp(e?: React.FormEvent) {
    if (e?.preventDefault) {
      e.preventDefault()
    }
    setError('')
    setOtp('')

    const { isValid, formatted } = formatNigerianPhone(phone)
    if (!isValid) {
      setError(
        'Please enter a valid WhatsApp number (e.g. 08012345678 or 8012345678)',
      )
      return
    }

    try {
      await requestOtpMutation(formatted)
      setHint(`OTP sent to WhatsApp ${formatted}`)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { isValid, formatted } = formatNigerianPhone(phone)
    if (!isValid) {
      setError('Please enter a valid WhatsApp number')
      return
    }

    try {
      const { success } = await verifyOtpMutation({
        whatsappNumber: formatted,
        otp,
      })

      if (success) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    }
  }

  return (
    <Card className="border border-white/10 bg-white/4 p-8 shadow-2xl backdrop-blur-sm">
      {step === 'phone' ? (
        <PhoneStep
          phone={phone}
          onPhoneChange={setPhone}
          onSubmit={handleRequestOtp}
          error={error}
          isPending={isRequestingOtp}
        />
      ) : (
        <OtpStep
          otp={otp}
          onOtpChange={setOtp}
          onSubmit={handleVerifyOtp}
          onBack={() => {
            setStep('phone')
            setError('')
            setOtp('')
          }}
          onResend={handleRequestOtp}
          hint={hint}
          error={error}
          isPending={isVerifyingOtp}
          isResendingCode={isRequestingOtp}
        />
      )}
    </Card>
  )
}
