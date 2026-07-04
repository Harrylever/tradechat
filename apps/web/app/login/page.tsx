"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { requestOtp, verifyOtp } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [hint, setHint] = useState("")
  const [isPending, startTransition] = useTransition()

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        await requestOtp(phone)
        setHint(`OTP sent to WhatsApp ${phone}`)
        setStep("otp")
      } catch (err: any) {
        setError(err.message || "Failed to send OTP")
      }
    })
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        const { accessToken } = await verifyOtp(phone, otp)
        // Store token as httpOnly cookie via our route handler
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        })
        router.push("/dashboard")
        router.refresh()
      } catch (err: any) {
        setError(err.message || "Invalid OTP")
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">
              Tradechat
            </span>
          </div>
          <p className="text-slate-400 text-sm">Merchant Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {step === "phone" ? (
            <>
              <h1 className="text-white text-2xl font-bold mb-1">
                Welcome back
              </h1>
              <p className="text-slate-400 text-sm mb-8">
                Enter your WhatsApp number to receive a sign-in code.
              </p>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                    WhatsApp Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+2348012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Include country code e.g. +234…
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  id="send-otp-btn"
                  type="submit"
                  disabled={isPending || !phone}
                  className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send OTP via WhatsApp →"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setStep("phone")
                  setError("")
                  setOtp("")
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
              >
                ← Back
              </button>

              <h1 className="text-white text-2xl font-bold mb-1">
                Enter your code
              </h1>
              {hint && <p className="text-slate-400 text-sm mb-8">{hint}</p>}

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                    6-digit OTP
                  </label>
                  {/* OTP digit boxes */}
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-500 text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  id="verify-otp-btn"
                  type="submit"
                  disabled={isPending || otp.length < 6}
                  className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Sign in →"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isPending}
                  className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors"
                >
                  Resend code
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Only registered merchants can sign in.
        </p>
      </div>
    </div>
  )
}
