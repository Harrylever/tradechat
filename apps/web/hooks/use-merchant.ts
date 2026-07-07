'use client'

import { useQuery } from '@tanstack/react-query'

import {
  getMerchantProfile,
  getMerchantStats,
} from '@/services/merchant.service'
import { queryKeys } from '@/services/query-keys'

export function useMerchantProfile() {
  return useQuery({
    queryKey: queryKeys.getMerchantProfile(),
    queryFn: () => getMerchantProfile(),
  })
}

export function useMerchantStats() {
  return useQuery({
    queryKey: queryKeys.getMerchantStats(),
    queryFn: () => getMerchantStats(),
  })
}
