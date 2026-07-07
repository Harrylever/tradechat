'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

import { Cancel01Icon, Tick01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { useConfettiContext } from './confetti-context'
import { ConfettiWrapper } from './ConfettiWrapper'

import { getTransaction, Transaction } from '@/services/transaction.service'

type Status = 'loading' | 'PAID' | 'FAILED' | 'AWAITING'

export function PaymentVerifyClient() {
  const params = useSearchParams()
  const trxref = params.get('trxref')

  const { setVisible } = useConfettiContext()

  const [status, setStatus] = useState<Status>('loading')
  const [tx, setTx] = useState<
    (Transaction & { merchant: { businessName: string } }) | null
  >(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const POLL_INTERVAL = 18_000
  const MAX_WAIT = 90

  const statusRef = useRef<Status>(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

  const fetchTx = useCallback(async () => {
    if (statusRef.current === 'PAID' || statusRef.current === 'FAILED') {
      return
    }

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
        setStatus('AWAITING')
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      setStatus('FAILED')
      setErrorMsg(err.message || 'Transaction not found.')
    }
  }, [trxref])

  useEffect(() => {
    fetchTx()

    const interval = setInterval(() => {
      if (statusRef.current === 'PAID' || statusRef.current === 'FAILED') {
        clearInterval(interval)
        return
      }

      setElapsed((prev) => prev + POLL_INTERVAL / 1000)
      fetchTx()
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trxref])

  useEffect(() => {
    if (elapsed >= MAX_WAIT && status !== 'PAID' && status !== 'FAILED') {
      setStatus('FAILED')
      setErrorMsg(
        'Payment verification timed out. If you paid, please contact support.',
      )
    }
  }, [elapsed, status])

  // Stop polling once resolved and trigger confetti if paid
  useEffect(() => {
    if (status === 'PAID') {
      setVisible('visible')
    } else {
      setVisible('none')
    }
  }, [status, setVisible])

  return (
    <ConfettiWrapper>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0f1e] px-4">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/3 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        {/* Card */}
        <div className="relative z-20 w-full max-w-sm">
          {status === 'loading' || status === 'AWAITING' ? (
            <div className="border border-white/8 bg-white/4 p-10 text-center shadow-2xl backdrop-blur-sm">
              {/* Spinner */}
              <div className="relative mb-8 flex items-center justify-center">
                <div className="animate-pulse-ring absolute h-20 w-20 rounded-full border-2 border-emerald-500/20" />
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />
              </div>
              <h1 className="font-heading mb-2 text-xl font-bold text-white">
                Verifying payment…
              </h1>
              <p className="text-sm text-slate-400">
                {tx
                  ? `${tx.itemDescription} · ₦${Number(tx.totalAmount).toLocaleString()}`
                  : 'Please wait a moment'}
              </p>
              {/* Progress bar */}
              <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                  style={{
                    width: `${Math.min((elapsed / MAX_WAIT) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Auto-checking every {POLL_INTERVAL / 1000} seconds
              </p>
            </div>
          ) : status === 'PAID' ? (
            <div className="animate-scale-in border border-emerald-500/20 bg-white/4 p-10 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur-sm">
              {/* Success icon */}
              <div className="relative mb-8 flex items-center justify-center">
                <div className="animate-pulse-ring absolute h-24 w-24 rounded-full bg-emerald-500/10" />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40">
                  <HugeiconsIcon icon={Tick01Icon} size={46} />
                </div>
              </div>

              <h1 className="font-heading mb-1 text-2xl font-bold text-white">
                Payment Confirmed!
              </h1>
              <p className="mb-8 text-sm text-emerald-400">
                Your transaction was successful
              </p>

              {tx && (
                <div className="mb-8 space-y-3 border border-white/[0.07] bg-white/4 p-5 text-left">
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
            <div className="animate-scale-in border border-red-500/20 bg-white/4 p-10 text-center shadow-2xl backdrop-blur-sm">
              {/* Error icon */}
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <HugeiconsIcon icon={Cancel01Icon} size={46} />
              </div>

              <h1 className="font-heading mb-2 text-2xl font-bold text-white">
                Payment Failed
              </h1>
              <p className="mb-8 text-sm text-slate-400">{errorMsg}</p>

              <Link
                href="/"
                className="inline-block bg-white/[0.07] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/12"
              >
                Return to homepage
              </Link>
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
    </ConfettiWrapper>
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
