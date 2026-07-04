const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

type FetchOptions = RequestInit & { token?: string }

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, ...rest } = options
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers ?? {}),
  }

  const res = await fetch(`${BASE_URL}/api/v1${path}`, { ...rest, headers })

  if (!res.ok) {
    let message = `API error ${res.status}`
    try {
      const body = await res.json()
      message = body?.message ?? message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function requestOtp(whatsappNumber: string) {
  return apiFetch<{ message: string }>("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ whatsappNumber }),
  })
}

export function verifyOtp(whatsappNumber: string, otp: string) {
  return apiFetch<{
    accessToken: string
    merchant: {
      id: string
      businessName: string
      whatsappNumber: string
      tier: string
    }
  }>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ whatsappNumber, otp }),
  })
}

// ─── Merchant ─────────────────────────────────────────────────────────────────

export function getMerchantProfile(id: string, token: string) {
  return apiFetch<{
    id: string
    businessName: string
    whatsappNumber: string
    tier: string
    onboardingComplete: boolean
  }>(`/merchants/${id}`, { token })
}

export function getMerchantStats(id: string, token: string) {
  return apiFetch<{
    merchantId: string
    totalTransactions: number
    paidTransactions: number
    successRate: string
    totalVolumeNaira: number
  }>(`/merchants/${id}/stats`, { token })
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type Transaction = {
  id: string
  merchantId: string
  customerIdentifier: string | null
  itemDescription: string
  quantity: string
  unitPrice: string
  totalAmount: string
  status:
    | "PENDING_CONFIRMATION"
    | "AWAITING_PAYMENT"
    | "PAID"
    | "FAILED"
    | "CANCELLED"
  checkoutLink: string | null
  createdAt: string
  paidAt: string | null
}

export function listTransactions(
  merchantId: string,
  token: string,
  params: { status?: string; limit?: number } = {},
) {
  const qs = new URLSearchParams({ merchantId })
  if (params.status) qs.set("status", params.status)
  if (params.limit) qs.set("limit", String(params.limit))
  return apiFetch<Transaction[]>(`/transactions?${qs}`, { token })
}

export function getTransaction(id: string) {
  return apiFetch<Transaction & { merchant: { businessName: string } }>(
    `/transactions/${id}`,
  )
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

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
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  createdAt: string
}

export function getWithdrawalBalance(token: string) {
  return apiFetch<{ availableNaira: number }>("/withdrawals/balance", { token })
}

export function requestWithdrawal(amountNaira: number, token: string) {
  return apiFetch<Withdrawal & { message: string }>("/withdrawals", {
    method: "POST",
    body: JSON.stringify({ amountNaira }),
    token,
  })
}

export function listWithdrawals(token: string) {
  return apiFetch<Withdrawal[]>("/withdrawals", { token })
}

export function getBankAccount(token: string) {
  return apiFetch<BankAccount>("/withdrawals/bank-account", { token })
}

export function saveBankAccount(
  data: { bankCode: string; accountNumber: string; accountName: string },
  token: string,
) {
  return apiFetch<BankAccount>("/withdrawals/bank-account", {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  })
}
