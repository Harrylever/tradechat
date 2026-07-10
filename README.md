# TradeChat

> **WhatsApp-native sales tracking and checkout provisioning for Nigerian micro-businesses**
>
> DevCareer × Nomba Hackathon 2026

[![Watch Live Demo Video](https://img.shields.io/badge/🎥%20Watch%20Live%20Demo%20Video-Loom-625df5?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/b6165fd758a945fabf51055635ee037c)

> **[📺 Click here to watch the Tradechat Live Demo Video](https://www.loom.com/share/b6165fd758a945fabf51055635ee037c)**

---

## What is TradeChat?

TradeChat turns a merchant's existing WhatsApp number into a full point-of-sale system. Merchants log sales in plain language via WhatsApp, the bot parses and confirms the transaction, generates a Nomba payment link or virtual account for the customer, and reconciles payment status via Nomba webhooks. A companion web dashboard surfaces sales history, revenue, and outstanding orders — while a daily summary is also pushed back into WhatsApp so merchants never have to leave the channel they already live in.

---

## Architecture

> 📖 **Full Architecture & Security Note:** For a deep-dive technical breakdown of our WhatsApp/Magic Link authentication, HMAC-SHA256 webhook signature verification (`NombaSignatureGuard`), idempotency guarantees (`WebhookAuditService`), and our ACID double-entry financial ledger (`LedgerService`), see our **[Architecture and Security Documentation](./ARCHITECTURE_AND_SECURITY.md)**.

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

| Layer               | Choice                                           |
| ------------------- | ------------------------------------------------ |
| Messaging           | Twilio WhatsApp Business API                     |
| AI parsing          | Google Gemini 2.5 Flash (`@google/genai`)        |
| Payments            | Nomba Checkout API + Virtual Accounts + Webhooks |
| Backend             | NestJS (Node.js 24 / TypeScript)                 |
| ORM / DB            | Prisma + PostgreSQL                              |
| Cache / Queue       | Upstash Redis + BullMQ                           |
| Dashboard           | Next.js 16 + Tailwind CSS v4 + Shadcn UI         |
| Auth                | Custom WhatsApp OTP + Magic Links (JWT/Cookies)  |
| Monitoring          | Sentry (APM & Profiling) + Logtail / Winston     |
| Hosting (backend)   | Railway                                          |
| Hosting (dashboard) | Vercel                                           |

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

Copy the example environment files for both the backend API and the web dashboard:

```sh
# Backend setup
cp apps/backend/.env.example apps/backend/.env

# Web dashboard setup
cp apps/web/.env.example apps/web/.env.local
```

#### Backend Environment (`apps/backend/.env`)

| Variable                 | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string                      |
| `TWILIO_ACCOUNT_SID`     | Twilio account SID                                |
| `TWILIO_AUTH_TOKEN`      | Twilio auth token                                 |
| `TWILIO_WHATSAPP_NUMBER` | Twilio sender number e.g. `whatsapp:+14155238886` |
| `GEMINI_API_KEY`         | Google AI Studio API key                          |
| `NOMBA_ACCOUNT_ID`       | Nomba parent account UUID                         |
| `NOMBA_SUBACCOUNT_ID`    | Nomba sub-account UUID                            |
| `NOMBA_CLIENT_ID`        | Nomba OAuth client ID                             |
| `NOMBA_CLIENT_SECRET`    | Nomba OAuth client secret                         |
| `NOMBA_WEBHOOK_SECRET`   | Nomba webhook signature key                       |
| `NOMBA_DEFAULT_EMAIL`    | Default customer email (e.g. `orders@...`)        |
| `REDIS_URL`              | Upstash Redis connection string                   |
| `SENTRY_DSN`             | Sentry error monitoring DSN                       |
| `LOGTAIL_SOURCE_TOKEN`   | Better Stack / Logtail source token               |
| `LOGTAIL_INGESTING_HOST` | Logtail ingesting host                            |
| `JWT_SECRET`             | Internal secret for dashboard ↔ backend auth      |
| `JWT_EXPIRES_IN`         | JWT expiration duration (e.g. `7d`)               |
| `WEB_APP_URL`            | Web dashboard URL (e.g. `http://localhost:3000`)  |
| `ALLOWED_ORIGINS`        | CORS allowed origins comma-separated list         |
| `PORT`                   | Server port (default `3001` or `3002`)            |

#### Web Dashboard Environment (`apps/web/.env.local`)

| Variable                          | Description                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`             | Base URL of the backend API (default `http://localhost:3001`)               |
| `NEXT_PUBLIC_WHATSAPP_BOT_NUMBER` | WhatsApp bot contact number without `+` or `whatsapp:` (e.g. `14155238886`) |

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

The backend exposes a REST API with a global `api/v1` prefix and Swagger documentation:

- **Documentation & Health**
  - `GET /api/v1/docs` — Interactive Swagger UI
  - `GET /api/v1/health` — Service health check

- **Webhooks (No Auth / Signature Verified)**
  - `POST /api/v1/webhook/twilio` — Inbound WhatsApp messages & status updates from Twilio
  - `POST /api/v1/webhook/nomba` — Payment event webhooks from Nomba (HMAC signature verified)

- **Authentication (`/api/v1/auth`)**
  - `POST /api/v1/auth/otp/request` — Request a WhatsApp one-time password (OTP)
  - `POST /api/v1/auth/otp/verify` — Verify OTP and receive JWT session cookie / token
  - `POST /api/v1/auth/magic/consume` — Consume a single-use magic link token

- **Merchants (`/api/v1/merchants`)**
  - `GET /api/v1/merchants/me` — Get authenticated merchant profile
  - `GET /api/v1/merchants/me/stats` — Get sales volume, success rates, and transaction counts
  - `PATCH /api/v1/merchants/me` — Update merchant profile and Nomba settings

- **Transactions (`/api/v1/transactions`)**
  - `GET /api/v1/transactions/me` — List transactions filtered by status or limit
  - `GET /api/v1/transactions/:id` — Get single transaction details and webhook audit trail

- **Withdrawals & Bank Accounts (`/api/v1/withdrawals`)**
  - `GET /api/v1/withdrawals/me/balance` — Get available balance in Naira
  - `POST /api/v1/withdrawals` — Submit a payout / withdrawal request
  - `GET /api/v1/withdrawals/me` — List withdrawal request history
  - `GET /api/v1/withdrawals/me/bank-account` — Get saved settlement bank account
  - `PUT /api/v1/withdrawals/me/bank-account` — Save or update settlement bank account details

---

## Hackathon

**Build window:** July 1–7, 2026
**Submission deadline:** July 18, 2026
**Track:** Build Track - Virtual accounts as Infrastructure, Integrations & Plugins

### Success criteria

- [ ] Merchant onboards entirely via WhatsApp in under 5 minutes
- [ ] A sale message produces a live Nomba checkout link within 60 seconds
- [ ] Nomba webhook triggers merchant confirmation within 10 seconds of payment
- [ ] Dashboard reflects real-time transaction data
- [ ] Daily WhatsApp summary sends on schedule

### Submission Artifacts

- 📄 **[Architecture and Security Note](./ARCHITECTURE_AND_SECURITY.md)** — Exhaustive technical breakdown of authentication, HMAC webhook signature verification, data isolation, and our ACID double-entry ledger model.
- 🎥 **[Live Demo Video](https://www.loom.com/share/b6165fd758a945fabf51055635ee037c)** — 2-3 minute walkthrough of the WhatsApp bot and merchant dashboard.
- 🎨 **[Design System & Guidelines](./DESIGN.md)** — Visual design tokens, typography, and UI guidelines.

---

## **Steps to Test**

> **Note:** We're supposed to include testing credentials, and I honestly wish I could — but this is not that kind of application. TradeChat is built on real infrastructure that requires live WhatsApp numbers, active Nomba merchant accounts, and Twilio webhooks — things that can't meaningfully be mocked with a static test login. The best honest way to evaluate it is to watch the live demo and, if you have access to the stack, spin it up yourself with real credentials.

1. **Watch the Live Demo Video** — Start here. The [Loom walkthrough](https://www.loom.com/share/b6165fd758a945fabf51055635ee037c) covers the full merchant flow end-to-end: WhatsApp onboarding, sale logging, Nomba checkout link generation, payment confirmation, and dashboard view.

2. **Review the Architecture** — Read the [Architecture and Security Documentation](./ARCHITECTURE_AND_SECURITY.md) for a full breakdown of how the system handles authentication, HMAC webhook signature verification, idempotency, and the ACID double-entry ledger.

3. **Spin up the backend locally** — Clone the repo, copy the environment files (`apps/backend/.env.example` → `.env`), fill in your own credentials for Twilio, Nomba, Gemini, PostgreSQL, and Redis, then run:
   ```sh
   pnpm install
   cd apps/backend && pnpm dlx prisma migrate deploy
   turbo dev --filter=backend
   ```

4. **Expose your local server via ngrok** — Nomba and Twilio webhooks need a publicly reachable URL. Use [ngrok](https://ngrok.com) or a similar tunnel to expose your local port and update your Twilio and Nomba webhook settings accordingly.

5. **Send a sale message on WhatsApp** — Using a WhatsApp number linked to your Twilio sandbox, message the bot in plain language (e.g. *"Sold 2 bags of rice to Chidi for 8500"*). Confirm the parsed result when the bot echoes it back.

6. **Complete a test payment** — Use the Nomba checkout link or virtual account number generated by the bot to make a real or sandbox payment. Watch for the confirmation messages to come back through WhatsApp.

7. **Open the merchant dashboard** — Navigate to the web app, log in via WhatsApp OTP, and verify that the transaction appears with the correct status and ledger entry.

---

## Author

| Name | Role                        |
| ---- | --------------------------- |
| Dean | Full-stack / AI integration |
