# TradeChat

> **WhatsApp-native sales tracking and checkout provisioning for Nigerian micro-businesses**
>
> DevCareer × Nomba Hackathon 2026

---

## What is TradeChat?

TradeChat turns a merchant's existing WhatsApp number into a full point-of-sale system. Merchants log sales in plain language via WhatsApp, the bot parses and confirms the transaction, generates a Nomba payment link or virtual account for the customer, and reconciles payment status via Nomba webhooks. A companion web dashboard surfaces sales history, revenue, and outstanding orders — while a daily summary is also pushed back into WhatsApp so merchants never have to leave the channel they already live in.

---

## Architecture

```
Customer/Merchant (WhatsApp)
        │
        ▼
Twilio WhatsApp Business API ──(webhook)──► NestJS Backend
                                                   │
                                    ┌──────────────┼───────────────┐
                                    ▼              ▼               ▼
                              Gemini (parsing)  PostgreSQL     Nomba API
                                                (Prisma)     (Checkout / VA)
                                                   │               │
                                                   ▼               ▼
                                          Next.js Dashboard   Nomba Webhooks
                                             (Vercel)         (payment status)
                                                                   │
                                                                   ▼
                                                        NestJS → Twilio → Merchant
```

**Core loop:**
1. Merchant sends a free-text sale message on WhatsApp
2. Twilio forwards it to a NestJS webhook endpoint
3. Gemini extracts structured data (item, qty, price, customer)
4. Bot echoes parsed data back for merchant confirmation
5. On confirmation, backend creates a Nomba checkout link / virtual account
6. Link is sent to the customer via the merchant
7. Nomba webhook fires on payment → backend updates transaction status
8. Confirmation messages sent to both merchant and customer
9. Dashboard and daily WhatsApp summary reflect the settled transaction

---

## Tech Stack

| Layer | Choice |
|---|---|
| Messaging | Twilio WhatsApp Business API |
| AI parsing | Google Gemini 1.5 Flash |
| Payments | Nomba Checkout API + Virtual Accounts + Webhooks |
| Backend | NestJS (Node.js / TypeScript) |
| ORM / DB | Prisma + PostgreSQL (Railway) |
| Cache / Queue | Upstash Redis + BullMQ |
| Dashboard | Next.js + Tailwind |
| Auth | Clerk |
| Hosting (backend) | Railway |
| Hosting (dashboard) | Vercel |

---

## Monorepo Structure

This is a [Turborepo](https://turborepo.dev) monorepo managed with [pnpm](https://pnpm.io).

```
tradechat/
├── apps/
│   ├── backend/     # NestJS API — webhook receiver, Nomba integration, BullMQ jobs
│   └── web/         # Next.js merchant dashboard
├── packages/
│   ├── ui/                  # Shared React component library
│   ├── eslint-config/       # Shared ESLint configuration
│   └── typescript-config/   # Shared tsconfig.json bases
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A PostgreSQL database (Railway recommended)
- An Upstash Redis instance

### Installation

```sh
git clone https://github.com/Harrylever/tradechat.git
cd tradechat
pnpm install
```

### Environment setup

Copy the example env file in the backend and fill in your credentials:

```sh
cp apps/backend/.env.example apps/backend/.env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | Sandbox number e.g. `whatsapp:+14155238886` |
| `GEMINI_API_KEY` | Google AI Studio key |
| `NOMBA_BASE_URL` | `https://sandbox.api.nomba.com/v1` (sandbox) |
| `NOMBA_ACCOUNT_ID` | Nomba parent account UUID |
| `NOMBA_CLIENT_ID` | Nomba OAuth client ID |
| `NOMBA_CLIENT_SECRET` | Nomba OAuth client secret |
| `NOMBA_WEBHOOK_SECRET` | Nomba webhook signature key |
| `REDIS_URL` | Upstash Redis URL |
| `API_SECRET` | Internal secret for dashboard ↔ backend calls |
| `PORT` | Server port (default `3001`) |

### Database

```sh
# Run migrations
cd apps/backend
pnpm dlx prisma migrate deploy

# Generate Prisma client
pnpm dlx prisma generate
```

---

## Development

Run all apps in parallel from the monorepo root:

```sh
turbo dev
```

Or target a specific app:

```sh
turbo dev --filter=backend
turbo dev --filter=web
```

---

## Building

```sh
# Build everything
turbo build

# Build a specific app
turbo build --filter=backend
```

---

## API

The backend exposes:

- `GET /health` — health check (no auth required)
- `POST /webhook/twilio` — inbound WhatsApp messages from Twilio
- `POST /webhook/nomba` — payment events from Nomba (HMAC verified)
- `GET /api/v1/docs` — Swagger UI
- `GET /api/v1/merchants/:id/transactions` — dashboard REST API
- `GET /api/v1/merchants/:id/transactions/stats` — revenue stats

---

## Hackathon

**Build window:** July 1–7, 2026
**Submission deadline:** July 18, 2026
**Track:** Infrastructure

### Success criteria
- [ ] Merchant onboards entirely via WhatsApp in under 5 minutes
- [ ] A sale message produces a live Nomba checkout link within 60 seconds
- [ ] Nomba webhook triggers merchant confirmation within 10 seconds of payment
- [ ] Dashboard reflects real-time transaction data
- [ ] Daily WhatsApp summary sends on schedule

---

## Author

| Name | Role |
|---|---|
| Dean | Full-stack / AI integration |
