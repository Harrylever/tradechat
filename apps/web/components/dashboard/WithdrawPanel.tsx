"use client"

import { useState } from "react"
import { saveBankAccount, requestWithdrawal, type BankAccount } from "@/lib/api"

const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "050", name: "EcoBank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "526", name: "Moniepoint MFB" },
  { code: "999991", name: "OPay" },
  { code: "076", name: "Polaris Bank" },
  { code: "101", name: "ProvidusBank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "SunTrust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
]

interface Props {
  token: string
  balance: number
  existingAccount: BankAccount | null
  onSuccess: () => void
}

export function WithdrawPanel({
  token,
  balance,
  existingAccount,
  onSuccess,
}: Props) {
  const [tab, setTab] = useState<"withdraw" | "bank">("withdraw")
  const [amount, setAmount] = useState("")
  const [bankCode, setBankCode] = useState(existingAccount?.bankCode ?? "")
  const [accountNumber, setAccountNumber] = useState(
    existingAccount?.accountNumber ?? "",
  )
  const [accountName, setAccountName] = useState(
    existingAccount?.accountName ?? "",
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!existingAccount) {
      setError("Please save a bank account first.")
      setTab("bank")
      return
    }
    setLoading(true)
    try {
      const res = await requestWithdrawal(Number(amount), token)
      setSuccess(res.message)
      setAmount("")
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      await saveBankAccount({ bankCode, accountNumber, accountName }, token)
      setSuccess("Bank account saved successfully.")
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.07]">
        {(["withdraw", "bank"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setError("")
              setSuccess("")
            }}
            className={`flex-1 py-3.5 text-sm font-medium transition-all ${
              tab === t
                ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t === "withdraw" ? "Withdraw Funds" : "Bank Account"}
          </button>
        ))}
      </div>

      <div className="p-6">
        {success && (
          <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {tab === "withdraw" ? (
          <form onSubmit={handleWithdraw} className="space-y-5">
            <div className="bg-white/4 border border-white/7 rounded-xl p-4 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Available Balance</span>
              <span className="text-white font-bold text-xl">
                ₦{balance.toLocaleString()}
              </span>
            </div>

            {existingAccount && (
              <div className="bg-emerald-500/6 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-0.5">Payout to</p>
                <p className="text-white font-medium text-sm">
                  {existingAccount.accountName}
                </p>
                <p className="text-slate-400 text-xs">
                  {existingAccount.accountNumber} ·{" "}
                  {NIGERIAN_BANKS.find(
                    (b) => b.code === existingAccount.bankCode,
                  )?.name ?? existingAccount.bankCode}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                Amount (₦)
              </label>
              <input
                type="number"
                min={1}
                max={balance}
                placeholder="e.g. 10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>

            <button
              id="request-withdrawal-btn"
              type="submit"
              disabled={loading || !amount || Number(amount) > balance}
              className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing…
                </>
              ) : (
                "Request Withdrawal"
              )}
            </button>

            <p className="text-xs text-slate-600 text-center">
              🔒 Beta feature — withdrawals are processed within 24 hours
            </p>
          </form>
        ) : (
          <form onSubmit={handleSaveBank} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                Bank
              </label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                required
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              >
                <option value="">Select bank…</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                Account Number
              </label>
              <input
                type="text"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, ""))
                }
                required
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                Account Name
              </label>
              <input
                type="text"
                placeholder="As it appears on your account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>

            <button
              id="save-bank-account-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Bank Account"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
