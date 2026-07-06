# TradeChat — QR Onboarding & Magic-Link Handoff: Implementation Plan

**Scope:** A `/get-started` web route that lets a prospective merchant with no
account begin onboarding entirely via WhatsApp — by scanning a QR code or
tapping a link, sending a pre-filled message to the TradeChat WhatsApp
number, and completing a short guided conversation that captures their name,
business name, and product category. On completion, the merchant is hqanded a
single-use magic link that logs them straight into the web dashboard,
without a separate OTP step.

This document assumes the following already exist in the codebase (from
prior work) and should be reused, not rebuilt:

- `src/common/utils/phone.util.ts` — `normalizePhoneNumber()`
- `src/api/merchant/merchant.service.ts` — `findOrCreateByPhone()`
- `src/api/auth/auth.service.ts` — OTP request/verify flow
- `src/gemini/gemini.service.ts` — `parseMessage()` for order extraction
- `src/api/whatsapp/whatsapp.service.ts` — `handleIncomingMessage()` with the
  existing `ConversationState` machine (`IDLE` / `CONFIRMING_ORDER`)

If any of these are missing or differ from what's described below, reconcile
before proceeding — later phases depend on their exact shape.

---

## Phase 0 — Environment & config prerequisites

- [ ] Confirm `TWILIO_WHATSAPP_NUMBER` env var exists (E.164, no `whatsapp:`
      prefix) — needed to build the `wa.me` link.
- [ ] Add `WEB_APP_URL` env var to backend `.env` (e.g.
      `https://tradechat.app` or `http://localhost:3000` in dev) — used by
      `MagicLinkService` to build the link sent back to the merchant.
- [ ] Confirm Redis is reachable from the backend (already required for
      OTP storage and conversation state) — magic link tokens reuse the
      same `RedisService`.

---

## Phase 1 — Schema changes

**File:** `prisma/schema.prisma`

Add two new fields to `Merchant`:

```prisma

model Merchant {
  // ...existing fields...
  ownerName       String?
  productCategory String?
}
```

- [ ] Run `npx prisma migrate dev --name add_owner_name_and_product_category`
- [ ] Regenerate the Prisma client (`npx prisma generate`, or via your
      existing `postinstall`/build script)
- [ ] Verify the migration file lands under `prisma/migrations/` alongside
      existing migrations (`add_ledger_entries_table`, etc.) without
      conflicts

**Do not** remove or rename `businessName` — it remains distinct from
`ownerName` (business name vs. the person's own name).

---

## Phase 2 — Gemini onboarding extraction

**File:** `src/gemini/gemini.service.ts`

Add a new method alongside the existing `parseMessage()`, following the same
pattern (structured JSON output, confidence gate, post-parse validation —
do not skip the validation step, it's what prevents a `HIGH`-confidence
response with missing fields from silently proceeding, per the existing
`parseMessage` implementation).

```typescript
export interface ExtractedOnboarding {
  confidence: 'HIGH' | 'LOW';
  ownerName?: string;
  businessName?: string;
  productCategory?: string;
  clarifyingQuestion?: string;
  missingFields?: string[];
}
```

```typescript
async parseOnboardingMessage(messageText: string): Promise<ExtractedOnboarding> {
  // Same structure as parseMessage():
  // 1. If !this.ai (no API key), return LOW confidence in dev, throw in prod.
  // 2. Detect unedited placeholder text FIRST, before calling Gemini at all —
  //    if the message still literally contains "[Your Name]", "[Business Name]",
  //    or "[What You Sell]", skip the API call entirely and return LOW
  //    confidence with missingFields: ['ownerName', 'businessName', 'productCategory'].
  //    This saves an API call for the single most common degenerate case
  //    (user tapped send without editing the template).
  // 3. System prompt instructs Gemini to:
  //    - Extract ownerName, businessName from free text
  //    - Classify the described product/service into ONE of the seven
  //      ProductCategory enum values above (map loosely-worded input —
  //      "rice and provisions", "foodstuff" → FOOD_AND_GROCERIES; when
  //      genuinely ambiguous or unlisted, use OTHER, never invent a new
  //      category value)
  //    - Only set confidence HIGH if ownerName AND businessName AND
  //      productCategory are all present
  // 4. responseSchema mirrors ExtractedOnboarding, with productCategory
  //    constrained via Type.STRING + enum: [...the 7 values]
  // 5. Post-parse validation (mirroring parseMessage's validateAndNormalize):
  //    force LOW confidence if any of the three fields is empty/missing,
  //    regardless of what the model self-reported.
}
```

- [ ] Implement `parseOnboardingMessage` following the pattern above
- [ ] Add a private `validateAndNormalizeOnboarding()` helper mirroring the
      existing order-parsing validator — same reasoning: never trust
      self-reported `HIGH` confidence without independently checking the
      required fields are actually present
- [ ] Unit test: unedited placeholder message → `LOW` confidence, no API
      call made (mock `this.ai.models.generateContent` and assert it was
      never invoked for this case)
- [ ] Unit test: well-formed message ("Hi, I'm Blessing, I run Blessing's
      Perfumes, I sell perfumes and body spray") → `HIGH` confidence,
      `productCategory: 'BEAUTY_AND_PERSONAL_CARE'`

---

## Phase 3 — Conversation state machine extension

**File:** `src/api/whatsapp/whatsapp.service.ts`

Extend the existing state type:

```typescript
interface ConversationState {
  step:
    | 'IDLE'
    | 'CONFIRMING_ORDER'
    | 'ONBOARDING_GATHER' // first-pass parse attempt
    | 'ONBOARDING_ASK_NAME' // guided fallback, one field at a time
    | 'ONBOARDING_ASK_BUSINESS'
    | 'ONBOARDING_ASK_CATEGORY'
    | 'ONBOARDING_CONFIRM'; // final review before saving
  pendingOrder?: ExtractedOrder;
  pendingOnboarding?: {
    ownerName?: string;
    businessName?: string;
    productCategory?: string;
  };
}
```

### Dispatch logic changes in `handleIncomingMessage`

Immediately after resolving the merchant via `findOrCreateByPhone`, branch
on onboarding status **before** falling through to the existing
`IDLE`/`CONFIRMING_ORDER` logic:

```typescript
const merchant = await this.merchantService.findOrCreateByPhone(fromPhone);
const state = await this.getState(normalizedPhone);

// FIX / new: guard against re-triggering onboarding for an already-
// onboarded merchant who happens to message something onboarding-shaped
// again (forwarded QR, re-scan, etc.) — do NOT gate this on `state.step`
// alone, gate it on the merchant's actual onboardingComplete flag.
if (!merchant.onboardingComplete && state.step !== 'CONFIRMING_ORDER') {
  return this.handleOnboardingFlow(merchant, normalizedPhone, text, state);
}

// ...existing IDLE / CONFIRMING_ORDER logic unchanged below...
```

### New method: `handleOnboardingFlow`

Behavior by state:

- **No state yet (`IDLE` default) + `!onboardingComplete`:** treat this as
  the first onboarding message. Call `parseOnboardingMessage`. If `HIGH`
  confidence, jump straight to `ONBOARDING_CONFIRM` (skip the guided
  questions entirely — this is the fast path for a well-filled-in
  template message). If `LOW`, store whatever fields _were_ extracted in
  `pendingOnboarding`, and transition to whichever
  `ONBOARDING_ASK_*` step corresponds to the first missing field.

- **`ONBOARDING_ASK_NAME` / `ONBOARDING_ASK_BUSINESS` /
  `ONBOARDING_ASK_CATEGORY`:** treat the incoming message as a direct
  answer to that single question (no need to re-run Gemini extraction for
  single-field answers — just trim and store the text directly, except
  for `productCategory`, which should still go through a lightweight
  classification step since merchants will answer in free text ("I sell
  shoes and bags") that needs mapping to the enum). Advance to the next
  missing field, or to `ONBOARDING_CONFIRM` once all three are present.

- **`ONBOARDING_CONFIRM`:** reuse the same `1` / `yes` / `y` confirm and
  `2` / `no` / `cancel` pattern already used in `CONFIRMING_ORDER`. On
  confirm: persist `ownerName`, `businessName`, `productCategory`, and set
  `onboardingComplete: true` via `merchantService.updateMerchant(...)`,
  then call `magicLinkService.issueMagicLink(merchant.id)` and send the
  completion message (see copy below) including that link. Clear
  conversation state. On cancel: clear `pendingOnboarding`, send a short
  "no wahala, send your details again whenever you're ready" message, and
  return to `IDLE` (merchant remains `onboardingComplete: false`, so their
  next message re-enters onboarding rather than being treated as an
  order).

### Message copy (Nigerian-trader-friendly, matching the tone established

elsewhere in the product)

- First-contact template (what the QR/`wa.me` link pre-fills — see Phase 5
  for exact construction):

  ```
  Hi TradeChat! 👋
  My name is [Your Name]
  My business is [Business Name]
  I sell [What You Sell]
  ```

- Unedited-placeholder fallback (sent when Phase 2's placeholder detection
  fires):

  ```
  Oya let's set you up! First — wetin be your name?
  ```

- Guided questions (one per missing field):

  ```
  Nice one, [name]! Wetin your business dey called?
  ```

  ```
  Got it. So wetin you dey sell — fashion, food, electronics, beauty
  products, home stuff, or services?
  ```

- Confirmation step (`ONBOARDING_CONFIRM`):

  ```
  Make we confirm 👇

  👤 Name: Blessing
  🏪 Business: Blessing's Perfumes
  📦 Category: Beauty & Personal Care

  Reply 1 to confirm, or 2 to start over.
  ```

- Completion message (includes the magic link):

  ```
  You're all set, Blessing! 🎉 Blessing's Perfumes is ready to roll on
  TradeChat.

  Tap here to see your dashboard:
  {magicLink}

  Whenever you make a sale, just tell me here like: "Sold 2 bags rice to
  Ade, 15000" and I'll handle the rest.
  ```

- [ ] Implement `handleOnboardingFlow` per the branching logic above
- [ ] Reuse the existing `getState` / `setState` / `clearState` Redis+memory
      cache helpers unchanged — no new state storage mechanism needed
- [ ] Confirm `WhatsAppModule` injects `MerchantService` and the new
      `MagicLinkService` (see Phase 4) into `WhatsAppService`'s constructor

---

## Phase 4 — Magic link service and auth wiring

**File:** `src/api/auth/magic-link.service.ts` (new)

Use the implementation already specified: `issueMagicLink(merchantId)`
generates a crypto-random token, stores `{ merchantId }` in Redis under
`magiclink:{token}` with a 10-minute TTL, and returns
`${WEB_APP_URL}/auth/magic?token=...`. `consumeMagicLink(token)` reads and
immediately deletes the Redis key (single-use), then signs and returns a
normal JWT access token via the same `JwtService` already used by
`AuthService.verifyOtp`.

- [ ] Create `magic-link.service.ts` under `src/api/auth/`
- [ ] Register `MagicLinkService` as a provider in `AuthModule`, exported
      so `WhatsAppModule` can inject it
- [ ] Add a new endpoint to `AuthController`:
  ```typescript
  @Post('magic/consume')
  async consumeMagicLink(@Body('token') token: string) {
    return this.magicLinkService.consumeMagicLink(token);
  }
  ```
  This should **not** be behind the phone-aware OTP throttler — it's a
  different mechanism with its own single-use protection. A generic IP-based
  rate limit is still reasonable to prevent brute-forcing token guesses,
  but keep it separate from the OTP throttling config.
- [ ] Confirm `WhatsAppModule` imports `AuthModule` (or that
      `MagicLinkService` is provided via a shared module both can import)
      to satisfy the new constructor dependency in `WhatsAppService`

---

## Phase 5 — `/get-started` frontend route

**Directory:** `app/get-started/` (new, in the `web` app, likely under the
`(landing)` group or its own top-level route depending on whether it needs
the landing page's nav/footer)

### Building the WhatsApp deep link

```typescript
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER; // e.g. "2348012345678", no "+", no "whatsapp:" prefix

const PRESET_MESSAGE = `Hi TradeChat! 👋
My name is [Your Name]
My business is [Business Name]
I sell [What You Sell]`;

const waLink = `https://wa.me/${TWILIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(PRESET_MESSAGE)}`;
```

### Page layout

- **Primary element:** a large, prominent "Start on WhatsApp" button using
  `waLink` directly — this is what mobile visitors (the large majority)
  will actually use. Tapping it opens WhatsApp directly with the message
  pre-filled in the compose box.
- **Secondary element:** a QR code encoding the same `waLink`, for desktop
  visitors or print material (physical flyers at a market stall). Use the
  `qrcode` npm package server-side (generate as SVG at build/request time)
  or a client-side QR component — either is fine; server-rendered SVG
  avoids a client bundle dependency.
- [ ] Install `qrcode` (`npm install qrcode` + `@types/qrcode` if using
      TypeScript strictly) if not already present
- [ ] Build the page with both elements; the button should be visually
      primary (larger, above the fold), the QR secondary
- [ ] Add a brief explainer line under the button: "We'll ask a couple of
      quick questions on WhatsApp — no forms, no downloads."

**Do not** gate this page behind the existing auth middleware — it must be
reachable by users with no account and no token. Confirm it's covered by
the `publicPathPrefixes`/`exactPublicPaths` logic in `middleware.ts` (from
prior work) — add `/get-started` to the public path list if not already
covered by a prefix match.

---

## Phase 6 — Magic link consumption route (frontend)

**File:** `app/auth/magic/route.ts` (new — a Route Handler, not a page
component, since this should redirect and set a cookie server-side before
any React rendering happens)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/magic/consume`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    },
  );

  if (!res.ok) {
    // Expired or already-used token — send them to OTP login instead of
    // a dead end.
    return NextResponse.redirect(new URL('/login?expired=magic', request.url));
  }

  const { accessToken } = await res.json();

  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  response.cookies.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
```

- [ ] Create this Route Handler exactly as above (Route Handlers can set
      cookies directly on the response, unlike Server Components)
- [ ] Confirm `/auth/magic` is covered by public path matching in
      `middleware.ts`'s matcher config (it's excluded from the matcher
      already if the `(?!_next|api|...)` negative lookahead also excludes
      `/auth` routes generally — verify explicitly rather than assuming)
- [ ] Add a small banner/toast on the `/login` page reading something like
      "Your link expired — request a new code below" when
      `?expired=magic` is present in the query string

---

## Phase 7 — Testing checklist (do not skip before considering this done)

- [ ] **Placeholder detection:** send the unedited template message → bot
      responds with the "wetin be your name" fallback, no Gemini API call
      made (verify via mock/log)
- [ ] **Happy path, one-shot:** send a fully filled-in template message →
      bot goes straight to `ONBOARDING_CONFIRM`, correct fields shown
- [ ] **Happy path, guided fallback:** send a vague message ("hi its
      Chidi") → bot asks for business name next, then category, then
      confirms
- [ ] **Category classification:** send free-text category descriptions
      ("I sell shoes and bags", "foodstuff and provisions", "I do
      makeup") → confirm each maps to a sensible enum value, and a
      genuinely unclassifiable answer maps to `OTHER` rather than
      inventing a new category
- [ ] **Re-onboarding guard:** as an already-onboarded merchant, send a
      message that superficially resembles the template (e.g., contains
      "my name is") → confirm it's treated as a normal order/IDLE message,
      not routed into onboarding again
- [ ] **Magic link — happy path:** complete onboarding, tap the link
      within 10 minutes → lands on `/dashboard` logged in
- [ ] **Magic link — expiry:** wait past 10 minutes (or manually expire
      the Redis key) → tapping the link redirects to `/login?expired=magic`
      with a clear message, not a raw error
- [ ] **Magic link — single use:** tap the same link twice → second tap
      fails cleanly with the same expired-link handling
- [ ] **`/get-started` public access:** visit while fully logged out, no
      cookie present at all → page loads (not redirected by middleware)
- [ ] **Existing OTP login unaffected:** confirm `/login` OTP flow for a
      returning merchant still works unchanged after all of the above

---

## Sequencing recommendation for the agent

Implement in the order the phases are numbered — each phase's testing
depends on the previous one being functional (you can't test the magic
link handoff until onboarding actually completes and calls
`issueMagicLink`; you can't test onboarding completion until the schema
fields exist to persist it into). Phases 1–4 are backend-only and can be
built and tested via direct WhatsApp messages to a sandbox number before
any frontend work begins; Phases 5–6 are frontend-only and depend on
Phase 4's endpoint existing.
