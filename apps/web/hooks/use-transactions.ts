'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/services/query-keys'
import {
  getTransaction,
  listTransactions,
} from '@/services/transaction.service'

export function useTransactions(
  merchantId: string,
  token?: string,
  params: { status?: string; limit?: number } = {},
) {
  return useQuery({
    queryKey: queryKeys.listTransactions(merchantId, params),
    queryFn: () => listTransactions(merchantId, token, params),
    enabled: Boolean(merchantId),
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.getTransactionById(id),
    queryFn: () => getTransaction(id),
    enabled: Boolean(id),
  })
}
