---
version: alpha
name: Tradechat
description: WhatsApp-native sales tracking and checkout provisioning for Nigerian micro-businesses. Powered by Nomba.
colors:
  primary: "#10B981"
  primary-light: "#34D399"
  primary-dark: "#059669"
  primary-deep: "#047857"
  background: "#0A0F1E"
  background-elevated: "#0D1117"
  background-panel: "#111827"
  background-tooltip: "#161C2D"
  surface: "rgba(255, 255, 255, 0.04)"
  surface-hover: "rgba(255, 255, 255, 0.06)"
  surface-input: "rgba(255, 255, 255, 0.05)"
  on-background: "#FFFFFF"
  on-background-secondary: "#94A3B8"
  on-background-muted: "#64748B"
  on-background-subtle: "#475569"
  on-primary: "#FFFFFF"
  border-subtle: "rgba(255, 255, 255, 0.06)"
  border-default: "rgba(255, 255, 255, 0.07)"
  border-strong: "rgba(255, 255, 255, 0.10)"
  success: "#34D399"
  success-bg: "rgba(16, 185, 129, 0.10)"
  warning: "#FBBF24"
  warning-bg: "rgba(245, 158, 11, 0.10)"
  error: "#F87171"
  error-bg: "rgba(239, 68, 68, 0.10)"
  info: "#60A5FA"
  info-bg: "rgba(59, 130, 246, 0.10)"
  accent-violet: "#A78BFA"
  accent-violet-bg: "rgba(139, 92, 246, 0.10)"
  chat-inbound: "rgba(255, 255, 255, 0.07)"
  chat-outbound: "#059669"
  chart-stroke: "#10B981"
typography:
  display:
    fontFamily: Outfit
    fontSize: 3.75rem
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: "-0.02em"
  h1:
    fontFamily: Outfit
    fontSize: 2.25rem
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Outfit
    fontSize: 1.875rem
    fontWeight: "700"
    lineHeight: "1.25"
    letterSpacing: "-0.01em"
  h3:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: "600"
    lineHeight: "1.4"
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: "400"
    lineHeight: "1.6"
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: "400"
    lineHeight: "1.5"
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: "400"
    lineHeight: "1.5"
  label-caps:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: "500"
    letterSpacing: "0.05em"
  kpi-value:
    fontFamily: Inter
    fontSize: 1.875rem
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "-0.02em"
  mono:
    fontFamily: "Geist Mono"
    fontSize: 0.875rem
    fontWeight: "400"
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  page-x: 48px
  page-y: 32px
  card: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "12px 32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.md}"
    padding: "12px 32px"
  button-ghost:
    backgroundColor: "rgba(16, 185, 129, 0.10)"
    textColor: "{colors.primary-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card}"
  input:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  badge-paid:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-awaiting:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-failed:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  nav-item-active:
    backgroundColor: "rgba(16, 185, 129, 0.15)"
    textColor: "{colors.primary-light}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  chat-bubble-inbound:
    backgroundColor: "{colors.chat-inbound}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  chat-bubble-outbound:
    backgroundColor: "{colors.chat-outbound}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
---

## Overview

Tradechat turns a merchant's existing WhatsApp number into a full point-of-sale system. Merchants log sales in plain language via WhatsApp; the bot parses and confirms the transaction, generates a Nomba payment link or virtual account for the customer, and reconciles payment status via Nomba webhooks. A companion web dashboard surfaces sales history, revenue, and outstanding orders — while a daily summary is also pushed back into WhatsApp so merchants never have to leave the channel they already live in.

**DevCareer × Nomba Hackathon 2026 · Infrastructure track**

The product's native shape is a **conversation pipeline**, not a generic SaaS dashboard. Every screen should be organized around this loop:

1. Merchant sends a free-text sale message on WhatsApp
2. Gemini extracts structured data (item, qty, price, customer)
3. Bot echoes parsed data back for merchant confirmation
4. On confirmation, backend creates a Nomba checkout link / virtual account
5. Link is sent to the customer via the merchant
6. Nomba webhook fires on payment → backend updates transaction status
7. Confirmation messages sent to both merchant and customer
8. Dashboard and daily WhatsApp summary reflect the settled transaction

**Visual atmosphere:** Dark, premium fintech for African merchants. Deep navy backgrounds with emerald as the sole brand accent. Glass-like surfaces (low-opacity white overlays), soft emerald glows, and generous corner radii. The UI should feel like WhatsApp meets a modern payment terminal — conversational first, data second.

**Platform:** Web, desktop-first dashboard; mobile-responsive landing and login.

**Hierarchy rule:** The WhatsApp chat → parse → confirm → pay loop dominates every marketing surface. KPIs, charts, and withdrawal flows are secondary proof — never the hero.

## Colors

The palette is anchored in deep navy backgrounds and emerald green as the single brand driver. Semantic colors map directly to transaction and withdrawal statuses in the codebase.

- **Primary (#10B981):** Emerald brand color. Primary CTAs, active chart strokes, outbound WhatsApp bubbles, focus rings, and success states.
- **Primary Light (#34D399):** Gradient highlights, active nav text, gradient headline accents, paid-status badge text.
- **Primary Dark (#059669):** Button gradient end-stops, outbound chat bubble fill, hover depth.
- **Primary Deep (#047857):** Deepest gradient stop for brand-gradient utility.
- **Background (#0A0F1E):** Main page canvas for landing, login, dashboard, and payment verify.
- **Background Elevated (#0D1117):** Sidebar, mobile header, chart active dots.
- **Background Panel (#111827):** Inner chat mock containers, nested panels.
- **Background Tooltip (#161C2D):** Chart tooltips, select option backgrounds.
- **Surface (rgba(255,255,255,0.04)):** Card and panel backgrounds. Use with border-default for all containers.
- **On Background (#FFFFFF):** Headlines, KPI values, table primary text.
- **On Background Secondary (#94A3B8):** Body copy, subtitles, table secondary text (slate-400).
- **On Background Muted (#64748B):** Captions, axis labels, footer text (slate-500).
- **Success (#34D399 / bg rgba(16,185,129,0.10)):** PAID transactions, COMPLETED withdrawals, confirmation states.
- **Warning (#FBBF24 / bg rgba(245,158,11,0.10)):** AWAITING_PAYMENT, PENDING withdrawals.
- **Error (#F87171 / bg rgba(239,68,68,0.10)):** FAILED transactions, form errors, logout hover.
- **Info (#60A5FA / bg rgba(59,130,246,0.10)):** Total Transactions KPI accent, PROCESSING withdrawal status.
- **Accent Violet (#A78BFA):** Success Rate KPI accent only.
- **Chat Inbound (rgba(255,255,255,0.07)):** Customer message bubbles in WhatsApp mock.
- **Chat Outbound (#059669):** Merchant/bot reply bubbles in WhatsApp mock.

**Brand gradient (buttons, logo):** `linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)`

**Brand text gradient (hero accent word):** `linear-gradient(135deg, #34D399, #10B981, #059669)`

**Glow (cards):** `0 0 40px -10px rgba(16, 185, 129, 0.15), 0 20px 60px -20px rgba(0, 0, 0, 0.5)`

## Typography

Two-font system: **Outfit** for display and page headings, **Inter** for everything else. **Geist Mono** for OTP input, customer phone identifiers, and payment link snippets.

- **Display (Outfit 60px/700):** Landing hero headline only — e.g. "Accept payments via WhatsApp — no app needed"
- **H1 (Outfit 36px/700):** Page titles — "Overview", "Withdrawals", "Welcome back"
- **H2 (Outfit 30px/700):** Section headings — "Why merchants love Tradechat", "How it works", "Recent Transactions"
- **H3 (Inter 18px/600):** Card titles — "Revenue", KPI card labels, panel headings
- **Body Large (Inter 18px/400):** Hero subtext, CTA section descriptions
- **Body Medium (Inter 14px/400):** Default body, table cells, form labels, nav items
- **Body Small (Inter 12px/400):** Timestamps, footnotes, badge-adjacent metadata, "Showing X of Y transactions"
- **Label Caps (Inter 12px/500, uppercase, tracked):** Form field labels — "WhatsApp Number", "Amount (₦)", "Bank"
- **KPI Value (Inter 30px/700):** Dashboard metric numbers — "₦87,500", "42", "94%"
- **Mono (Geist Mono 14px):** OTP input, customerIdentifier column, checkout link preview

**Currency:** Always prefix amounts with **₦** (Naira). Format with locale grouping — e.g. `₦87,500`.

## Layout

**Grid & max-width:**
- Landing content: max-width 768px (hero), 1024px (features), 1280px (feature grid)
- Dashboard main: max-width 1280px, centered, padding 32px (desktop) / 24px (mobile)
- Sidebar: fixed 240px width on desktop; overlay drawer on mobile

**Whitespace strategy:** Generous vertical rhythm. Section padding 80px (landing), 32px between dashboard sections (`space-y-8`). Card internal padding 24px. KPI grid gap 16px.

**Landing page structure (weight order):**
1. Nav — logo + "Merchant login →"
2. Hero — badge, headline, subtext, CTAs, **WhatsApp chat mock** (dominant visual)
3. Features — 3-column grid
4. How it works — numbered vertical steps
5. CTA — "Ready to get started?"
6. Footer

**Dashboard structure:**
1. Sidebar nav (Overview · Transactions · Withdrawals · Sign out)
2. Page header (title + subtitle)
3. KPI row (4 cards)
4. Revenue chart (7d / 30d toggle)
5. Transaction table (search, status filter, export)

**Responsive:** Single-column stack below 768px. KPI grid 1 → 2 → 4 columns. Withdrawals page: 2-column → 1-column.

## Elevation & Depth

Minimal literal shadows; depth comes from **surface layering** and **emerald glow**.

- **Level 0 — Page:** Flat `#0A0F1E` with optional blurred emerald/blue orb accents (opacity 5–10%, blur 128px)
- **Level 1 — Cards:** `surface` background + `border-default` + optional `card-glow` emerald shadow
- **Level 2 — Elevated panels:** Sidebar `#0D1117`, modals with `backdrop-blur-sm`
- **Level 3 — Interactive focus:** `ring-2 ring-emerald-500/40` on inputs; hover lifts via border brightening (`white/07` → `emerald-500/20`), not z-index jumps
- **CTA buttons:** `shadow-xl shadow-emerald-500/25`; hover scale 1.05 on landing CTAs only

## Shapes

Tradechat uses **soft, rounded geometry** throughout — no sharp corners (`--radius: 0` in shadcn base is overridden by Tailwind utility classes in practice).

- **Buttons & inputs:** 12px (`rounded-xl`)
- **Cards & panels:** 16px (`rounded-2xl`)
- **Hero chat mock outer frame:** 24px (`rounded-3xl`)
- **Chat bubbles:** 16px with one corner flattened (rounded-tl-sm inbound, rounded-tr-sm outbound)
- **Badges & pills:** Full radius
- **Logo mark:** 8px square with emerald gradient + "T" monogram

## Components

### Logo
Emerald gradient square (32×32 landing nav, 40×40 login) with white bold "T". Wordmark: "Tradechat" in white, bold, tracking-tight.

### Navigation
- **Landing nav:** Horizontal, border-bottom `border-subtle`, logo left, ghost emerald "Merchant login →" right
- **Dashboard sidebar:** Vertical list, 240px. Active item uses `nav-item-active` styling. Inactive: slate-400 text, hover white on `surface-hover`

### Buttons
- **Primary:** Emerald gradient fill, white semibold text, 12px radius, emerald shadow. Labels from codebase: "Open Dashboard →", "Sign in to Dashboard →", "Send OTP via WhatsApp →", "Sign in →", "Request Withdrawal", "Save Bank Account"
- **Secondary:** `surface` fill, `border-strong`, white text. Label: "See how it works"
- **Ghost:** Emerald tint background, emerald-400 text. Label: "Merchant login →"
- **Destructive hover:** Sign out — slate-500 default, red-400 on hover

### Cards & Containers
Glass-dark cards: 4% white background, 7% white border, 16px radius. KPI cards add colored icon square (36×36, 10% accent tint). Hover: border brightens subtly.

### Chat Mock (hero centerpiece)
Dark panel `#111827` containing alternating bubbles:
- **Inbound (customer):** Left-aligned, `chat-bubble-inbound`, timestamp in slate-500 10px
- **Outbound (merchant/bot):** Right-aligned, `chat-bubble-outbound`, includes inline payment link chip (`pay.nomba.com/checkout/…` in mono on white/20 background)

Real example copy from landing page:
- Customer: "Hi! I want 5 bags of basmati rice 🙏"
- Merchant: "Hello! That would be ₦87,500 for 5 bags. Here's your secure payment link 👇"
- Customer: "✅ Just paid! Thanks so much!"

### Forms & Inputs
Dark inputs on `surface-input` with `border-strong`. Focus: emerald ring at 40–50% opacity. Placeholders in slate-500. Error state: red-500/10 background, red-500/20 border, red-400 text.

Real labels: "WhatsApp Number", "6-digit OTP", "Amount (₦)", "Bank", "Account Number", "Account Name"

Real placeholders: "+2348012345678", "000000", "e.g. 10000", "0123456789", "As it appears on your account"

### Badges (transaction status)
Pill badges with tinted background + matching text + subtle border:

| Status enum | Label | Colors |
|---|---|---|
| PAID | Paid | success |
| AWAITING_PAYMENT | Awaiting | warning |
| PENDING_CONFIRMATION | Pending | slate-500/10 |
| FAILED | Failed | error |
| CANCELLED | Cancelled | slate-500/10 |

### KPI Cards
Four-up grid: Total Revenue (emerald), Total Transactions (blue), Success Rate (violet), Pending (amber). Each shows title, large value, subtitle.

Real subtitles: "From paid transactions", "All time", "{n} paid", "Awaiting payment"

### Revenue Chart
Area chart, emerald stroke `#10B981`, gradient fill fading to transparent. Toggle: 7d / 30d. Subtitle: "Paid transactions over time". Y-axis formatted as `₦{n}k`.

### Transaction Table
Columns: Item, Customer, Amount, Status, Date. Toolbar: search ("Search by item or customer…"), status filter ("All statuses"), "Export CSV" button. Footer: "Showing {n} of {m} transactions". Empty: "No transactions found."

### Withdrawal Panel
Tabbed: "Withdraw Funds" | "Bank Account". Shows "Available Balance", "Payout to" bank details, Nigerian bank select (23 banks from codebase). Footer note: "🔒 Beta feature — withdrawals are processed within 24 hours"

### Payment Verify
Centered card, three states:
- Loading: "Verifying payment…" + progress bar, "Auto-checking every 3 seconds"
- Success: "Payment Confirmed!" + confetti, receipt rows (Merchant, Item, Amount, Paid at)
- Failed: "Payment Failed" + error message + "Return to homepage"

Footer: "Powered by Tradechat"

## Do's and Don'ts

### Do
- Lead every marketing screen with the **WhatsApp conversation mock** — it is the product
- Use **real copy** from this document and the README; currency always in **₦**
- Keep the dark navy + emerald palette; inherit glass-card surfaces and soft radii
- Reflect the **transaction lifecycle** (Pending → Awaiting → Paid) in any status UI
- Use Nigerian English/Pidgin sparingly in bot-adjacent copy only ("Abeg", "No wahala") — matches Gemini system prompt voice
- Show Nomba attribution: "Powered by Nomba · Built for African Merchants"
- Organize dashboard as: KPIs → chart → transaction table (mirrors README priority: revenue, history, outstanding)

### Don't
- Don't invent features not in the repo: no product catalog UI, no tier/pricing page, no Clerk login (auth is WhatsApp OTP), no customer signup flow
- Don't use placeholder testimonials, fake merchant logos, or invented statistics
- Don't make the dashboard the hero on landing — chat-first, dashboard-second
- Don't introduce a light theme or colors outside the navy/emerald/semantic palette
- Don't use "TradeChat" and "Tradechat" interchangeably in UI — use **Tradechat** (matches existing web app)
- Don't show a dedicated Transactions page design unless implementing the route (nav links to `/transactions` but page does not exist yet; transaction table currently lives on Overview)

---

## Product Copy Reference

Use only this copy — nothing invented.

### Taglines & Headlines
- README: "WhatsApp-native sales tracking and checkout provisioning for Nigerian micro-businesses"
- Meta title: "Tradechat — Accept Payments via WhatsApp"
- Landing hero: "Accept payments via WhatsApp — no app needed"
- Landing subtext: "Tradechat turns your WhatsApp into a full payment terminal. Customers chat, you get paid — it's that simple."
- Badge: "Powered by Nomba · Built for African Merchants"

### Feature Cards
1. **WhatsApp-Native** — "Customers order and pay entirely within WhatsApp. No app download, no account creation."
2. **Instant Checkout** — "Our AI converts a chat message into a payment link in seconds, powered by Nomba checkout."
3. **Business Dashboard** — "Track revenue, monitor transactions, and withdraw earnings — all in one clean dashboard."

### How It Works
1. **Customer messages you** — 'They send a message on WhatsApp — e.g. "I want 3 bags of rice"'
2. **AI creates a payment link** — "Tradechat understands the order and generates a Nomba checkout link instantly"
3. **Payment confirmed** — "Customer pays, you get notified, and funds hit your balance in real-time"

### WhatsApp Bot Messages (backend)
- Confirm: "Confirm payment link details: 👤 Customer: … 📦 Item: … 💰 Total Amount: ₦… Reply: 1️⃣ for YES (Create Link) 2️⃣ for NO (Cancel)"
- Link ready: "✅ Payment Link Ready! … Send this link to collect payment: 👉 {link}"
- Cancel: "No wahala! Order cancelled. Whenever you ready for another order, just type am."
- Error: "❌ Ah, small network issue creating the payment link right now. Abeg try send the order again in a minute."
- Payment confirmed: "🎉 Payment Confirmed! 📦 Item: … 💰 Amount: ₦… Ref: …"
- Daily summary: "Good morning {businessName}! 🌞 Here is your sales summary for yesterday: ✅ Total Paid Orders: … 💰 Total Revenue: ₦… Have a blessed trading day ahead!"
- OTP: "Your Tradechat sign-in code is: *{otp}* This code expires in 5 minutes. Do not share it with anyone."

### Dashboard Labels
- Nav: Overview · Transactions · Withdrawals · Sign out
- Overview subtitle: "Your business at a glance"
- Withdrawals subtitle: "Manage your payout bank account and request withdrawals"
- Login: "Merchant Dashboard" · "Welcome back" · "Enter your WhatsApp number to receive a sign-in code." · "Only registered merchants can sign in."

### Screens to Generate

| Screen | Route | Priority |
|---|---|---|
| Landing page | `/` | P0 — chat mock hero |
| Merchant login (phone + OTP) | `/login` | P0 |
| Dashboard overview | `/dashboard` | P0 — KPIs + chart + table |
| Withdrawals | `/withdrawals` | P1 |
| Payment verification | `/payment/verify` | P1 — customer-facing |
| Transactions (full page) | `/transactions` | P2 — nav exists, page not yet built; mirror Overview table at full width |
