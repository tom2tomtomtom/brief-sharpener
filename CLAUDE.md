# AIDEN Brief Sharpener — Agent Guide

## 1. What this tool is

User-facing web app where creatives paste a brief. Brief Sharpener analyses it against 8 structured dimensions (objectives, audience, deliverables, tone, budget, timeline, KPIs, brand context), scores completeness, identifies gaps, generates clarifying questions, and optionally rewrites the brief for sharpness. Pro users see "phantom perspectives" (strategic voices that critique the brief from different angles).

## 2. Ambition + soul

Brief Sharpener is a critic first, a writer second. The senior strategist who holds up a mirror and asks "what is this actually about?" before offering a sharpened rewrite. It refuses to let briefs hide behind jargon or false decisiveness. Its soul is honesty bordering on brutal. Its ambition is to rescue briefs from corporate-speak before they poison the creative that follows. The optional sharpened rewrite is a benefit, not the point.

## 3. What makes it different

Versus ChatGPT "write me a brief" prompts: Brief Sharpener leads with critique, not generation. It scores a brief against an AIDEN strategic rubric (clarity, intent, language precision, cliché resistance) before optionally offering a sharpened rewrite. Phantom perspectives let you see the brief from different strategic voices. "How would a futurist read this. How would a sceptic." The rewrite is available, but users walk away understanding what was broken, not just holding a cleaner draft.

## 4. Where it lives

- Domain: `brief-sharpener.aiden.services`
- Repo: `tom2tomtomtom/brief-sharpener`
- Local path: `/Users/tommyhyde/brief-sharpener`
- Railway: healthcheck at `/api/health`, auto-deploy from `main`

## 5. Tech stack

- Next.js 14 (App Router)
- React 18, TypeScript 5
- Tailwind CSS
- Supabase (auth, analytics, leads)
- Anthropic SDK (Claude analysis)
- jose (JWT verify)
- Resend (email)
- vitest (unit tests)
- Sentry (optional)

## 6. Auth: Gateway integration

3-tier Next.js middleware pattern:
1. **Tier 1**: Gateway JWT via jose HS256. Cookie `aiden-gw`, validates against `JWT_SECRET`.
2. **Tier 2**: Refresh from Gateway. POST `${GATEWAY_URL}/api/auth/session` with existing Supabase cookies.
3. **Tier 3**: Supabase session fallback.

Key files:
- `src/middleware.ts` — MUST be in `src/`, not repo root. Next.js src/ layout requires this location.
- `src/lib/auth.ts` — unified `getUser()` tries Gateway JWT first, then Supabase.
- `src/lib/gateway-jwt.ts` — jose HS256 verify.

Protected routes: `/dashboard/*`. Auth pages: `/login`. Gateway redirects failed auth to `${GATEWAY_URL}/login?next=...`.

## 7. Token billing

- `analyze` = 20 tokens
- `generate` = 5 tokens

Flow:
1. Check via `checkTokens(userId, 'brief_sharpener', 'analyze')` (pre-flight).
2. Deduct on success via `deductTokens(userId, 'brief_sharpener', 'analyze')`.
3. **Fail-closed since 2026-04-18** (commit df8cb6c): if Gateway unreachable, deny access.

Client code: `src/lib/gateway-tokens.ts` calls `${GATEWAY_URL}/api/tokens/{check,deduct,balance}` with `X-Service-Key` + `X-User-Id` headers. Requires `AIDEN_SERVICE_KEY`.

## 8. Critical files

- `src/middleware.ts` — auth 3-tier. MUST be in `src/`.
- `src/lib/auth.ts` — unified `getUser()`.
- `src/lib/gateway-jwt.ts` — JWT verify.
- `src/lib/gateway-tokens.ts` — token check/deduct (fail-closed).
- `src/lib/env.ts` — startup env validation.
- `src/app/api/analyze-brief/route.ts` — core analysis pipeline, streaming NDJSON.
- `src/app/api/generate/route.ts` — sharpened rewrite via Claude.
- `src/app/api/health/route.ts` — service dependency check.
- `src/lib/cost-tracker.ts` — Anthropic pricing, daily/monthly budget caps.
- `src/lib/rate-limit.ts` — per-IP throttle, guest 3-per-month.
- `src/app/layout.tsx` — `validateEnvOnStartup()` called here.
- `railway.json` — healthcheck path, restart policy.
- `vitest.config.ts` — test runner config.

## 9. Environment variables

**Required** (startup validation in `src/lib/env.ts`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `AIDEN_SERVICE_KEY`
- `AIDEN_API_KEY` (calls AIDEN Brain for parsing/enrichment)

**Optional:**
- `GATEWAY_URL` (default `https://www.aiden.services`)
- `JWT_SECRET` — MUST match Gateway
- `AIDEN_BRAIN_API_URL`, `AIDEN_BRAIN_API_KEY`
- `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `RESEND_API_KEY`, `FROM_EMAIL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `DAILY_BUDGET_USD=20`, `MONTHLY_BUDGET_USD=300`, `DAILY_FREE_BUDGET_USD=10`
- `ADMIN_API_SECRET`

**Removed 2026-04-18**: Stripe vars. Billing is now Gateway-owned.

## 10. Deployment

Railway auto-deploys from `main` on push. SSL cert provisioned via Railway TXT verification + GoDaddy CNAME. Health endpoint `/api/health` returns 200 or 503.

Start: `npm start`.

## 11. Known gotchas + incidents

- **Middleware must be `src/middleware.ts`**, NOT repo root. Moving to root makes Next.js stop firing it, breaking auth (commit 38bfea8).
- **Stripe billing ripped out**. All billing is Gateway-owned. DO NOT add local Stripe.
- **Token billing fail-closed** (2026-04-18, commit df8cb6c): was fail-open (billing leak).
- **JWT_SECRET must match Gateway**. If unset, Gateway JWT tier fails silently, falls to Tier 2.
- **`STRIPE_PRICE_ID_AGENCY` no longer required**. env.ts previously crashed without it. Updated 2026-04-18.
- **SSL cert dance**: Railway TXT + GoDaddy CNAME required for `brief-sharpener.aiden.services`. If you recreate the Railway service, the dance repeats.

## 12. Testing

```bash
npm test              # vitest run
npm run test:watch    # vitest watch
npm run build         # Next.js build
```

Critical test suites:
- `src/lib/__tests__/cost-tracker.test.ts` — token pricing, budget enforcement
- `src/lib/__tests__/rate-limit.test.ts` — per-IP throttle, guest limits
- `src/lib/__tests__/email.test.ts` — email parsing
- `src/lib/__tests__/scoring.test.ts` — brief dimension scoring

## 13. DO NOT

- Don't move middleware to repo root. It stops firing.
- Don't add local Stripe billing code. Gateway-owned.
- Don't bypass gateway-tokens fail-closed contract.
- Don't set `JWT_SECRET` to anything different from Gateway.
- Don't assume `STRIPE_PRICE_ID_AGENCY` or other Stripe vars exist.

## 14. Related

- Vault: `~/Tom-Brain/Brief Sharpener.md`
- Vault: `~/Tom-Brain/AIDEN/AIDEN Hub.md`
