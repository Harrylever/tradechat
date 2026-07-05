'use server'

import { api } from '@/lib/api'
import { buildQueryString } from '@/lib/build-query-string'

export type Transaction = {
  id: string
  merchantId: string
  customerIdentifier: string | null
  itemDescription: string
  quantity: string
  unitPrice: string
  totalAmount: string
  status:
    | 'PENDING_CONFIRMATION'
    | 'AWAITING_PAYMENT'
    | 'PAID'
    | 'FAILED'
    | 'CANCELLED'
  checkoutLink: string | null
  createdAt: string
  paidAt: string | null
}

export async function listTransactions(
  params: { status?: string; limit?: number } = {},
) {
  const qs = buildQueryString({ ...params })
  return api.get<Transaction[]>(`/transactions/me${qs}`)
}

export async function getTransaction(id: string) {
  return api.get<Transaction & { merchant: { businessName: string } }>(
    `/transactions/${id}`,
  )
}
