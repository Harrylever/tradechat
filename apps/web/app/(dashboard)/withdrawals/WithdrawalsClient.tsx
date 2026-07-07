'use client'

import { useState } from 'react'

import { format } from 'date-fns'

import { WithdrawPanel } from '@/components/dashboard/WithdrawPanel'
import { BankAccount, Withdrawal } from '@/services/withdrawal.service'

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

interface Props {
  balance: number
  withdrawals: Withdrawal[]
  bankAccount: BankAccount | null
}

export function WithdrawalsClient({
  balance,
  withdrawals: initial,
  bankAccount: initAccount,
}: Props) {
  const [withdrawals, setWithdrawals] = useState(initial)
  const [bankAccount, setBankAccount] = useState(initAccount)
  const [key, setKey] = useState(0)

  // Refresh by triggering a full page reload (simple approach for Server Component)
  function handleSuccess() {
    // Re-fetch won't happen automatically; user sees success toast from WithdrawPanel
    // Increment key to reset panel state
    setKey((k) => k + 1)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Withdrawals
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your payout bank account and request withdrawals
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Panel */}
        <WithdrawPanel
          key={key}
          balance={balance}
          existingAccount={bankAccount}
          onSuccess={handleSuccess}
        />

        {/* Withdrawal History */}
        <div className="overflow-hidden border border-white/[0.07] bg-white/[0.04]">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="font-semibold text-white">Withdrawal History</h2>
          </div>

          {withdrawals.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No withdrawals yet
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.02]"
                >
                  <div>
                    <p className="font-semibold text-white">
                      ₦{w.amountNaira.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {format(new Date(w.createdAt), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[w.status] ?? ''}`}
                  >
                    {w.status.charAt(0) + w.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
