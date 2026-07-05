export function LoginHeader() {
  return (
    <div className="mb-10 text-center">
      <div className="mb-4 inline-flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#4EDEA3] to-[#00BD85] shadow-lg shadow-emerald-500/30">
          <span className="font-heading text-lg font-bold text-white">T</span>
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">
          Tradechat
        </span>
      </div>
      <p className="text-sm text-slate-400">Merchant Dashboard</p>
    </div>
  )
}
