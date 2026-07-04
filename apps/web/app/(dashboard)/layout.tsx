import { redirect } from "next/navigation"
import { getToken, getMerchantId } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = await getToken()
  const merchantId = await getMerchantId()

  if (!token || !merchantId) {
    redirect("/login")
  }

  return (
    <DashboardShell token={token} merchantId={merchantId}>
      {children}
    </DashboardShell>
  )
}
