"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import type { Transaction } from "@/lib/api"

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  AWAITING_PAYMENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PENDING_CONFIRMATION: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  CANCELLED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
}

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  FAILED: "Failed",
  AWAITING_PAYMENT: "Awaiting",
  PENDING_CONFIRMATION: "Pending",
  CANCELLED: "Cancelled",
}

interface Props {
  transactions: Transaction[]
}

function exportCsv(transactions: Transaction[]) {
  const header = "ID,Item,Customer,Quantity,Unit Price,Total (₦),Status,Date\n"
  const rows = transactions.map((t) =>
    [
      t.id,
      `"${t.itemDescription}"`,
      t.customerIdentifier ?? "",
      t.quantity,
      t.unitPrice,
      t.totalAmount,
      t.status,
      format(new Date(t.createdAt), "yyyy-MM-dd HH:mm"),
    ].join(","),
  )
  const blob = new Blob([header + rows.join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `tradechat-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function TransactionTable({ transactions }: Props) {
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter
      const matchSearch =
        !search ||
        t.itemDescription.toLowerCase().includes(search.toLowerCase()) ||
        (t.customerIdentifier ?? "").includes(search)
      return matchStatus && matchSearch
    })
  }, [transactions, statusFilter, search])

  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 p-5 border-b border-white/[0.06]">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by item or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/30 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
        >
          <option value="ALL">All statuses</option>
          {Object.keys(STATUS_LABELS).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <button
          id="export-csv-btn"
          onClick={() => exportCsv(filtered)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-slate-300 hover:text-white text-sm font-medium transition-all"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Item", "Customer", "Amount", "Status", "Date"].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-slate-500"
                >
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="px-5 py-4">
                    <p className="text-white font-medium truncate max-w-[200px]">
                      {tx.itemDescription}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Qty: {tx.quantity}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs font-mono">
                    {tx.customerIdentifier ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white font-semibold">
                      ₦{Number(tx.totalAmount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[tx.status] ?? ""}`}
                    >
                      {STATUS_LABELS[tx.status] ?? tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs">
                    {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-white/[0.06] text-xs text-slate-500">
        Showing {filtered.length} of {transactions.length} transactions
      </div>
    </div>
  )
}
