# Sakoon — Login & Registration

Next.js (App Router) + Prisma ORM + PostgreSQL (Supabase).

## Setup
1. `npm install`  (also runs `prisma generate`)
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, admin values.
3. `npm run db:setup`  — creates tables from `prisma/schema.prisma`, enables RLS, seeds the admin.
4. `npm run dev` → http://localhost:3000

## Changing the database
Edit `prisma/schema.prisma`, then run `npm run db:push`. `npm run db:studio` opens a table browser.
