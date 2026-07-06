'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/services/query-keys'
import {
  getBankAccount,
  getWithdrawalBalance,
  listWithdrawals,
  requestWithdrawal,
  saveBankAccount,
} from '@/services/withdrawal.service'

export function useWithdrawalBalance() {
  return useQuery({
    queryKey: queryKeys.getWithdrawalBalance(),
    queryFn: () => getWithdrawalBalance(),
  })
}

export function useWithdrawals() {
  return useQuery({
    queryKey: queryKeys.listWithdrawals(),
    queryFn: () => listWithdrawals(),
  })
}

export function useBankAccount() {
  return useQuery({
    queryKey: queryKeys.getBankAccount(),
    queryFn: () => getBankAccount(),
    retry: false,
  })
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ amountNaira }: { amountNaira: number }) =>
      requestWithdrawal(amountNaira),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals() })
    },
  })
}

export function useSaveBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: { bankCode: string; accountNumber: string; accountName: string }
    }) => saveBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.getBankAccount() })
    },
  })
}
