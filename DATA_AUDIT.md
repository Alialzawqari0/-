# تدقيق البيانات — Data Audit

Status: **PASS**. All four target tafsir books are present and have complete, exact
1:1 coverage of the full 6236-verse Quran. Build proceeded to seeding.

## Source

Cloned (not fetched at runtime) with:

```
git clone --depth 1 https://github.com/Mohamed-Nagdy/Quran-App-Data.git data/Quran-App-Data
```

Commit inspected: see `data/Quran-App-Data/.git` (shallow clone, HEAD at audit time,
2026-09-20). The repo is **not tracked in this project's git history** — it is ~1.3 GB
(mostly `quran_images*` and `Hadith Books Json`, which the MVP does not use) and is
treated as an external seed-time input. `data/` is git-ignored; `scripts/seed.ts`
expects it to be present locally and documents the clone command in the README.

Only three subtrees are used, per spec: `Quran Suras/`, `Tafaseer/`, `quran_metadata/`.
Everything else (`Hadith Books Json/`, `quran_images*/`, `azkar.json`,
`names_of_allah.json`, `names_of_moahmed.json`) is ignored by the seed script.

## License / provenance — UNRESOLVED

**No `LICENSE` file exists anywhere in the repository.** The root `README.md` gives no
license statement. `Tafaseer/README.md` states the commentary/translation files were
extracted from the **Ayat app** (quran.ksu.edu.sa), specifically its Windows package,
plus a note recommending (but not itself bundling) an "up to date" King Fahd Complex
edition of al-Muyassar. No redistribution terms are given for either origin.

**Action taken per spec 3f:** a prominent TODO has been placed in `README.md` and will
render on `/methodology`: *"license and provenance to be confirmed before public
launch."* Do not treat this dataset as cleared for public/production use until that is
resolved with the upstream maintainer or original publishers.

## Target tafsir books — all four present

`Tafaseer/README.md` maps file keys to books:

| key (file)         | book key (this app) | Arabic name        |
|---------------------|---------------------|---------------------|
| `tabary.json`        | `tabari`             | تفسير الطبري         |
| `katheer.json`       | `kathir`             | تفسير ابن كثير       |
| `sa3dy.json`         | `saadi`              | تفسير السعدي         |
| `ar_muyassar.json`   | `muyassar`           | التفسير الميسر       |

(37 other files exist — other tafsirs and translations in ~30 languages — all ignored
per spec: MVP scope is these four only.)

## Structure

Each of the four files is a flat JSON array of `{ id, sura, aya, text }`, **one entry
per verse** (not grouped by default) — 6236 entries each:

```json
{ "id": 1, "sura": 1, "aya": 1, "text": "<p>بسم</p><p>القول في تأويل ...</p>" }
```

- `tabary`, `katheer`, `sa3dy`: text is wrapped in `<p>…</p>` blocks (structural
  paragraph breaks only, no other markup found across all 18,708 entries in these
  three files). No footnote content is lost — footnote *markers* like `(46)` appear
  inline in the source text itself (these are artifacts of the printed edition, not
  data-quality bugs) and are preserved as-is.
- `ar_muyassar`: plain text, one stray `<br>` across all 6236 entries.
- `id` is sequential 1..6236 in every file and lines up exactly, in order, with the
  canonical (surah, ayah) sequence derived from `quran_metadata/surah.json`
  — verified programmatically, see "Verification performed" below.

### Grouped-verse tafsir (verse ranges)

The Ayat-app export represents a tafsir passage that covers several verses (e.g.
2:219–220) by **duplicating the identical text across each verse's entry**, rather than
storing an explicit range. Detected by finding consecutive same-surah entries with
byte-identical `text`:

- `ar_muyassar`: 599 such multi-verse runs (of 5056 total distinct passages) — e.g.
  (2, 219–220), (4, 66–68), (8, 62–63).
- `tabary`, `katheer`, `sa3dy` have similar duplicate-run patterns (fewer unique texts
  than entries: 6187/6236, 5957/6236, 5861/6236 respectively).

**Seed-time handling:** `scripts/seed.ts` collapses consecutive same-surah,
identical-text runs into a single `TafsirEntry` with `verse_from`/`verse_to` spanning
the run, matching the schema in spec §4. This is a structural normalization (detecting
where the original source already duplicated one passage across a range), not a content
edit — the stored `text` for the resulting entry is exactly one of the (identical)
source entries' text, untouched.

## Quran text (`Quran Suras/surah_*.json`, `quran_metadata/surah.json`)

- 114 files, `surah_1.json` … `surah_114.json`.
- Verse text is fully vocalized (tashkeel present), Uthmani-style spelling
  (e.g. `ٱللَّهِ` with alef wasla).
- `quran_metadata/surah.json` gives, per surah: `titleAr` (Arabic name), `count`
  (ayah count), `place`/`type` (Mecca/Medina, Makkiyah/Madaniyah — only these two
  values occur across all 114 surahs).

### Verification performed (`data/Quran-App-Data`, results)

| Check | Result |
|---|---|
| Surah files present | 114/114 |
| Total verses (`Quran Suras/*`) | 6236 |
| Total verses (`quran_metadata/surah.json`) | 6236 |
| Per-surah count mismatches between the two sources | 0 |
| Empty verse strings | 0 |
| `U+FFFD` (replacement character) occurrences | 0 anywhere (Quran text or all 4 tafsir books) |
| Mojibake (`Ã`, `â€` double-encoding artifacts) | 0 anywhere |
| Stray zero-width / BOM / bidi-control characters | 1 — a single `U+FEFF` (BOM) at the very start of 1:1 (`verse_1` of `surah_1.json`); stripped at seed time |
| NFC-normalized as stored | No — ~5849/6236 verse strings differ from their `NFC` form (Arabic presentation-form composition typical of these exports); **seed script NFC-normalizes on load**, per spec §3 |
| Each of the 4 tafsir books' `(sura, aya)` sequence vs. the canonical 6236-pair sequence | **Exact match, in order, no gaps, no duplicate pairs** — all 4 books |

## Gaps

Structurally, coverage is complete: every surah is represented in all four books, and
every one of the 6236 (surah, ayah) pairs exists in every book's file (no STOP
condition was triggered).

At the individual-verse level, a small number of verses have **no commentary text** in
a given book (the source `<p></p>` is genuinely empty, not a markup artifact) —
classical tafsirs sometimes fold a short verse's meaning into the discussion of
neighboring verses, or add nothing beyond the Quran text itself for very short verses:

| book | verses with no text | example refs |
|---|---|---|
| tabari (تفسير الطبري) | 26 / 6236 | 2:1 (الم), 37:12–23 (a run of short oath verses) |
| kathir (تفسير ابن كثير) | 28 / 6236 | 5:97, 6:56, 26:104 |
| saadi (تفسير السعدي) | 46 / 6236 | 4:61, 26:1, 30:14 |
| muyassar (التفسير الميسر) | 0 / 6236 | — |

These are **not stored** as empty `tafsir_entries` rows; `scripts/seed.ts` skips them.
This is not a data-quality defect to work around — spec section 10 already anticipates
exactly this case: retrieval finds no row for that (book, verse) and the UI renders the
quiet line *"لا يوجد في هذا الكتاب نص لهذه الآية."* for that book's card.

## Not used in the MVP (per spec, confirmed present but ignored)

`Hadith Books Json/`, `quran_images/`, `quran_images_new/`, `quran_images_new_2/`,
`azkar.json`, `names_of_allah.json`, `names_of_moahmed.json`.
