'use client'

import { useMemo } from 'react'

import {
  CheckmarkCircle01Icon,
  Clock01Icon,
  MoneyBag01Icon,
} from '@hugeicons/core-free-icons'

import { KPICard } from '@/components/dashboard/KPICard'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { Transaction } from '@/services/transaction.service'

interface Props {
  transactions: Transaction[]
}

export function TransactionsClient({ transactions }: Props) {
  const stats = useMemo(() => {
    let volume = 0
    let paid = 0
    let pending = 0

    for (const t of transactions) {
      if (t.status === 'PAID') {
        volume += Number(t.totalAmount || 0)
        paid += 1
      } else if (
        t.status === 'AWAITING_PAYMENT' ||
        t.status === 'PENDING_CONFIRMATION'
      ) {
        pending += 1
      }
    }

    return { volume, paid, pending }
  }, [transactions])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Monitor customer payment requests, checkout links, and settlement statuses
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          title="Total Volume"
          value={`₦${stats.volume.toLocaleString()}`}
          subtitle="From paid transactions"
          accent="emerald"
          icon={MoneyBag01Icon}
        />
        <KPICard
          title="Paid Orders"
          value={stats.paid.toLocaleString()}
          subtitle="Successfully settled"
          accent="violet"
          icon={CheckmarkCircle01Icon}
        />
        <KPICard
          title="Pending Orders"
          value={stats.pending.toLocaleString()}
          subtitle="Awaiting payment confirmation"
          accent="amber"
          icon={Clock01Icon}
        />
      </div>

      {/* Transactions Table */}
      <div>
        <h2 className="font-heading mb-4 text-lg font-semibold text-white">
          All Transactions
        </h2>
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  )
}
