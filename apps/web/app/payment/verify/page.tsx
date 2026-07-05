'use client'

import { useEffect, useState, useCallback } from 'react'

import { useSearchParams } from 'next/navigation'

import { getTransaction, Transaction } from '@/services/transaction.service'

type Status = 'loading' | 'PAID' | 'FAILED' | 'AWAITING'

function ConfettiPiece({ i }: { i: number }) {
  const colors = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#fff', '#fbbf24']
  const style = {
    left: `${(i * 37 + 11) % 100}%`,
    top: '-10px',
    backgroundColor: colors[i % colors.length],
    width: i % 3 === 0 ? '8px' : '6px',
    height: i % 3 === 0 ? '8px' : '12px',
    borderRadius: i % 2 === 0 ? '50%' : '2px',
    animation: `confetti-fall ${1.5 + (i % 3) * 0.4}s ease-in ${(i * 0.07) % 1.2}s forwards`,
  } as React.CSSProperties
  return <div className="absolute" style={style} />
}

export default function PaymentVerifyPage() {
  const params = useSearchParams()
  const trxref = params.get('trxref')

  const [status, setStatus] = useState<Status>('loading')
  const [tx, setTx] = useState<
    (Transaction & { merchant: { businessName: string } }) | null
  >(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const POLL_INTERVAL = 3000
  const MAX_WAIT = 90

  const fetchTx = useCallback(async () => {
    if (!trxref) {
      setStatus('FAILED')
      setErrorMsg('No transaction reference provided.')
      return
    }
    try {
      const data = await getTransaction(trxref)
      setTx(data)

      if (data.status === 'PAID') {
        setStatus('PAID')
      } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
        setStatus('FAILED')
        setErrorMsg('This payment was not completed. Please try again.')
      } else {
        // still awaiting — keep polling (handled by useEffect)
        setStatus('AWAITING')
      }
    } catch (e: any) {
      setStatus('FAILED')
      setErrorMsg(e.message || 'Transaction not found.')
    }
  }, [trxref])

  useEffect(() => {
    fetchTx()

    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= MAX_WAIT) {
          clearInterval(interval)
          setStatus('FAILED')
          setErrorMsg(
            'Payment verification timed out. If you paid, please contact support.',
          )
          return prev
        }
        return prev + POLL_INTERVAL / 1000
      })
      fetchTx()
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trxref])

  // Stop polling once resolved
  useEffect(() => {
    if (status === 'PAID' || status === 'FAILED') {
      // useEffect cleanup above handles interval clearing
    }
  }, [status])

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .animate-pulse-ring { animation: pulse-ring 1.4s ease-out infinite; }
      `}</style>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0f1e] px-4">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/3 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        {/* Confetti */}
        {status === 'PAID' && (
          <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
            {Array.from({ length: 30 }, (_, i) => (
              <ConfettiPiece key={i} i={i} />
            ))}
          </div>
        )}

        {/* Card */}
        <div className="relative z-20 w-full max-w-sm">
          {status === 'loading' || status === 'AWAITING' ? (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-10 text-center shadow-2xl backdrop-blur-sm">
              {/* Spinner */}
              <div className="relative mb-8 flex items-center justify-center">
                <div className="animate-pulse-ring absolute h-20 w-20 rounded-full border-2 border-emerald-500/20" />
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-white">
                Verifying payment…
              </h1>
              <p className="text-sm text-slate-400">
                {tx
                  ? `${tx.itemDescription} · ₦${Number(tx.totalAmount).toLocaleString()}`
                  : 'Please wait a moment'}
              </p>
              {/* Progress bar */}
              <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                  style={{
                    width: `${Math.min((elapsed / MAX_WAIT) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Auto-checking every 3 seconds
              </p>
            </div>
          ) : status === 'PAID' ? (
            <div className="animate-scale-in rounded-3xl border border-emerald-500/20 bg-white/[0.04] p-10 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur-sm">
              {/* Success icon */}
              <div className="relative mb-8 flex items-center justify-center">
                <div className="animate-pulse-ring absolute h-24 w-24 rounded-full bg-emerald-500/10" />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth={2.5}
                    className="h-10 w-10"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="mb-1 text-2xl font-bold text-white">
                Payment Confirmed!
              </h1>
              <p className="mb-8 text-sm text-emerald-400">
                Your transaction was successful
              </p>

              {tx && (
                <div className="mb-8 space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 text-left">
                  <Row label="Merchant" value={tx.merchant.businessName} />
                  <Row label="Item" value={tx.itemDescription} />
                  <Row
                    label="Amount"
                    value={`₦${Number(tx.totalAmount).toLocaleString()}`}
                    highlight
                  />
                  {tx.paidAt && (
                    <Row
                      label="Paid at"
                      value={new Date(tx.paidAt).toLocaleString()}
                    />
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500">
                A record of this payment has been sent to the merchant.
              </p>
            </div>
          ) : (
            <div className="animate-scale-in rounded-3xl border border-red-500/20 bg-white/[0.04] p-10 text-center shadow-2xl backdrop-blur-sm">
              {/* Error icon */}
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth={2}
                  className="h-10 w-10"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                </svg>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-white">
                Payment Failed
              </h1>
              <p className="mb-8 text-sm text-slate-400">{errorMsg}</p>

              <a
                href="/"
                className="inline-block rounded-xl bg-white/[0.07] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/[0.12]"
              >
                Return to homepage
              </a>
            </div>
          )}

          {/* Branding */}
          <div className="mt-6 text-center">
            <span className="text-xs text-slate-600">Powered by </span>
            <span className="text-xs font-semibold text-slate-500">
              Tradechat
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={`text-sm font-medium ${highlight ? 'text-emerald-400' : 'text-white'}`}
      >
        {value}
      </span>
    </div>
  )
}
