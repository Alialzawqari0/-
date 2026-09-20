# دِرَايَة (Diraya)

An Arabic, RTL, chat-style research tool for Quran tafsir. It finds a verse and shows
what several tafsir books say about it, verbatim, with book/author/verse references.
It is a search tool, not a mufti: see `/methodology` and the full spec this app was
built from for the governing principles.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4 + hand-written shadcn/ui-style
components (Radix-based) + lucide-react + Zod + Supabase (Auth, Postgres, RLS) +
Claude API (router only).

> The shadcn/ui components under `src/components/ui/` are hand-authored rather than
> pulled with `npx shadcn add`, because the `ui.shadcn.com` registry was unreachable
> from this build environment's network policy. They follow the standard "new-york"
> Radix-based implementations, adapted to this project's design tokens and RTL.

## Setup

1. **Install dependencies**: `npm install`
2. **Create a Supabase project**, then apply the schema:
   ```bash
   # via the Supabase SQL editor, or the Supabase CLI:
   supabase db push   # or paste supabase/migrations/*.sql in order
   ```
3. **Copy `.env.example` to `.env.local`** and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     — from the Supabase project's API settings.
   - `DATABASE_URL` — the project's direct Postgres connection string (used only by
     `scripts/seed.ts`).
   - `ANTHROPIC_API_KEY` — for the query router (classification only; see
     `src/lib/router.ts`). `ROUTER_MODEL` defaults to `claude-haiku-4-5-20251001`.
4. **Get the Quran/tafsir data and seed the database**:
   ```bash
   git clone --depth 1 https://github.com/Mohamed-Nagdy/Quran-App-Data.git data/Quran-App-Data
   npm run seed
   ```
   `data/` is git-ignored (the source repo is ~1.3 GB; only three of its folders are
   used — see `DATA_AUDIT.md`). The seed script validates the data (114 surahs, 6236
   verses, all four target tafsir books present and complete) before writing anything,
   and fails loudly instead of silently seeding partial data.
5. **Run the app**: `npm run dev`, then open http://localhost:3000. Auth is
   passwordless (magic link email) via Supabase Auth.

## Scripts

- `npm run dev` / `npm run build` / `npm run start` — Next.js
- `npm run lint` — ESLint
- `npm run test` — Vitest (`src/lib/__tests__/`): Arabic normalization, reference
  validation, router acceptance tests (mocked model, spec section 12c), and an RLS
  integration test that's skipped unless live Supabase test credentials are set (see
  the comment at the top of `rls.integration.test.ts`).
- `npm run seed` — loads `data/Quran-App-Data` into Postgres (`DATABASE_URL`)

## Environment variables

See `.env.example` for the full list, including the two feature flags:
`ENABLE_COMPARISON` (default `false` — the MVP never generates a summary of tafsir
texts) and `SHOW_REVIEW_BADGE` (default `true` — shows "قيد المراجعة" on tafsir
passages that haven't been manually reviewed yet; see `REVIEW.md`).

## Project structure

- `src/app/(app)/` — the authenticated app shell (sidebar + all main routes): home
  (new chat), `/chat/[id]`, `/projects/[id]`, `/saved`, `/profile`, `/methodology`.
- `src/app/login/`, `src/app/auth/callback/` — auth, outside the app shell.
- `src/app/styleguide/` — dev-only design system reference (404s in production).
- `src/lib/router.ts`, `src/lib/retrieval.ts`, `src/lib/answer.ts` — the spec section
  10 pipeline: classify → retrieve → build a reference-only answer payload. The model
  never writes verse or tafsir text; only surah/ayah/book references are stored in
  `messages.content_json`, and the actual text is re-read from Postgres at render time
  (`src/components/answer-block.tsx`).
- `src/lib/tafsir-provider.ts` — the `TafsirProvider` interface (`LocalDbProvider`,
  default; a `QuranpediaProvider` stub, disabled unless `TAFSIR_PROVIDER=quranpedia`).
- `supabase/migrations/` — schema, RLS policies, and the topic-search Postgres
  function.
- `scripts/seed.ts` — data loading + integrity checks (spec section 12).

## Known limitations (MVP)

- Topic search ranks by Postgres trigram similarity over normalized verse text and
  tafsir text — a real but simple ranking (spec section 10's "at most 3 verses ranked
  by score" is intentionally not a sophisticated relevance model).
- Saving a tafsir card anchors the `saved_sources` row to the range's first verse
  (`ayah_from`), not to every verse in a multi-verse range — see `DECISIONS.md`.
- The dataset's license/provenance is unconfirmed — see `DATA_AUDIT.md`. Do not treat
  this as cleared for a public launch until that's resolved.
- No automated browser/E2E tests: the authenticated flows (chat, projects, saved
  sources) need a live Supabase project and `ANTHROPIC_API_KEY` to exercise end to
  end, which this build environment does not have configured. `/login` and
  `/styleguide` were verified in a real browser at 375/1440px; the rest were verified
  by type-checking, linting, a production build, and unit tests only.
- `ENABLE_COMPARISON` has no reader yet since it's `false` by spec and no summary
  feature was built for the MVP — it's wired as a flag for future work only.

See `DATA_AUDIT.md`, `DECISIONS.md`, and `REVIEW.md` for more detail.
