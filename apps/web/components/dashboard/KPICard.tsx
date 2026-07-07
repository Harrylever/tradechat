import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react'

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Props {
  title: string
  value: string
  subtitle?: string
  trend?: { value: string; positive: boolean }
  icon: IconSvgElement
  accent?: 'emerald' | 'blue' | 'violet' | 'amber'
}

const ACCENT_CLASSES: Record<
  string,
  { bg: string; icon: string; glow: string }
> = {
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  violet: {
    bg: 'bg-violet-500/10',
    icon: 'text-violet-400',
    glow: 'shadow-violet-500/10',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/10',
  },
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  accent = 'emerald',
}: Props) {
  const ac = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES['emerald']!
  return (
    <Card className={`shadow-xl ${ac.glow} group transition-all duration-200`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <CardAction>
          <div
            className={`h-9 w-9 rounded-xl ${ac.bg} group flex items-center justify-center ${ac.icon} transition-transform duration-200 group-hover:scale-110`}
          >
            <HugeiconsIcon
              icon={icon}
              strokeWidth={2}
              size={20}
              className="group-hover:rotate-[8deg]"
            />
          </div>
        </CardAction>
      </CardHeader>

      <CardContent>
        <p className="mb-1 text-3xl font-bold tracking-tight text-white">
          {value}
        </p>

        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}

        {trend && (
          <div
            className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.positive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
