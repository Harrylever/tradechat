'use server'

import { api } from '@/lib/api'

export async function getMerchantProfile() {
  return api.get<{
    id: string
    businessName: string
    whatsappNumber: string
    nombaMerchantId?: string
    balanceNaira?: number | string
    tier: string
    onboardingComplete: boolean
  }>(`/merchants/me`)
}

export async function getMerchantStats() {
  return api.get<{
    totalTransactions: number
    paidTransactions: number
    successRate: string
    totalVolumeNaira: number
  }>(`/merchants/me/stats`)
}

export async function updateMerchantProfile(data: {
  businessName?: string
  nombaMerchantId?: string
}) {
  return api.patch<{
    id: string
    businessName: string
    whatsappNumber: string
    nombaMerchantId?: string
    tier: string
    onboardingComplete: boolean
  }>(`/merchants/me`, data)
}

