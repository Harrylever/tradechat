'use client'

import { useState } from 'react'

import {
  Building01Icon,
  CheckmarkCircle01Icon,
  Edit01Icon,
  Exchange01Icon,
  MoneyBag01Icon,
  SmartPhone01Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateMerchantProfile } from '@/services/merchant.service'

interface ProfileData {
  id: string
  businessName: string
  whatsappNumber: string
  nombaMerchantId?: string
  balanceNaira?: number | string
  tier: string
  onboardingComplete: boolean
}

interface StatsData {
  totalTransactions: number
  paidTransactions: number
  successRate: string
  totalVolumeNaira: number
}

interface Props {
  initialProfile: ProfileData
  stats: StatsData
}

export function ProfileClient({ initialProfile, stats }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData>(initialProfile)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [businessName, setBusinessName] = useState(profile.businessName || '')
  const [nombaMerchantId, setNombaMerchantId] = useState(
    profile.nombaMerchantId || '',
  )
  const [loading, setLoading] = useState(false)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const updated = await updateMerchantProfile({
        businessName,
        nombaMerchantId: nombaMerchantId || undefined,
      })
      setProfile((prev) => ({ ...prev, ...updated }))
      toast.success('Profile updated successfully')
      setIsEditDialogOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Merchant Profile
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your account settings, WhatsApp integration, and Nomba IDs
          </p>
        </div>
        <Button
          onClick={() => {
            setBusinessName(profile.businessName || '')
            setNombaMerchantId(profile.nombaMerchantId || '')
            setIsEditDialogOpen(true)
          }}
          className="flex items-center gap-2 bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-600"
        >
          <HugeiconsIcon icon={Edit01Icon} size={18} />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Overview Card */}
        <Card className="space-y-6 border border-white/8 bg-white/4 p-6">
          <div className="flex items-center gap-3 border-b border-white/8 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <HugeiconsIcon icon={Building01Icon} size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Account Overview
              </h2>
              <p className="text-xs text-slate-400">
                Core identity & payment configuration
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-white/5 py-2">
              <span className="text-slate-400">Business Name</span>
              <span className="font-semibold text-white">
                {profile.businessName}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 py-2">
              <span className="text-slate-400">WhatsApp Number</span>
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={SmartPhone01Icon}
                  size={16}
                  className="text-emerald-400"
                />
                <span className="font-mono font-medium text-white">
                  {profile.whatsappNumber}
                </span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-400"
                >
                  Active
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 py-2">
              <span className="text-slate-400">Account Tier</span>
              <Badge className="border border-blue-500/20 bg-blue-500/10 text-blue-400">
                {profile.tier}
              </Badge>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 py-2">
              <span className="text-slate-400">Nomba Merchant ID</span>
              {profile.nombaMerchantId ? (
                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-400">
                  {profile.nombaMerchantId}
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="h-7 px-2 text-xs text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                >
                  + Configure Nomba ID
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Ledger Balance</span>
              <span className="text-lg font-bold text-emerald-400">
                ₦{Number(profile.balanceNaira || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Statistics Card */}
        <Card className="space-y-6 border border-white/8 bg-white/4 p-6">
          <div className="flex items-center gap-3 border-b border-white/8 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <HugeiconsIcon icon={UserCircleIcon} size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Business Statistics
              </h2>
              <p className="text-xs text-slate-400">
                Lifetime transaction volume & success metrics
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/6 bg-white/3 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                <HugeiconsIcon icon={MoneyBag01Icon} size={16} />
                <span>Total Revenue</span>
              </div>
              <p className="text-xl font-bold text-white">
                ₦{Number(stats.totalVolumeNaira).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/3 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                <HugeiconsIcon icon={Exchange01Icon} size={16} />
                <span>Total Transactions</span>
              </div>
              <p className="text-xl font-bold text-white">
                {stats.totalTransactions.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/3 p-4 sm:col-span-2">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                  <span>Success Rate</span>
                </div>
                <span className="text-xs font-medium text-emerald-400">
                  {stats.paidTransactions} of {stats.totalTransactions} paid
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.successRate}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border border-white/10 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Edit Merchant Profile
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              Update your business display name and Nomba payment credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 py-3">
            <div className="space-y-2">
              <Label
                htmlFor="businessName"
                className="text-sm font-medium text-slate-300"
              >
                Business Name
              </Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Acme Stores"
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="nombaId"
                className="text-sm font-medium text-slate-300"
              >
                Nomba Merchant ID
              </Label>
              <Input
                id="nombaId"
                value={nombaMerchantId}
                onChange={(e) => setNombaMerchantId(e.target.value)}
                placeholder="e.g. 84729384-ABCD-1234"
                className="border-white/10 bg-white/5 font-mono text-white placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-400">
                Found in your Nomba dashboard settings. Required for webhook
                verification and terminal linking.
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 font-medium text-white hover:bg-emerald-600"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
