# TradeBot System (with Bot Integration)

## Quickstart
1) Copy `.env.example` → `.env`, set `DATABASE_URL`, `JWT_SECRET`
2) Install: `npm install`
3) Migrate DB: `npx prisma migrate dev --name init`
4) (Optional) Seed admin: `npm run seed:admin`
5) Run: `npm run dev`

- Dashboard: http://localhost:3000/dashboard
- Auth: http://localhost:3000/auth
- Admin: http://localhost:3000/admin (ADMIN only)

## Referral
- Dashboard shows share link `/auth?ref=CODE` with Copy/Share buttons
- `/auth` auto-fills `?ref=CODE` and switches to Register tab
- Self-referral is blocked

## Payments
- `POST /api/payment/upgrade` (mock extend 30 days + referral bonus)
- `POST /api/payment/create-intent` (binance/bank scaffolding)
- `POST /api/payment/binance/webhook` (signature TODO)
- `POST /api/payment/confirm-bank` (ADMIN manual approve)

## Expiry
- `GET /api/system/check-expire` — deactivate expired users (schedule daily)

## Bot Integration
- Redis Pub/Sub channel: `tradebot:control` — broadcasts `{ type: "TOGGLE_ALL", isRunning, at }`
- Internal endpoints (require header `X-Bot-Key` == `BOT_API_KEY`):
  - `GET /api/bot-internal/snapshot` → `{ isRunning, users[{id,email,isActive,planExpiresAt}] }`
  - `POST /api/bot-internal/authorize` `{ userId }` → `{ allowed: true|false, reason? }`
  - `POST /api/bot-internal/heartbeat` → `{ ok: true }`
- Toggle API publishes control message for bot engines to react

## Admin Security
- `middleware.ts` protects `/admin` & `/api/admin/*`
- Token stores role; admin APIs double-check role

## Build for Production
- Use HTTPS + `Secure` cookies
- Add rate limiting, strong password policy, CSRF protection for forms
- Implement Binance Pay signing/verification before accepting real payments


## Binance Upgrade Flow
- User clicks "จ่ายด้วย Binance" on Dashboard → calls `POST /api/payment/binance/create`
- Backend creates pending `Transaction` with `method="binance"` and returns `{ orderId, qrCodeContent }`
- UI redirects to `/payment/{orderId}` which polls `GET /api/payment/order-status?orderId=...`
- Admin can approve (simulate webhook) via `POST /api/payment/binance/approve` with `{ orderId }`
- On approval: transaction → `approved` and user's plan extended + referral $10 bonus (if any)

> When ready for production, replace `createBinancePayIntent` + `verifyBinanceWebhookSignature` with real Binance Pay implementation and wire their webhook to auto-approve.
