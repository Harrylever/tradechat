'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/services/query-keys'
import {
  getTransaction,
  listTransactions,
} from '@/services/transaction.service'

export function useTransactions(
  params: { status?: string; limit?: number } = {},
) {
  return useQuery({
    queryKey: queryKeys.listTransactions(params),
    queryFn: () => listTransactions(params),
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.getTransactionById(id),
    queryFn: () => getTransaction(id),
    enabled: Boolean(id),
  })
}
