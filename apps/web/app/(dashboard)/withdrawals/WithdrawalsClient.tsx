"use client"

import { useState } from "react"
import { format } from "date-fns"
import { WithdrawPanel } from "@/components/dashboard/WithdrawPanel"
import type { BankAccount, Withdrawal } from "@/lib/api"

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
}

interface Props {
  token: string
  balance: number
  withdrawals: Withdrawal[]
  bankAccount: BankAccount | null
}

export function WithdrawalsClient({
  token,
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
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Withdrawals
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your payout bank account and request withdrawals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Panel */}
        <WithdrawPanel
          key={key}
          token={token}
          balance={balance}
          existingAccount={bankAccount}
          onSuccess={handleSuccess}
        />

        {/* Withdrawal History */}
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-white font-semibold">Withdrawal History</h2>
          </div>

          {withdrawals.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-sm">
              No withdrawals yet
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div>
                    <p className="text-white font-semibold">
                      ₦{w.amountNaira.toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {format(new Date(w.createdAt), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[w.status] ?? ""}`}
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
