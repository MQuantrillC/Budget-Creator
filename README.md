# Budget Creator

A personal budgeting app with a retro accounting-ledger look. Track income, expenses and loans in any of 10 currencies, and project your capital months or years into the future.

## Features

- **Income & expense tracking** — recurring (weekly, biweekly, monthly, semiannual, yearly) or one-time entries, with custom categories and optional notes
- **Loans** — amortization schedules, monthly payments, total interest, and remaining balance; payments automatically flow into projections until the loan is paid off
- **Multi-currency** — enter amounts in EUR, USD, GBP, CHF, CAD, AUD, JPY, CNY, BRL or PEN; live exchange rates convert everything to your display currency
- **Projections** — charts and a period-by-period table (weekly / monthly / yearly) of your future capital
- **Financial goals** — savings objectives with target dates, monthly or yearly savings targets, and progress tracking
- **Accounts** — sign in with email or Google (Supabase) to sync your data, or use guest mode with local-only storage

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` with your Supabase project credentials (optional — without them the app runs in guest mode only):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

The Supabase database needs a `user_budgets` table with columns `user_id` (uuid, unique), `budget_data` (jsonb) and `updated_at` (timestamptz), with row-level security scoped to the authenticated user.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com) with a custom design-token theme (`src/app/globals.css`)
- [Supabase](https://supabase.com) for auth and persistence
- [Recharts](https://recharts.org) for projections charts
- Exchange rates from [Frankfurter](https://frankfurter.app) with [open.er-api.com](https://www.exchangerate-api.com) as fallback

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

Made by [Marco Quantrill](https://marco-portfolio-azure.vercel.app/)
