'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction } from '@/lib/api';
import { format, subDays, startOfDay } from 'date-fns';
import { useMemo, useState } from 'react';

interface Props {
  transactions: Transaction[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-[#161c2d] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className="text-emerald-400 font-bold text-sm">
          ₦{Number(payload[0].value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
}

export function RevenueChart({ transactions }: Props) {
  const [range, setRange] = useState<7 | 30>(7);

  const data = useMemo(() => {
    const days = Array.from({ length: range }, (_, i) => {
      const date = startOfDay(subDays(new Date(), range - 1 - i));
      return { date, label: format(date, range === 7 ? 'EEE' : 'dd MMM'), revenue: 0 };
    });

    for (const tx of transactions) {
      if (tx.status !== 'PAID' || !tx.paidAt) continue;
      const paidDay = startOfDay(new Date(tx.paidAt)).getTime();
      const slot = days.find((d) => d.date.getTime() === paidDay);
      if (slot) slot.revenue += Number(tx.totalAmount);
    }

    return days.map(({ label, revenue }) => ({ label, revenue }));
  }, [transactions, range]);

  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold">Revenue</h3>
          <p className="text-slate-500 text-xs mt-0.5">Paid transactions over time</p>
        </div>
        <div className="flex gap-1 bg-white/[0.05] rounded-lg p-1">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                range === r
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
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
            tickFormatter={(v) => `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(16,185,129,0.2)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#revenueGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981', stroke: '#0d1117', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
