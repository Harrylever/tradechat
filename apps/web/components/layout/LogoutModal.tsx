'use client'

import { Logout01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  loading?: boolean
}

export function LogoutModal({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-darkbg border border-white/10 text-white sm:max-w-md">
        <DialogHeader className="gap-2">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <HugeiconsIcon icon={Logout01Icon} size={24} />
          </div>
          <DialogTitle className="text-lg font-bold text-white">
            Sign Out of Tradechat
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Are you sure you want to log out of your merchant portal? You will
            need to sign in again with your WhatsApp number and OTP.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 pt-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex items-center gap-2 bg-red-500 font-medium text-white hover:bg-red-600"
          >
            <HugeiconsIcon icon={Logout01Icon} size={16} />
            {loading ? 'Signing out...' : 'Yes, Sign Out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
