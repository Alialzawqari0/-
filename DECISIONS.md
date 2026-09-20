# Decisions

Places the spec was silent, or where a real constraint forced a choice. Ordered
roughly by where they show up in the build.

## Component library base (Radix vs. Base UI vs. React Aria)

The shadcn CLI's registry (`ui.shadcn.com`) is unreachable from this build
environment's network policy (blocked by the outbound proxy). All `src/components/ui/*`
files are therefore hand-written from the standard shadcn "new-york" Radix-based
source, adapted to this project's tokens — not fetched. Radix was chosen over the
newer Base UI/React Aria options shadcn now offers, since it's the most-documented,
most stable choice and the one nearly all existing shadcn examples assume.

## Auth: magic link instead of password

Spec section 5 just says "/login (simple email auth)". Implemented as Supabase's
`signInWithOtp` (passwordless magic link) rather than email+password, since it's
simpler (no password reset/strength flow to build) and matches "simple".

## Revelation type stored as English enum, not Arabic text

`surahs.revelation_type` is stored as `'meccan' | 'medinan'` (matching the source
data's `place` field: Mecca/Medina) rather than the Arabic `مكية`/`مدنية`, since it's
an internal classification value, not displayed text — the UI would render the Arabic
label from this enum wherever it's shown (not yet needed anywhere in the built
screens).

## Tafsir text: HTML `<p>` tags stripped at seed time

Three of the four books wrap every entry in `<p>…</p>` (structural paragraph breaks
only, verified in `DATA_AUDIT.md` — no other markup across 18,708 entries). Seed-time
normalization extracts the plain text, joining paragraphs with a blank line. This is a
markup-structure decision, not a content edit: the spec's "byte-for-byte" rule
(section 12) is about not trimming/re-vocalizing/editing punctuation of the actual
text, and `<p>` tags aren't part of "the text" any more than JSON's surrounding quotes
are.

## Verse-range tafsir passages: detected via duplicate-text runs

The source data has no explicit `verse_from`/`verse_to` — a passage covering several
verses is represented by the *same* text repeated on each verse's entry. `scripts/seed.ts`
collapses consecutive same-surah, identical-text entries into one `TafsirEntry` row
with the resulting range. See `DATA_AUDIT.md` for how this was verified.

## Verses with no per-book commentary: not stored, not an error

26–46 verses per book (0/6236 for al-Muyassar) have a genuinely empty `<p></p>` in the
source — classical tafsirs sometimes fold a short verse into the surrounding
discussion. These are skipped at seed time rather than stored as empty rows; retrieval
then finds no row for that (book, verse) and the UI renders the spec's exact copy for
this case ("لا يوجد في هذا الكتاب نص لهذه الآية"). This isn't a workaround — spec
section 10 explicitly describes this exact UI state, so the data model was expected to
have gaps like this.

## `TafsirBook`/`TafsirEntry` type shapes: flat `Insert` types, not `Omit<X,K> & {...}`

Encountered and root-caused a real bug: supabase-js's generic inference for
`.insert()`/`.update()` (via `RejectExcessProperties` in `@supabase/postgrest-js`)
silently degrades to `never` when `Row`/`Insert`/`Update` in the `Database` type
reference an `interface` (as opposed to a `type` alias), *and* separately when an
`Insert` type is built as `Omit<Row, K> & { K?: ... }` instead of a flat object type.
Both patterns are extremely common in hand-written (non-codegen'd) Supabase types, so
this is worth being explicit about: `src/types/db.ts` uses `type` aliases everywhere,
and defines one flat `*Insert` type per table rather than deriving it with `Omit`/`&`.

## Save anchor for a multi-verse tafsir passage

A tafsir card can represent a range (e.g. verses 219–220 in one book, while the user's
query verse range might be different again). `saved_sources` only stores a single
`(surah, ayah)` per row per spec section 4. Saving a card anchors it to the *queried*
range's first verse (`ayah_from`), not to the tafsir passage's own range — simplest
option that still round-trips correctly through retrieval (looking up the tafsir entry
covering that anchor verse finds the same passage again).

## Topic search ranking

Implemented as a Postgres function (`search_verses_by_topic`, migration `0002`) using
`pg_trgm` similarity over normalized verse text and over tafsir text (for the caller's
selected books), returning the top 3 distinct verses. This satisfies "search over
normalized verse text and tafsir text ... at most 3 verses ranked by score" without
building a bespoke ranking model, which the spec doesn't ask for.

## Chat page architecture: server-rendered messages, client composer only

The message list (including verse/tafsir cards) is rendered entirely server-side per
message (`AnswerBlock` is an async Server Component that re-reads verse/tafsir text
from Postgres — spec section 4/10's "text is re-read from the database when
rendering"). Sending a message calls a Server Action that blocks until the full
route→retrieve→answer pipeline finishes, then the client calls `router.refresh()`.
The loading state (three dots + "أبحث في N تفاسير…") and the optimistic user bubble
are shown by a thin client wrapper around the composer during that window, rather than
building a fully client-driven streaming message list — simpler, and the answer
pipeline is not currently streamed token-by-token (the model call is a single
classification JSON response, not a generated answer).

## Chat delete/undo

"حذف المحادثة toast with تراجع, no confirm dialog" (section 6) is implemented as a real
delete (not a soft-delete flag) followed by an in-memory snapshot (chat row + all its
messages) held in the toast's closure; "تراجع" re-inserts that snapshot with the same
ids. This avoids adding a `deleted_at` column/soft-delete semantics to the schema for a
single low-stakes undo window, at the cost of the undo only working while the browser
tab that issued the delete is still open (acceptable for a "no confirm dialog, offer a
few seconds to undo" pattern).

## Project/chat "search" (⌘/Ctrl+K style command dialog)

Searches only chat titles (client-side substring match via `cmdk`, spec section 6:
"بحث في المحادثات ... opens Command dialog searching chat titles") — titles are
fetched once per page load for the whole account (all chats, not just the current
project), not paginated or server-searched, since an individual user's chat count is
expected to be small for the MVP.

## Account deletion

Uses the Supabase Admin API (`auth.admin.deleteUser`, via the service-role client) so
the `auth.users` row is actually removed, not just the app's own tables. All owned rows
cascade-delete through the foreign keys in `supabase/migrations/0001_init.sql`.
