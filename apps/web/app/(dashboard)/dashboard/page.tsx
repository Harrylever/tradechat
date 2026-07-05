import { KPICard } from '@/app/(dashboard)/dashboard/components/KPICard'
import { RevenueChart } from '@/app/(dashboard)/dashboard/components/RevenueChart'
import { TransactionTable } from '@/app/(dashboard)/dashboard/components/TransactionTable'
import { getMerchantStats } from '@/services/merchant.service'
import { listTransactions } from '@/services/transaction.service'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const [stats, transactions] = await Promise.all([
    getMerchantStats(),
    listTransactions({ limit: 200 }),
  ])

  const pendingCount = transactions.filter(
    (t) =>
      t.status === 'AWAITING_PAYMENT' || t.status === 'PENDING_CONFIRMATION',
  ).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm text-slate-400">Your business at a glance</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={`₦${Number(stats.totalVolumeNaira).toLocaleString()}`}
          subtitle="From paid transactions"
          accent="emerald"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <KPICard
          title="Total Transactions"
          value={stats.totalTransactions.toLocaleString()}
          subtitle="All time"
          accent="blue"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KPICard
          title="Success Rate"
          value={stats.successRate}
          subtitle={`${stats.paidTransactions} paid`}
          accent="violet"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          title="Pending"
          value={pendingCount.toLocaleString()}
          subtitle="Awaiting payment"
          accent="amber"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart transactions={transactions} />

      {/* Transactions Table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Recent Transactions
        </h2>
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  )
}
