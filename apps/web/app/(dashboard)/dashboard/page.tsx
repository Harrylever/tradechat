import {
  CheckmarkCircle01Icon,
  Clock01Icon,
  Exchange01Icon,
  MoneyBag01Icon,
} from '@hugeicons/core-free-icons'

import { KPICard } from '@/components/dashboard/KPICard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
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
          icon={MoneyBag01Icon}
        />
        <KPICard
          title="Total Transactions"
          value={stats.totalTransactions.toLocaleString()}
          subtitle="All time"
          accent="blue"
          icon={Exchange01Icon}
        />
        <KPICard
          title="Success Rate"
          value={stats.successRate}
          subtitle={`${stats.paidTransactions} paid`}
          accent="violet"
          icon={CheckmarkCircle01Icon}
        />
        <KPICard
          title="Pending"
          value={pendingCount.toLocaleString()}
          subtitle="Awaiting payment"
          accent="amber"
          icon={Clock01Icon}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart transactions={transactions} />

      {/* Transactions Table */}
      <div>
        <h2 className="font-heading mb-4 text-lg font-semibold text-white">
          Recent Transactions
        </h2>
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  )
}
