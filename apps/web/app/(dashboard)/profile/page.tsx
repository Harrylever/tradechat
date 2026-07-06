import { ProfileClient } from '@/components/profile/ProfileClient'
import {
  getMerchantProfile,
  getMerchantStats,
} from '@/services/merchant.service'

export const metadata = {
  title: 'Profile',
  description:
    'Manage your merchant profile, WhatsApp connection, and Nomba integration',
}

export default async function ProfilePage() {
  const [profile, stats] = await Promise.all([
    getMerchantProfile(),
    getMerchantStats(),
  ])

  return <ProfileClient initialProfile={profile} stats={stats} />
}
