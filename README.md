# AIDEN Brief Intelligence

Next.js app for interrogating creative briefs with AI and returning:
- structured extraction
- gap analysis and score
- strategic recommendations
- rewritten brief output

## Product Flows

- `"/"` marketing + pricing + examples
- `"/generate"` main analysis workflow
- `"/dashboard"` signed-in history and usage
- `"/preview/[id]"` shared preview for saved analyses
- Legacy flow still exists via `"/api/generate"` for landing-page style generation outputs

## Environment

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `AIDEN_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_SINGLE`
- `STRIPE_PRICE_ID_PRO`

Optional:
- `AIDEN_API_URL` (defaults to Railway endpoint if omitted)
- `NEXT_PUBLIC_URL`
- `AIDEN_BRAIN_API_URL`
- `AIDEN_BRAIN_API_KEY`

## Usage and Rate-Limit Model

- Authenticated users: plan-based quota from `usage_tracking` table.
  - Free: 3 / month
  - Starter: 50 lifetime
  - Pro/Agency: unlimited
- Guests: monthly guest quota keyed by IP + guest token + fingerprint.
- Burst protection: IP rate limiting (10 requests / 60 seconds) via `rate_limits`.

## Subscription Enforcement Points

- `POST /api/analyze-brief`
  - Plan quota (authenticated)
  - Guest monthly quota (unauthenticated)
  - Burst rate limit
- `POST /api/export-pdf`
  - Requires authenticated user
  - Requires paid plan (`single`, `pro`, or `agency`)

## Development

```bash
npm install
npm run dev
```
