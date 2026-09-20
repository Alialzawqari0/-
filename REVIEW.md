# Manual review checklist (spec section 12)

This has **not** been performed yet — it requires a person with the domain knowledge
and a trusted printed/verified edition of each book to compare against, which is
outside what this build session can do. Nothing in the UI claims scholar review has
happened (`reviewed` defaults to `false` for every seeded row — see
`supabase/migrations/0001_init.sql` and `scripts/seed.ts` — and the "قيد المراجعة"
badge renders for exactly the rows where that's true, per `SHOW_REVIEW_BADGE`).

## What "reviewed" means here

`tafsir_entries.reviewed = true` should only ever be set after a qualified reviewer has
checked that specific passage against a trusted edition — never in bulk, never as a
side effect of re-seeding. Flipping it is a manual, deliberate `UPDATE`, e.g.:

```sql
update tafsir_entries
set reviewed = true
where book_id = (select id from tafsir_books where key = 'tabari')
  and surah = 2 and verse_from <= 255 and verse_to >= 255;
```

## Checklist for the reviewer

For a representative sample — the spec asks for **30 verses × 4 books** — compare the
stored `text` (via `select text from tafsir_entries where ...`, or the rendered tafsir
card) against a trusted printed or vetted digital edition of that book, and confirm:

- [ ] The text matches the trusted edition (no missing sentences, no substitutions).
- [ ] No mid-sentence truncation at the passage boundary.
- [ ] Tashkeel/diacritics are as the source intends (not stripped or altered — only
      the separate `text_normalized` column should be de-vocalized, never `text`).
- [ ] The `(surah, verse_from, verse_to)` on the row is the range that book's edition
      actually attributes that passage to (catches any mis-collapsed range from the
      seed script's duplicate-text-run detection — see `DECISIONS.md`).
- [ ] `source_path` traces back to the right file/entry for provenance.
- [ ] Book/author attribution shown in the UI is correct for that entry.

Suggested spread for the 30 verses: a mix of short verses, multi-verse ranges, verses
with no commentary in at least one book (see `DATA_AUDIT.md`'s gap table for
candidates), and at least one verse per surah-boundary (first/last ayah of a surah) to
catch any off-by-one in the range logic.

## Sign-off

| Reviewer | Books/verses covered | Date | Notes |
|---|---|---|---|
| _(none yet)_ | | | |

Do not set `SHOW_REVIEW_BADGE=false` globally, and do not bulk-flip `reviewed` to
`true`, before this sign-off exists for the rows in question.
