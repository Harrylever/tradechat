import { ChevronLeftIcon, ChevronRightIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

interface OtpStepProps {
  otp: string
  onOtpChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  onResend: () => void
  hint: string
  error: string
  isPending: boolean
}

export function OtpStep({
  otp,
  onOtpChange,
  onSubmit,
  onBack,
  onResend,
  hint,
  error,
  isPending,
}: OtpStepProps) {
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-3 h-8 px-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
      >
        Back
        <HugeiconsIcon icon={ChevronLeftIcon} size={20} />
      </Button>

      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-bold text-white">
          Enter your code
        </CardTitle>
        {hint && (
          <CardDescription className="text-slate-400">{hint}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs tracking-wide text-slate-400 uppercase">
              6-digit OTP
            </Label>
            <InputOTP
              id="otp-input"
              maxLength={6}
              value={otp}
              onChange={onOtpChange}
              disabled={isPending}
              containerClassName="w-full justify-between"
            >
              <InputOTPGroup className="w-full justify-between gap-1 sm:gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="size-11 rounded-xl! border! border-white/10 bg-white/6 font-mono text-xl text-white data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/30 sm:size-13 sm:text-2xl"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="border-red-500/20 bg-red-500/10 text-red-400"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            id="verify-otp-btn"
            type="submit"
            disabled={isPending || otp.length < 6}
            className="flex h-12 w-full items-center bg-linear-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-400 hover:to-emerald-500"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Verifying…
              </>
            ) : (
              <>
                Sign in
                <HugeiconsIcon icon={ChevronRightIcon} size={20} />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onResend}
            disabled={isPending}
            className="w-full text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Resend code
          </Button>
        </form>
      </CardContent>
    </>
  )
}
