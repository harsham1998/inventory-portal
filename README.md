# StockFlow

Stock inventory & purchase order portal. Next.js (App Router) + Supabase (Postgres, Auth, Storage).

## First-time setup

1. **Create a Supabase project** at supabase.com (or use an existing one).
2. **Link and push the schema:**
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   This creates all tables, RLS policies, triggers, and the two storage buckets from
   `supabase/migrations/0001_init.sql`.
3. **Env vars** — copy `.env.local.example` to `.env.local` and fill in your project's
   URL and anon key (Supabase dashboard → Settings → API).
4. **Regenerate types** (optional, keeps `src/lib/supabase/types.ts` in sync with the DB):
   ```bash
   supabase gen types typescript --linked > src/lib/supabase/types.ts
   ```
5. **Run it:**
   ```bash
   npm run dev
   ```
   First visit `/login`, create an account, then finish onboarding (pick your outlet).
   The first outlet/supplier need to be added under Outlets / Suppliers before you can
   raise a purchase order.

## How stock updates

`inventory_items.current_stock` is a cache maintained by triggers over an append-only
`stock_movements` ledger — every purchase order line item and every manual adjustment
writes a row there, and a trigger rolls it into the cached balance. See
`supabase/migrations/0001_init.sql` for the full schema and RLS policies.

## Tests

```bash
npm run test
```
Covers the paste-to-items parser (`src/lib/parser.ts`) used on the "New purchase order" page.

## Deploy

Push to a GitHub repo and import into Vercel, then set the two `NEXT_PUBLIC_SUPABASE_*`
env vars in the Vercel project settings.
