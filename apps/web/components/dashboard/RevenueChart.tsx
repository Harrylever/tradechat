'use client'

import { useMemo, useState } from 'react'

import { format, subDays, startOfDay } from 'date-fns'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { Button } from '../ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'

import { Transaction } from '@/services/transaction.service'

interface Props {
  transactions: Transaction[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="border border-white/10 bg-[#161c2d] px-4 py-3 shadow-2xl">
        <p className="mb-1 text-xs text-slate-400">{label}</p>
        <p className="text-sm font-bold text-emerald-400">
          ₦{Number(payload[0].value).toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

export function RevenueChart({ transactions }: Props) {
  const [range, setRange] = useState<7 | 30>(7)

  const data = useMemo(() => {
    const days = Array.from({ length: range }, (_, i) => {
      const date = startOfDay(subDays(new Date(), range - 1 - i))
      return {
        date,
        label: format(date, range === 7 ? 'EEE' : 'dd MMM'),
        revenue: 0,
      }
    })

    for (const tx of transactions) {
      if (tx.status !== 'PAID' || !tx.paidAt) continue
      const paidDay = startOfDay(new Date(tx.paidAt)).getTime()
      const slot = days.find((d) => d.date.getTime() === paidDay)
      if (slot) slot.revenue += Number(tx.totalAmount)
    }

    return days.map(({ label, revenue }) => ({ label, revenue }))
  }, [transactions, range])

  return (
    <Card className="border border-white/[0.07] p-6">
      <CardHeader className="mb-6 flex items-center justify-between">
        <div>
          <CardTitle className="font-semibold text-white">Revenue</CardTitle>
          <CardDescription className="mt-0.5 text-xs text-slate-500">
            Paid transactions over time
          </CardDescription>
        </div>
        <div className="flex gap-1 bg-white/5 p-1">
          {([7, 30] as const).map((r) => (
            <Button
              type="button"
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-medium transition-all ${
                range === r
                  ? 'text-slate-900'
                  : 'bg-emerald-500/20 text-emerald-400 hover:text-slate-900'
              }`}
            >
              {r}d
            </Button>
          ))}
        </div>
      </CardHeader>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
          />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
            }
            width={55}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(16,185,129,0.2)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#revenueGrad)"
            dot={false}
            activeDot={{
              r: 4,
              fill: '#10b981',
              stroke: '#0d1117',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
