interface Props {
  title: string
  value: string
  subtitle?: string
  trend?: { value: string; positive: boolean }
  icon: React.ReactNode
  accent?: "emerald" | "blue" | "violet" | "amber"
}

const ACCENT_CLASSES: Record<
  string,
  { bg: string; icon: string; glow: string }
> = {
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  blue: {
    bg: "bg-blue-500/10",
    icon: "text-blue-400",
    glow: "shadow-blue-500/10",
  },
  violet: {
    bg: "bg-violet-500/10",
    icon: "text-violet-400",
    glow: "shadow-violet-500/10",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  accent = "emerald",
}: Props) {
  const ac = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES["emerald"]!
  return (
    <div
      className={`bg-white/4 border border-white/[0.07] rounded-2xl p-6 shadow-xl ${ac.glow} hover:border-white/12 transition-all duration-200 group`}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div
          className={`w-9 h-9 rounded-xl ${ac.bg} flex items-center justify-center ${ac.icon} group-hover:scale-110 transition-transform duration-200`}
        >
          {icon}
        </div>
      </div>

      <p className="text-white text-3xl font-bold tracking-tight mb-1">
        {value}
      </p>

      {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}

      {trend && (
        <div
          className={`inline-flex items-center gap-1 mt-3 text-xs font-medium px-2 py-0.5 rounded-full ${
            trend.positive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          <span>{trend.positive ? "↑" : "↓"}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  )
}
