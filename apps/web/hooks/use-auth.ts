'use client'

import { useMutation } from '@tanstack/react-query'

import { requestOtp, verifyOtp } from '@/services/auth.service'

export function useRequestOtp() {
  return useMutation({
    mutationFn: (whatsappNumber: string) => requestOtp(whatsappNumber),
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({
      whatsappNumber,
      otp,
    }: {
      whatsappNumber: string
      otp: string
    }) => verifyOtp(whatsappNumber, otp),
  })
}
