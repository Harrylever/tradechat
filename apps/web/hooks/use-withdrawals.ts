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

export function useWithdrawalBalance(token?: string) {
  return useQuery({
    queryKey: queryKeys.getWithdrawalBalance(),
    queryFn: () => getWithdrawalBalance(token),
  })
}

export function useWithdrawals(token?: string) {
  return useQuery({
    queryKey: queryKeys.listWithdrawals(),
    queryFn: () => listWithdrawals(token),
  })
}

export function useBankAccount(token?: string) {
  return useQuery({
    queryKey: queryKeys.getBankAccount(),
    queryFn: () => getBankAccount(token),
    retry: false,
  })
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      amountNaira,
      token,
    }: {
      amountNaira: number
      token?: string
    }) => requestWithdrawal(amountNaira, token),
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
      token,
    }: {
      data: { bankCode: string; accountNumber: string; accountName: string }
      token?: string
    }) => saveBankAccount(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.getBankAccount() })
    },
  })
}
