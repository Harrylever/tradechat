'use server'

import { api } from '@/lib/api'

export type BankAccount = {
  id: string
  merchantId: string
  bankCode: string
  accountNumber: string
  accountName: string
}

export type Withdrawal = {
  id: string
  merchantId: string
  amountNaira: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: string
}

export async function getWithdrawalBalance() {
  return api.get<{ availableNaira: number }>('/withdrawals/balance')
}

export async function requestWithdrawal(amountNaira: number) {
  return api.post<Withdrawal & { message: string }>('/withdrawals', {
    amountNaira,
  })
}

export async function listWithdrawals() {
  return api.get<Withdrawal[]>('/withdrawals')
}

export async function getBankAccount() {
  return api.get<BankAccount>('/withdrawals/bank-account')
}

export async function saveBankAccount(data: {
  bankCode: string
  accountNumber: string
  accountName: string
}) {
  'use server'
  return api.patch<BankAccount>('/withdrawals/bank-account', {
    data,
  })
}
