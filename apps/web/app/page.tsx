import Link from "next/link"

const FEATURES = [
  {
    icon: "💬",
    title: "WhatsApp-Native",
    desc: "Customers order and pay entirely within WhatsApp. No app download, no account creation.",
  },
  {
    icon: "⚡",
    title: "Instant Checkout",
    desc: "Our AI converts a chat message into a payment link in seconds, powered by Nomba checkout.",
  },
  {
    icon: "📊",
    title: "Business Dashboard",
    desc: "Track revenue, monitor transactions, and withdraw earnings — all in one clean dashboard.",
  },
]

const STEPS = [
  {
    num: "01",
    title: "Customer messages you",
    desc: 'They send a message on WhatsApp — e.g. "I want 3 bags of rice"',
  },
  {
    num: "02",
    title: "AI creates a payment link",
    desc: "Tradechat understands the order and generates a Nomba checkout link instantly",
  },
  {
    num: "03",
    title: "Payment confirmed",
    desc: "Customer pays, you get notified, and funds hit your balance in real-time",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Tradechat
          </span>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-sm font-medium transition-all"
        >
          Merchant login →
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Powered by Nomba · Built for African Merchants
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Accept payments via{" "}
            <span className="brand-gradient-text">WhatsApp</span>
            <br />— no app needed
          </h1>

          <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Tradechat turns your WhatsApp into a full payment terminal.
            Customers chat, you get paid — it&apos;s that simple.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-base shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-105"
            >
              Open Dashboard →
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/9 border border-white/10 text-white font-medium text-base transition-all"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Hero mockup */}
        <div className="relative z-10 mt-16 w-full max-w-2xl mx-auto">
          <div className="bg-white/4 border border-white/8 rounded-3xl p-6 backdrop-blur-sm card-glow">
            {/* Fake WhatsApp chat */}
            <div className="bg-[#111827] rounded-2xl p-5 space-y-3">
              <div className="flex justify-start">
                <div className="bg-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
                  <p className="text-white text-sm">
                    Hi! I want 5 bags of basmati rice 🙏
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1">10:14 AM</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-emerald-600 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%]">
                  <p className="text-white text-sm">
                    Hello! That would be ₦87,500 for 5 bags. Here&apos;s your
                    secure payment link 👇
                  </p>
                  <div className="mt-2 bg-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono">
                    pay.nomba.com/checkout/abc123…
                  </div>
                  <p className="text-emerald-200 text-[10px] mt-1">
                    10:14 AM ✓✓
                  </p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
                  <p className="text-white text-sm">
                    ✅ Just paid! Thanks so much!
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1">10:16 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Why merchants love Tradechat
          </h2>
          <p className="text-slate-400 text-center mb-14 text-base">
            Everything you need to run a modern commerce operation on WhatsApp.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/4 border border-white/[0.07] rounded-2xl p-6 hover:border-emerald-500/20 hover:bg-emerald-500/3 transition-all duration-200 card-glow-hover group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 md:px-12 py-20 bg-white/2">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-slate-400 text-center mb-14">
            Three simple steps from order to payment.
          </p>

          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-sm">
                    {step.num}
                  </span>
                </div>
                <div className="pt-2">
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="hidden md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-10 text-lg">
            Sign in to your merchant dashboard and start accepting payments
            today.
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-base shadow-2xl shadow-emerald-500/25 transition-all duration-200 hover:scale-105"
          >
            Sign in to Dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="text-slate-400 text-sm font-medium">Tradechat</span>
        </div>
        <p className="text-slate-600 text-xs">
          © 2026 Tradechat. Built for the Nomba Hackathon.
        </p>
      </footer>
    </div>
  )
}
