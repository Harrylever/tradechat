'use client'

import { useMutation } from '@tanstack/react-query'

import { requestOtp, verifyOtp } from '@/services/auth.service'

export function useRequestOtp() {
  return useMutation({
    mutationFn: (whatsappNumber: string) => requestOtp({ whatsappNumber }),
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({
      otp,
      whatsappNumber,
    }: {
      otp: string
      whatsappNumber: string
    }) => verifyOtp({ whatsappNumber, otp }),
  })
}
