# Tradechat Architecture and Security Note

> **Comprehensive Technical Architecture, Authentication Strategy, Webhook Security, and Data Integrity Model**  
> **DevCareer × Nomba Hackathon 2026** — _Build Track: Virtual Accounts as Infrastructure, Integrations & Plugins_

---

## Executive Summary

**Tradechat** turns a merchant's existing WhatsApp number into an automated point-of-sale (POS) and checkout provisioning engine for Nigerian micro-businesses. Built on top of **Nomba's payment and virtual account infrastructure**, Tradechat enables merchants to log sales in plain natural language on WhatsApp, automatically parses item details via **Google Gemini 2.5 Flash**, provisions instant payment links or dedicated virtual accounts (`aliasAccountNumber`), and reconciles settlement status in real time via **HMAC-secured webhooks**.

This note outlines the core architectural choices, security guards, authentication flows, and data handling models implemented across the Tradechat monorepo (`apps/backend` NestJS API and `apps/web` Next.js dashboard).

---

## 1. System Architecture & Data Flow

Tradechat operates across a decoupled, asynchronous microservice architecture engineered for high availability, zero message loss, and idempotent transaction processing.

```mermaid
graph TD
    %% Actors & External Systems
    Merchant["🧑‍💼 Merchant (WhatsApp)"]
    Customer["🧑‍🛍️ Customer (WhatsApp / Web)"]
    Twilio["📲 Twilio WhatsApp API"]
    Nomba["💳 Nomba Payments API & Webhooks"]
    Gemini["🤖 Google Gemini 2.5 Flash"]

    %% Backend Layers
    subgraph Backend ["🏢 NestJS Backend (Node.js / TypeScript)"]
        TwilioController["Webhooks - Twilio Controller<br/>POST /api/v1/webhook/twilio"]
        NombaController["Webhooks - Nomba Controller<br/>POST /api/v1/webhook/nomba"]
        AuthModule["🔐 Auth Module<br/>(WhatsApp OTP & Magic Links)"]
        LedgerService["⚖️ Ledger Service<br/>(ACID Double-Entry Engine)"]
        WebhookAudit["🛡️ Webhook Audit Service<br/>(Idempotency & Deduplication)"]
    end

    %% Storage & Caching
    subgraph Infrastructure ["🗄️ Persistence & Infrastructure"]
        Postgres[(PostgreSQL + Prisma ORM<br/>Transactions & Ledger)]
        Redis[(Upstash Redis<br/>BullMQ & OTP Cache)]
    end

    %% Web Dashboard
    Dashboard["📊 Next.js 16 Web Dashboard<br/>(Vercel + Tailwind CSS v4)"]

    %% Flow Connections
    Merchant <-->|WhatsApp Messages| Twilio
    Twilio -->|X-Twilio-Signature Verified| TwilioController
    TwilioController <-->|Natural Language Parsing| Gemini
    TwilioController -->|Create Pending Order| Postgres
    TwilioController -->|Provision Checkout / VA| Nomba

    Customer -->|Pays via Bank Transfer/Card| Nomba
    Nomba -->|HMAC-SHA256 Signature Verified| NombaController
    NombaController -->|1. Record Event| WebhookAudit
    WebhookAudit -->|Unique Idempotency Key| Postgres
    NombaController -->|2. Atomic Credit| LedgerService
    LedgerService -->|Update Balance & Ledger| Postgres
    NombaController -->|3. Send Confirmation| Twilio

    Dashboard <-->|HttpOnly JWT Cookies / Bearer| AuthModule
    Dashboard <-->|Real-time Stats & History| Postgres
```

### Core Architecture Layers

1. **Edge & Messaging Layer (`Twilio WhatsApp API`)**: Acts as the conversational interface for merchants and buyers. Inbound webhook payloads from Twilio are received by the NestJS API, parsed, and routed to appropriate state handlers.
2. **AI & Natural Language Processing (`Google Gemini 2.5 Flash`)**: Extracts structured transaction primitives (`itemDescription`, `quantity`, `unitPrice`, and `customerIdentifier`) from unstructured free-text messages (e.g., _"Sold 3 bags of rice to 08012345678 for 45000"_).
3. **Infrastructure & Payment Provisioning (`Nomba API`)**: Dynamically provisions unique checkout links and virtual accounts (`vact_transfer` / `aliasAccountReference`) per order or merchant, enabling automated bank-transfer reconciliation.
4. **ACID Persistence & Caching (`PostgreSQL + Upstash Redis`)**: PostgreSQL handles relational data, transaction lifecycles, double-entry financial ledgers, and webhook audit trails via **Prisma ORM**. Upstash Redis provides distributed caching, rate-limiting, OTP storage, and background task queues (**BullMQ**).
5. **Merchant Dashboard (`Next.js 16`)**: Surfaces real-time transaction monitoring, daily revenue analytics, withdrawal management, and account settings.

---

## 2. Authentication Architecture (`Auth`)

Tradechat employs a **Multi-Modal Authentication Strategy** tailored to low-friction merchant onboarding while maintaining strict cryptographic security across all endpoints.

```
┌────────────────────────────────────────────────────────────────────────┐
│               Tradechat Multi-Modal Authentication Flow                │
└────────────────────────────────────────────────────────────────────────┘

 1. WhatsApp OTP (Chat-First Onboarding & Login)
 ───────────────────────────────────────────────
 [Merchant] ──(POST /auth/otp/request)──► [AuthController]
                                                │
                                                ▼
                                         [Normalize Phone (+234...)]
                                                │
                                                ▼
                                         [Generate 6-Digit OTP]
                                                │
                                                ▼
                                    [Store in Redis: 300s TTL]
                                                │
                                                ▼
 [Merchant] ◄──(Twilio WhatsApp SMS/Chat)───────┘
     │
     └──(POST /auth/otp/verify with OTP)──► [Redis/Memory Store Check]
                                                │
                                                ▼
                                         [Delete OTP (Single-Use)]
                                                │
                                                ▼
                                         [Sign JWT Access Token] ──► [Return Token / Cookie]


 2. Single-Use Magic Links (One-Click Dashboard Login)
 ─────────────────────────────────────────────────────
 [Backend] ──(crypto.randomBytes(32))──► [Store in Redis: 600s TTL] ──► [WhatsApp Magic Link]
                                                                               │
 [Merchant Click] ──(POST /auth/magic/consume) ──► [Check Redis & Delete] ◄────┘
                                                          │
                                                          ▼
                                                   [Sign & Issue JWT]
```

### A. WhatsApp-Native One-Time Password (OTP)

To eliminate passwords and align with the merchant's primary communication channel, sign-in is driven entirely by WhatsApp verification (`AuthService` & `AuthController`):

- **Phone Normalization & Lookup**: Inbound phone numbers are rigorously normalized (`normalizePhoneNumber`) to E.164 international standard (`+234...`). The system verifies merchant existence or triggers instantaneous WhatsApp-first onboarding (`findOrCreateByPhone`).
- **Cryptographically Secure OTP Generation**: A 6-digit verification code (`Math.floor(100000 + Math.random() * 900000)`) is generated dynamically upon request (`POST /api/v1/auth/otp/request`).
- **Short-Lived Expiration & Single-Use Enforcement**:
  - The OTP is persisted to **Upstash Redis** (`auth:otp:{whatsappNumber}`) with a strict **5-minute (300 seconds) TTL** alongside an in-memory fallback map (`otpStore`).
  - Upon verification (`POST /api/v1/auth/otp/verify`), the stored timestamp is validated (`Date.now() > stored.expiresAt`). Once verified, the key is **instantly deleted from both Redis and memory (`redisService.del(key)`) to enforce single-use and completely eliminate replay attacks**.
- **Brute-Force & Rate Limiting Protection**:
  - Endpoints are shielded by **NestJS Throttler** (`@Throttle({ default: { ttl: 600000, limit: 3 } })`), restricting requests to a maximum of 3 OTP requests and 5 verification attempts per 10-minute window.
  - A custom `PhoneAwareThrottlerGuard` tracks requests by combining client IP address and target WhatsApp phone number (`${req.ip}:${phone}`), preventing distributed brute-force attempts against a single merchant number.

### B. Single-Use Magic Links

For seamless transitions from WhatsApp chat to the web dashboard, Tradechat generates secure single-use magic links (`MagicLinkService`):

- **High-Entropy Token Generation**: 256-bit secure random tokens are generated via `crypto.randomBytes(32).toString('hex')`.
- **Redis State & Atomic Consumption**: Tokens are stored in Redis (`magiclink:{token}`) with a **10-minute (600 seconds) TTL**. When consumed (`POST /api/v1/auth/magic/consume`), the token is **instantly deleted (`redisService.del(key)`)** prior to issuing session credentials, guaranteeing that stolen or re-clicked links cannot be reused.

### C. JWT Access Tokens & Session Management

- **Stateless & Scoped Claims**: Upon successful OTP or magic link verification, the backend issues a signed **JSON Web Token (JWT)** (`jwtService.sign(payload)`). The payload contains strictly minimal, non-sensitive claims (`sub: merchantId`, `whatsappNumber`).
- **Protected Route Guards (`JwtAuthGuard`)**: All protected REST endpoints (`/api/v1/merchants/*`, `/api/v1/transactions/*`, `/api/v1/withdrawals/*`) require a valid JWT passed via `Authorization: Bearer <token>` or `HttpOnly, Secure, SameSite` cookies. If a token is expired, forged, or tampered with, `UnauthorizedException` is thrown immediately.

### D. Nomba API OAuth & Secret Management

- **Strict Environment Isolation**: All sensitive credentials (`NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, `NOMBA_ACCOUNT_ID`, `NOMBA_SUBACCOUNT_ID`, `NOMBA_WEBHOOK_SECRET`) are loaded exclusively from server-side environment variables via `@nestjs/config`.
- **Automated Token Acquisition & Caching**: External API requests to Nomba utilize OAuth 2.0 Client Credentials grants. Acquired access tokens are cached in memory/Redis and automatically refreshed prior to expiration, ensuring seamless API communication without exposing static credentials.

---

## 3. Webhook Architecture & Security (`Webhooks`)

Webhooks are the heartbeat of Tradechat, handling asynchronous payment confirmations from **Nomba** and conversational messages from **Twilio**. Because webhooks are publicly accessible endpoints (`POST /api/v1/webhook/*`), they are hardened against unauthorized access, replay attacks, man-in-the-middle (MitM) tampering, and duplicate deliveries.

```
Inbound Webhook Request (Nomba / Twilio)
                   │
                   ▼
     ┌──────────────────────────┐
     │  1. Signature Verification│
     │  (NombaSignatureGuard /  │
     │   TwilioWebhookGuard)    │
     └─────────────┬────────────┘
                   │ [HMAC-SHA256 & Timing-Safe Check]
                   ▼
     ┌──────────────────────────┐
     │  2. Atomic Audit Logging │
     │  (WebhookAuditService)   │
     └─────────────┬────────────┘
                   │ [Idempotency Key / P2002 Unique Check]
                   ▼
     ┌──────────────────────────┐
     │  3. Business Processing  │
     │  (Order Match & Credit)  │
     └─────────────┬────────────┘
                   │ [Fast HTTP 200 Acknowledgment]
                   ▼
     ┌──────────────────────────┐
     │  4. Async Notifications  │
     │  (WhatsApp Buyer & Seller│
     └──────────────────────────┘
```

### A. Nomba HMAC-SHA256 Signature Verification (`NombaSignatureGuard`)

Inbound payment events from Nomba (`POST /api/v1/webhook/nomba`) are intercepted by a dedicated security guard (`NombaSignatureGuard`) before reaching any controller logic:

1. **Header Inspection**: The guard extracts mandatory headers: `nomba-signature` (base64 HMAC digest) and `nomba-timestamp`. Missing headers trigger an immediate `401 Unauthorized`.
2. **Canonical Payload Reconstruction**: The guard reconstructs the exact canonical hashing string defined by Nomba specifications by joining critical payload properties with colons (`:`):
   ```typescript
   const hashingPayload = [
     eventType, // e.g. 'transfer_success' or 'payment_success'
     requestId, // e.g. unique delivery UUID
     userId, // e.g. merchant user ID
     walletId, // e.g. Nomba wallet ID
     transactionId, // e.g. Nomba core transaction ID
     transactionType, // e.g. 'vact_transfer'
     transactionTime, // ISO timestamp string
     responseCode, // e.g. '00' or normalized empty string
     timestampHeader, // From 'nomba-timestamp' header
   ].join(':')
   ```
3. **HMAC-SHA256 Digest Calculation**: Using the server-side `NOMBA_WEBHOOK_SECRET`, the guard computes the expected cryptographic signature:
   ```typescript
   const expectedSignature = crypto
     .createHmac('sha256', secret)
     .update(hashingPayload)
     .digest('base64')
   ```
4. **Timing-Safe Comparison (`crypto.timingSafeEqual`)**: To prevent **Timing Side-Channel Attacks** (where an attacker deduces signature bytes by measuring string comparison execution times), the expected and received base64 buffers are compared using fixed-time cryptographic equality:
   ```typescript
   const receivedBuffer = Buffer.from(signatureHeader, 'base64')
   const expectedBuffer = Buffer.from(expectedSignature, 'base64')
   const isValid =
     receivedBuffer.length === expectedBuffer.length &&
     crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
   ```

### B. Twilio WhatsApp Request Validation (`TwilioWebhookGuard`)

For inbound WhatsApp messages (`POST /api/v1/webhook/twilio`), `TwilioWebhookGuard` verifies the `X-Twilio-Signature` header against the exact public URL and form parameters (`request.body`) using Twilio's cryptographic validation utility (`twilio.validateRequest(authToken, signature, url, params)`). In production (`NODE_ENV === 'production'`), any request with a mismatched signature is rejected immediately (`401 Unauthorized`).

### C. Idempotency, Deduplication & Replay Protection (`WebhookAuditService`)

Network timeouts and provider retries can cause identical webhooks to be delivered multiple times. Tradechat guarantees **Exactly-Once Processing** via database-enforced idempotency:

- **Immutable Audit Logging**: Before executing payment updates, `WebhookAuditService.recordIfNew()` records the full JSON payload inside the `WebhookEvent` table using a unique `idempotencyKey` (derived from Nomba's `requestId` or `api_rrn`).
- **Database-Level Deduplication (`Prisma.P2002`)**: The `WebhookEvent.idempotencyKey` column has a strict `@unique` database index. If a webhook is redelivered, PostgreSQL throws a unique constraint violation (`Prisma.P2002`). The service catches this exception, logs a warning (`Duplicate webhook delivery ignored: ${requestId}`), and immediately returns `true` to the controller.
- **Fast Acknowledgment (`HTTP 200 OK`)**: The controller returns `{ received: true, status: 'already_processed' }` (`@HttpCode(HttpStatus.OK)`), preventing Nomba from retrying the event while ensuring balance crediting logic is executed **exactly once**.

### D. Multi-Reference Reconciliation Engine

Nomba webhooks carry transaction references across different fields depending on the payment rail (Checkout Links vs. Virtual Account Transfers). `NombaWebhookController` and `NombaCollectionWebhookHandler` implement a robust reference resolution cascade:

- **Reference Resolution Cascade**: Searches for matching transactions using `orderReference`, `merchantTxRef`, `aliasAccountReference`, `aliasAccountNumber`, or `transferId` across both `Transaction` and `Withdrawal` models.
- **Dynamic Virtual Account Resolution**: When money lands in a Nomba virtual account (`event_type: payment_success`, `type: vact_transfer`), the handler checks Path (a): dynamic VAs provisioned per order (`virtualAccountReference`). If matched, the specific transaction is marked as `PAID`. If Path (b) (static merchant VA) is used, the system safely credits the merchant's wallet (`creditUnmatchedToMerchantWallet`) and flags the transaction for conversational reconciliation in WhatsApp.

---

## 4. Data Handling, Integrity & Financial Security (`Data Handling`)

Handling merchant funds and transaction records requires absolute data integrity, race-condition immunity, and strict precision.

```
┌────────────────────────────────────────────────────────────────────────┐
│             ACID Double-Entry Financial Ledger Transaction             │
└────────────────────────────────────────────────────────────────────────┘

 [Nomba Payment Success / Withdrawal Request]
                      │
                      ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │ prisma.$transaction(async (tx) => {                                  │
 │                                                                      │
 │   1. Atomic Balance Mutation (Check Constraint & Lock)               │
 │      UPDATE "Merchant"                                               │
 │      SET "balanceNaira" = "balanceNaira" + amountNaira               │
 │      WHERE "id" = merchantId                                         │
 │      -- (For Withdrawals: WHERE "balanceNaira" >= amountNaira)        │
 │                                                                      │
 │   2. Immutable Double-Entry Ledger Creation                          │
 │      INSERT INTO "LedgerEntry" ("merchantId", "type", "amountNaira", │
 │        "balanceBeforeNaira", "balanceAfterNaira", "transactionId")   │
 │      VALUES (...)                                                    │
 │                                                                      │
 │ }); -- ATOMIC COMMIT OR FULL ROLLBACK                                 │
 └──────────────────────────────────────────────────────────────────────┘
```

### A. ACID-Compliant Double-Entry Ledger System (`LedgerService`)

To eliminate balance drift, race conditions, or partial updates, all financial mutations are managed by an immutable double-entry ledger (`LedgerService`):

- **Atomic Database Transactions (`prisma.$transaction`)**: Balance changes never occur in isolation. When crediting an order (`creditForPaidTransaction`), debiting a withdrawal (`debitForWithdrawal`), or refunding a failed payout (`creditForFailedWithdrawal`), both the `Merchant.balanceNaira` mutation and the `LedgerEntry` insertion occur inside an atomic PostgreSQL transaction block (`prisma.$transaction(async (tx) => { ... })`). If either query fails, the entire transaction rolls back cleanly.
- **Immutable Double-Entry Audit Trail**: Every monetary movement records a permanent `LedgerEntry` containing:
  - `type`: `CREDIT` or `DEBIT`
  - `amountNaira`: Exact transaction amount
  - `balanceBeforeNaira`: Merchant balance before operation
  - `balanceAfterNaira`: Merchant balance after operation
  - **1:1 Relational Integrity**: Each ledger entry is linked exclusively to either a `Transaction` (`@unique transactionId`) or a `Withdrawal` (`@unique withdrawalId`), guaranteeing complete auditability during reconciliation.
- **Immunity Against Double-Spending & Race Conditions**: For withdrawal requests (`debitForWithdrawal`), the database query enforces an atomic conditional decrement:
  ```typescript
  const result = await tx.merchant.updateMany({
    where: { id: merchantId, balanceNaira: { gte: amountNaira } },
    data: { balanceNaira: { decrement: amountNaira } },
  })
  if (result.count === 0) {
    throw new BadRequestException('Insufficient balance')
  }
  ```
  If two concurrent withdrawal requests attempt to drain a balance simultaneously, the PostgreSQL row lock and `balanceNaira: { gte: amountNaira }` condition guarantee that only the first request succeeds while the second is cleanly rejected (`Insufficient balance`), preventing negative balances or double-spending.

### B. Precise Decimal Currency Handling (`Decimal(12, 2)`)

Standard JavaScript `number` (IEEE 754 double-precision floating-point) suffers from rounding anomalies (e.g., `0.1 + 0.2 === 0.30000000000000004`). In financial systems, this can lead to cent/kobo discrepancies across thousands of transactions:

- **PostgreSQL Fixed Decimal Types**: All monetary fields across Tradechat (`Merchant.balanceNaira`, `Product.defaultPrice`, `Transaction.unitPrice`, `Transaction.totalAmount`, `Withdrawal.amountNaira`, `LedgerEntry.amountNaira`) are modeled explicitly as exact **`Decimal(12, 2)`** (and `Decimal(10, 2)` for quantities) inside `schema.prisma`.
- **Exact Math Operations**: Prisma deserializes these fields into `Decimal.js` instances. All financial calculations (`balanceAfterNaira.minus(amountNaira)`, `balanceAfterNaira.plus(amountNaira)`) utilize arbitrary-precision decimal mathematics or atomic database `increment` / `decrement` operators, ensuring **100% precision down to the exact kobo**.

### C. Multi-Tenant Data Isolation & Privacy

- **Strict Row-Level Ownership**: All query methods across `MerchantService`, `LedgerService`, and transaction endpoints enforce `merchantId` filtering derived from the authenticated JWT `sub` claim (`req.user.id`). Merchants cannot view, query, or mutate transactions, ledger entries, bank accounts, or customer records belonging to another tenant.
- **PII & Sensitive Data Protection**: Customer WhatsApp numbers (`customerIdentifier`) and merchant bank details (`BankAccount` model containing `accountNumber`, `bankCode`, `accountName`) are isolated per tenant and protected from exposure via strict serialization transformations before returning API responses (`class-transformer` / DTO filtering).

### D. AI Prompt Injection & Input Validation (`Google Gemini 2.5 Flash`)

Because merchants input free-text descriptions into WhatsApp, the system treats all incoming text as untrusted user input before passing it to `Google Gemini 2.5 Flash`:

- **Structured JSON Schema Enforcement**: Prompt payloads instruct Gemini to output strictly structured JSON matching predefined validation schemas (`itemDescription`, `quantity`, `unitPrice`).
- **Human-in-the-Loop Confirmation**: Gemini outputs are never persisted as finalized `PAID` transactions directly. Instead, the bot creates a temporary transaction in `PENDING_CONFIRMATION` state and echoes the parsed details back to the merchant on WhatsApp (e.g., _"Parsed: 3x Rice @ ₦15,000 = ₦45,000. Reply YES to confirm or NO to cancel"_). Only explicit affirmative merchant confirmation triggers Nomba checkout link or Virtual Account generation (`TransactionStatus.AWAITING_PAYMENT`).
- **Sanitization & Boundary Checking**: Numeric quantities and unit prices returned by the AI model undergo strict boundary verification (`quantity > 0`, `unitPrice >= 0`) and length limits before database insertion, mitigating prompt injection or malformed output risks.

---

## 5. Security & Architectural Summary Table

| Architectural Area   | Security / Engineering Control   | Implementation Mechanism / File Reference                                                                                                                         |
| :------------------- | :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**   | WhatsApp-Native OTP              | Cryptographic 6-digit OTP stored in Upstash Redis with 300s TTL (`AuthService.requestOtp`).                                                                       |
| **Authentication**   | Single-Use Enforcement           | Instantaneous deletion (`redisService.del(key)`) upon verification or magic link consumption (`AuthService.verifyOtp`, `MagicLinkService.consumeMagicLink`).      |
| **Authentication**   | Rate Limiting & Anti-Brute Force | `@Throttle({ ttl: 600000, limit: 3 })` + `PhoneAwareThrottlerGuard` tracking IP + Phone (`AuthController`).                                                       |
| **Authentication**   | Stateless API Access             | Signed JWT access tokens with non-sensitive claims (`sub: merchantId`), verified via `JwtAuthGuard`.                                                              |
| **Webhook Security** | HMAC-SHA256 Signature Check      | Canonical string reconstruction + `crypto.createHmac('sha256', secret)` check (`NombaSignatureGuard`).                                                            |
| **Webhook Security** | Timing Side-Channel Protection   | Fixed-time buffer comparison using `crypto.timingSafeEqual(receivedBuffer, expectedBuffer)` (`NombaSignatureGuard`).                                              |
| **Webhook Security** | Exactly-Once Idempotency         | Atomic recording (`WebhookAuditService.recordIfNew`) + `@unique` database constraint on `idempotencyKey` catching `Prisma.P2002`.                                 |
| **Data Integrity**   | ACID Double-Entry Ledgers        | Atomic `prisma.$transaction` blocks creating `LedgerEntry` alongside `Merchant.balanceNaira` updates (`LedgerService`).                                           |
| **Data Integrity**   | Race-Condition Immunity          | Conditional atomic updates (`balanceNaira: { gte: amountNaira }` + `decrement`) preventing negative balance or double-spend (`LedgerService.debitForWithdrawal`). |
| **Data Integrity**   | Precise Currency Calculation     | Exact `Decimal(12, 2)` / `Decimal(10, 2)` PostgreSQL schema types eliminating IEEE 754 floating-point rounding errors (`schema.prisma`).                          |
| **Multi-Tenancy**    | Tenant Isolation                 | Strict `merchantId` ownership filtering derived across all queries from JWT `req.user.id`.                                                                        |
| **AI Safety**        | Prompt Injection & Verification  | Strict JSON schema parsing + Human-in-the-Loop WhatsApp confirmation state (`PENDING_CONFIRMATION`) before provisioning Nomba checkouts.                          |

---

## 6. Verification & Audit Trail

Every transaction lifecycle event and webhook delivery is fully audited and traceable:

- **Interactive API Documentation & Swagger**: Available at `GET /api/v1/docs` in development/staging environments for transparent endpoint verification.
- **Health & Monitoring Check**: `GET /api/v1/health` provides real-time service uptime verification.
- **Complete Audit Histories**: `GET /api/v1/transactions/:id` and `GET /api/v1/withdrawals/me` return comprehensive transaction details and historical audit trails, ensuring complete operational transparency and readiness for production deployment at scale.
