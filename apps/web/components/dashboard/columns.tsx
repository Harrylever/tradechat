'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import { Transaction } from '@/services/transaction.service'

export const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  AWAITING_PAYMENT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PENDING_CONFIRMATION: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

export const STATUS_LABELS: Record<string, string> = {
  PAID: 'Paid',
  FAILED: 'Failed',
  AWAITING_PAYMENT: 'Awaiting',
  PENDING_CONFIRMATION: 'Pending',
  CANCELLED: 'Cancelled',
}

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'itemDescription',
    header: 'Item',
    cell: ({ row }) => {
      const tx = row.original
      return (
        <div>
          <p className="max-w-[200px] truncate font-medium text-white">
            {tx.itemDescription}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Qty: {tx.quantity}</p>
        </div>
      )
    },
  },
  {
    accessorKey: 'customerIdentifier',
    header: 'Customer',
    cell: ({ row }) => {
      const id = row.getValue('customerIdentifier') as string | undefined
      return (
        <span className="font-mono text-xs text-slate-400">{id ?? '—'}</span>
      )
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = row.getValue('totalAmount') as number | string
      return (
        <span className="font-semibold text-white">
          ₦{Number(amount).toLocaleString()}
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? ''}`}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string | Date
      return (
        <span className="text-xs text-slate-400">
          {format(new Date(date), 'dd MMM yyyy, HH:mm')}
        </span>
      )
    },
  },
]
