import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PhoneStepProps {
  phone: string
  onPhoneChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  error: string
  isPending: boolean
}

export function PhoneStep({
  phone,
  onPhoneChange,
  onSubmit,
  error,
  isPending,
}: PhoneStepProps) {
  return (
    <>
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-bold text-white">
          Welcome back
        </CardTitle>
        <CardDescription className="text-slate-400">
          Enter your WhatsApp number to receive a sign-in code.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-xs tracking-wide text-slate-400 uppercase"
            >
              WhatsApp Number
            </Label>

            <div className="relative flex h-12 w-full border border-white/10 bg-white/6 text-sm text-white">
              <div className="flex h-full w-[70px] items-center justify-center border-r-2 border-white/10">
                <p className="select-none">+234</p>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="8012345678"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                required
                className="h-full flex-1 border-none bg-transparent px-4 text-sm text-white placeholder:text-slate-500 focus-visible:border-none focus-visible:ring-emerald-500/50"
              />
            </div>
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="border-red-500/20 bg-red-500/10"
            >
              <AlertDescription className="text-red-500!">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            id="send-otp-btn"
            type="submit"
            disabled={isPending || !phone}
            className="h-12 w-full rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-400 hover:to-emerald-500"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sending…
              </>
            ) : (
              'Send OTP via WhatsApp →'
            )}
          </Button>
        </form>
      </CardContent>
    </>
  )
}
