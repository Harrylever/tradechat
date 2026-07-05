'use client'

import { useState, useMemo } from 'react'

import { Download01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { format } from 'date-fns'

import { columns, STATUS_LABELS } from './columns'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { DataTable } from '../ui/data-table'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

import { Transaction } from '@/services/transaction.service'

interface Props {
  transactions: Transaction[]
}

function exportCsv(transactions: Transaction[]) {
  const header = 'ID,Item,Customer,Quantity,Unit Price,Total (₦),Status,Date\n'
  const rows = transactions.map((t) =>
    [
      t.id,
      `"${t.itemDescription}"`,
      t.customerIdentifier ?? '',
      t.quantity,
      t.unitPrice,
      t.totalAmount,
      t.status,
      format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm'),
    ].join(','),
  )
  const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tradechat-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function TransactionTable({ transactions }: Props) {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter
      const matchSearch =
        !search ||
        t.itemDescription.toLowerCase().includes(search.toLowerCase()) ||
        (t.customerIdentifier ?? '').includes(search)
      return matchStatus && matchSearch
    })
  }, [transactions, statusFilter, search])

  return (
    <Card className="overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-white/6 p-5 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by item or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 transition-all focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">All statuses</SelectItem>
              {Object.keys(STATUS_LABELS).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button
          id="export-csv-btn"
          onClick={() => exportCsv(filtered)}
          className="bg-input/50 hover:bg-input/10 flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:text-white"
        >
          <HugeiconsIcon icon={Download01Icon} size={18} />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="p-5">
        <DataTable columns={columns} data={filtered} />
      </div>

      <div className="border-t border-white/6 px-5 py-3 text-xs text-slate-500">
        Showing {filtered.length} of {transactions.length} transactions
      </div>
    </Card>
  )
}
