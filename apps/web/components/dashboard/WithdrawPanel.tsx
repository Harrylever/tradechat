'use client'

import { useState } from 'react'

import {
  BankAccount,
  requestWithdrawal,
  saveBankAccount,
} from '@/services/withdrawal.service'

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '050', name: 'EcoBank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Moniepoint MFB' },
  { code: '999991', name: 'OPay' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'ProvidusBank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'SunTrust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
]

interface Props {
  balance: number
  existingAccount: BankAccount | null
  onSuccess: () => void
}

export function WithdrawPanel({ balance, existingAccount, onSuccess }: Props) {
  const [tab, setTab] = useState<'withdraw' | 'bank'>('withdraw')
  const [amount, setAmount] = useState('')
  const [bankCode, setBankCode] = useState(existingAccount?.bankCode ?? '')
  const [accountNumber, setAccountNumber] = useState(
    existingAccount?.accountNumber ?? '',
  )
  const [accountName, setAccountName] = useState(
    existingAccount?.accountName ?? '',
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!existingAccount) {
      setError('Please save a bank account first.')
      setTab('bank')
      return
    }
    setLoading(true)
    try {
      const res = await requestWithdrawal(Number(amount))
      setSuccess(res.message)
      setAmount('')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await saveBankAccount({ bankCode, accountNumber, accountName })
      setSuccess('Bank account saved successfully.')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overflow-hidden border border-white/7 bg-white/4">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.07]">
        {(['withdraw', 'bank'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-3.5 text-sm font-medium transition-all ${
              tab === t
                ? 'border-b-2 border-emerald-400 bg-emerald-500/5 text-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'withdraw' ? 'Withdraw Funds' : 'Bank Account'}
          </button>
        ))}
      </div>

      <div className="p-6">
        {success && (
          <div className="mb-5 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {tab === 'withdraw' ? (
          <form onSubmit={handleWithdraw} className="space-y-5">
            <div className="flex items-center justify-between border border-white/7 bg-white/4 p-4">
              <span className="text-sm text-slate-400">Available Balance</span>
              <span className="text-xl font-bold text-white">
                ₦{balance.toLocaleString()}
              </span>
            </div>

            {existingAccount && (
              <div className="border border-emerald-500/20 bg-emerald-500/6 p-4">
                <p className="mb-0.5 text-xs text-slate-400">Payout to</p>
                <p className="text-sm font-medium text-white">
                  {existingAccount.accountName}
                </p>
                <p className="text-xs text-slate-400">
                  {existingAccount.accountNumber} ·{' '}
                  {NIGERIAN_BANKS.find(
                    (b) => b.code === existingAccount.bankCode,
                  )?.name ?? existingAccount.bankCode}
                </p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-medium tracking-wide text-slate-400 uppercase">
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
                className="w-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <button
              id="request-withdrawal-btn"
              type="submit"
              disabled={loading || !amount || Number(amount) > balance}
              className="flex w-full items-center justify-center gap-2 bg-linear-to-r from-emerald-500 to-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing…
                </>
              ) : (
                'Request Withdrawal'
              )}
            </button>

            <p className="text-center text-xs text-slate-600">
              🔒 Beta feature — withdrawals are processed within 24 hours
            </p>
          </form>
        ) : (
          <form onSubmit={handleSaveBank} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium tracking-wide text-slate-400 uppercase">
                Bank
              </label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                required
                className="w-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-white transition-all focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
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
              <label className="mb-2 block text-xs font-medium tracking-wide text-slate-400 uppercase">
                Account Number
              </label>
              <input
                type="text"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, ''))
                }
                required
                className="w-full border border-white/10 bg-white/6 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 transition-all focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium tracking-wide text-slate-400 uppercase">
                Account Name
              </label>
              <input
                type="text"
                placeholder="As it appears on your account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                className="w-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <button
              id="save-bank-account-btn"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-linear-to-r from-emerald-500 to-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </>
              ) : (
                'Save Bank Account'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
