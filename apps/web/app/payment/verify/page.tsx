"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { getTransaction, type Transaction } from "@/lib/api"

type Status = "loading" | "PAID" | "FAILED" | "AWAITING"

function ConfettiPiece({ i }: { i: number }) {
  const colors = ["#10b981", "#34d399", "#6ee7b7", "#059669", "#fff", "#fbbf24"]
  const style = {
    left: `${(i * 37 + 11) % 100}%`,
    top: "-10px",
    backgroundColor: colors[i % colors.length],
    width: i % 3 === 0 ? "8px" : "6px",
    height: i % 3 === 0 ? "8px" : "12px",
    borderRadius: i % 2 === 0 ? "50%" : "2px",
    animation: `confetti-fall ${1.5 + (i % 3) * 0.4}s ease-in ${(i * 0.07) % 1.2}s forwards`,
  } as React.CSSProperties
  return <div className="absolute" style={style} />
}

export default function PaymentVerifyPage() {
  const params = useSearchParams()
  const trxref = params.get("trxref")

  const [status, setStatus] = useState<Status>("loading")
  const [tx, setTx] = useState<
    (Transaction & { merchant: { businessName: string } }) | null
  >(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [elapsed, setElapsed] = useState(0)

  const POLL_INTERVAL = 3000
  const MAX_WAIT = 90

  const fetchTx = useCallback(async () => {
    if (!trxref) {
      setStatus("FAILED")
      setErrorMsg("No transaction reference provided.")
      return
    }
    try {
      const data = await getTransaction(trxref)
      setTx(data)

      if (data.status === "PAID") {
        setStatus("PAID")
      } else if (data.status === "FAILED" || data.status === "CANCELLED") {
        setStatus("FAILED")
        setErrorMsg("This payment was not completed. Please try again.")
      } else {
        // still awaiting — keep polling (handled by useEffect)
        setStatus("AWAITING")
      }
    } catch (e: any) {
      setStatus("FAILED")
      setErrorMsg(e.message || "Transaction not found.")
    }
  }, [trxref])

  useEffect(() => {
    fetchTx()

    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= MAX_WAIT) {
          clearInterval(interval)
          setStatus("FAILED")
          setErrorMsg(
            "Payment verification timed out. If you paid, please contact support.",
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
    if (status === "PAID" || status === "FAILED") {
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

      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] relative overflow-hidden px-4">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Confetti */}
        {status === "PAID" && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
            {Array.from({ length: 30 }, (_, i) => (
              <ConfettiPiece key={i} i={i} />
            ))}
          </div>
        )}

        {/* Card */}
        <div className="relative z-20 w-full max-w-sm">
          {status === "loading" || status === "AWAITING" ? (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-10 text-center shadow-2xl backdrop-blur-sm">
              {/* Spinner */}
              <div className="relative flex items-center justify-center mb-8">
                <div className="absolute w-20 h-20 border-2 border-emerald-500/20 rounded-full animate-pulse-ring" />
                <div className="w-16 h-16 border-4 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
              </div>
              <h1 className="text-white text-xl font-bold mb-2">
                Verifying payment…
              </h1>
              <p className="text-slate-400 text-sm">
                {tx
                  ? `${tx.itemDescription} · ₦${Number(tx.totalAmount).toLocaleString()}`
                  : "Please wait a moment"}
              </p>
              {/* Progress bar */}
              <div className="mt-6 w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((elapsed / MAX_WAIT) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-slate-600 text-xs mt-2">
                Auto-checking every 3 seconds
              </p>
            </div>
          ) : status === "PAID" ? (
            <div className="bg-white/[0.04] border border-emerald-500/20 rounded-3xl p-10 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur-sm animate-scale-in">
              {/* Success icon */}
              <div className="relative flex items-center justify-center mb-8">
                <div className="absolute w-24 h-24 bg-emerald-500/10 rounded-full animate-pulse-ring" />
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth={2.5}
                    className="w-10 h-10"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-white text-2xl font-bold mb-1">
                Payment Confirmed!
              </h1>
              <p className="text-emerald-400 text-sm mb-8">
                Your transaction was successful
              </p>

              {tx && (
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 text-left space-y-3 mb-8">
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

              <p className="text-slate-500 text-xs">
                A record of this payment has been sent to the merchant.
              </p>
            </div>
          ) : (
            <div className="bg-white/[0.04] border border-red-500/20 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-sm animate-scale-in">
              {/* Error icon */}
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth={2}
                  className="w-10 h-10"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                </svg>
              </div>

              <h1 className="text-white text-2xl font-bold mb-2">
                Payment Failed
              </h1>
              <p className="text-slate-400 text-sm mb-8">{errorMsg}</p>

              <a
                href="/"
                className="inline-block px-6 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-white text-sm font-medium transition-all"
              >
                Return to homepage
              </a>
            </div>
          )}

          {/* Branding */}
          <div className="text-center mt-6">
            <span className="text-slate-600 text-xs">Powered by </span>
            <span className="text-slate-500 text-xs font-semibold">
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
      <span className="text-slate-500 text-xs">{label}</span>
      <span
        className={`text-sm font-medium ${highlight ? "text-emerald-400" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  )
}
