/**
 * Loads Quran text, surah metadata and the four target tafsir books from the local
 * clone of https://github.com/Mohamed-Nagdy/Quran-App-Data (spec section 3) into
 * Postgres, after normalization and the integrity checks required by spec section 12.
 *
 * Usage:
 *   git clone --depth 1 https://github.com/Mohamed-Nagdy/Quran-App-Data.git data/Quran-App-Data
 *   DATABASE_URL=postgres://... npx tsx scripts/seed.ts
 *
 * Findings from the initial audit of this dataset are in DATA_AUDIT.md.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { cleanDisplayText, normalizeArabic, stripParagraphTags } from "../src/lib/normalize";
import type { RevelationType, TafsirBookKey } from "../src/types/db";

const DATA_ROOT = join(process.cwd(), "data", "Quran-App-Data");

const TAFSIR_BOOKS: {
  key: TafsirBookKey;
  file: string;
  name_ar: string;
  author_ar: string;
  sort_order: number;
}[] = [
  {
    key: "tabari",
    file: "tabary.json",
    name_ar: "تفسير الطبري",
    author_ar: "محمد بن جرير الطبري",
    sort_order: 1,
  },
  {
    key: "kathir",
    file: "katheer.json",
    name_ar: "تفسير ابن كثير",
    author_ar: "إسماعيل بن كثير",
    sort_order: 2,
  },
  {
    key: "saadi",
    file: "sa3dy.json",
    name_ar: "تفسير السعدي",
    author_ar: "عبد الرحمن بن ناصر السعدي",
    sort_order: 3,
  },
  {
    key: "muyassar",
    file: "ar_muyassar.json",
    name_ar: "التفسير الميسر",
    author_ar: "نخبة من العلماء، مجمع الملك فهد لطباعة المصحف الشريف",
    sort_order: 4,
  },
];

interface SurahMeta {
  index: string;
  titleAr: string;
  count: number;
  place: "Mecca" | "Medina";
}

interface RawTafsirEntry {
  id: number;
  sura: number;
  aya: number;
  text: string;
}

function fail(message: string): never {
  console.error(`\nFAIL: ${message}\n`);
  process.exit(1);
}

function loadSurahMeta(): SurahMeta[] {
  const raw = readFileSync(join(DATA_ROOT, "quran_metadata", "surah.json"), "utf-8");
  return JSON.parse(raw);
}

function loadAyahs(surahIndex: number): string[] {
  const raw = readFileSync(
    join(DATA_ROOT, "Quran Suras", `surah_${surahIndex}.json`),
    "utf-8"
  );
  const data = JSON.parse(raw) as { count: number; verse: Record<string, string> };
  const verses: string[] = [];
  for (let i = 1; i <= data.count; i++) {
    const v = data.verse[`verse_${i}`];
    if (v === undefined) fail(`surah ${surahIndex}: missing verse_${i}`);
    verses.push(v);
  }
  return verses;
}

function loadTafsirFile(file: string): RawTafsirEntry[] {
  const raw = readFileSync(join(DATA_ROOT, "Tafaseer", file), "utf-8");
  return JSON.parse(raw);
}

/** Collapses consecutive same-surah entries with identical text into one verse_from..verse_to range (spec section 3). */
function collapseRanges(entries: RawTafsirEntry[]) {
  const ranges: { surah: number; verse_from: number; verse_to: number; text: string }[] = [];
  let i = 0;
  while (i < entries.length) {
    let j = i;
    while (
      j + 1 < entries.length &&
      entries[j + 1].sura === entries[i].sura &&
      entries[j + 1].text === entries[i].text
    ) {
      j++;
    }
    ranges.push({
      surah: entries[i].sura,
      verse_from: entries[i].aya,
      verse_to: entries[j].aya,
      text: entries[i].text,
    });
    i = j + 1;
  }
  return ranges;
}

async function main() {
  console.log("== دِرَايَة — seeding ==\n");

  // ---- load + build in-memory model ----
  const surahMeta = loadSurahMeta().sort((a, b) => Number(a.index) - Number(b.index));

  if (surahMeta.length !== 114) fail(`expected 114 surahs in metadata, found ${surahMeta.length}`);

  const surahs = surahMeta.map((m) => ({
    id: Number(m.index),
    name_ar: m.titleAr,
    ayah_count: m.count,
    revelation_type: (m.place === "Mecca" ? "meccan" : "medinan") as RevelationType,
  }));

  let totalAyahCount = 0;
  const ayahs: { surah: number; number: number; text: string; text_normalized: string }[] = [];
  for (const s of surahs) {
    const rawVerses = loadAyahs(s.id);
    if (rawVerses.length !== s.ayah_count) {
      fail(
        `surah ${s.id}: Quran Suras file has ${rawVerses.length} verses but metadata says ${s.ayah_count}`
      );
    }
    totalAyahCount += rawVerses.length;
    rawVerses.forEach((raw, idx) => {
      const text = cleanDisplayText(raw);
      if (!text.trim()) fail(`surah ${s.id} ayah ${idx + 1}: empty text`);
      if (text.includes("�")) fail(`surah ${s.id} ayah ${idx + 1}: contains U+FFFD`);
      ayahs.push({
        surah: s.id,
        number: idx + 1,
        text,
        text_normalized: normalizeArabic(text),
      });
    });
  }

  if (totalAyahCount !== 6236) fail(`expected 6236 total verses, found ${totalAyahCount}`);
  console.log(`✓ 114 surahs, ${totalAyahCount} verses, per-surah counts match metadata`);

  // canonical (surah, ayah) sequence, used to validate every tafsir book below
  const canonicalPairs = ayahs.map((a) => `${a.surah}:${a.number}`);

  type TafsirEntryRow = {
    bookKey: TafsirBookKey;
    surah: number;
    verse_from: number;
    verse_to: number;
    text: string;
    source_path: string;
  };
  const tafsirEntries: TafsirEntryRow[] = [];
  const coverage: Record<string, Set<number>> = {};

  for (const book of TAFSIR_BOOKS) {
    const raw = loadTafsirFile(book.file);
    if (raw.length !== 6236) {
      fail(`${book.key}: expected 6236 entries, found ${raw.length} — STOPPING per spec (missing/incomplete book)`);
    }
    const pairs = raw.map((e) => `${e.sura}:${e.aya}`);
    for (let i = 0; i < canonicalPairs.length; i++) {
      if (pairs[i] !== canonicalPairs[i]) {
        fail(
          `${book.key}: (sura,aya) sequence diverges from the canonical Quran sequence at index ${i} ` +
            `(expected ${canonicalPairs[i]}, found ${pairs[i]}) — STOPPING per spec`
        );
      }
    }

    for (const e of raw) {
      const text = stripParagraphTags(e.text);
      if (text.includes("�")) fail(`${book.key} ${e.sura}:${e.aya}: contains U+FFFD`);
    }

    const ranges = collapseRanges(raw);
    const surahsSeen = coverage[book.key] ?? (coverage[book.key] = new Set());
    let skippedEmpty = 0;
    for (const r of ranges) {
      const text = stripParagraphTags(r.text);
      // The source genuinely has no commentary for some individual verses (classical
      // tafsirs sometimes fold a verse's meaning into the surrounding discussion, or a
      // verse is too short to comment on separately) — see DATA_AUDIT.md. We don't
      // store a row for these; retrieval then reports "no text in this book" per spec
      // section 10, rather than inserting an empty passage.
      if (!text) {
        skippedEmpty++;
        continue;
      }
      surahsSeen.add(r.surah);
      tafsirEntries.push({
        bookKey: book.key,
        surah: r.surah,
        verse_from: r.verse_from,
        verse_to: r.verse_to,
        text,
        source_path: `Tafaseer/${book.file}#${r.surah}:${r.verse_from}-${r.verse_to}`,
      });
    }
    console.log(
      `✓ ${book.key}: 6236/6236 verses matched, ${ranges.length - skippedEmpty} stored passages ` +
        `(${raw.length - ranges.length} collapsed as verse ranges, ${skippedEmpty} verses with no commentary in this book), ` +
        `covers ${surahsSeen.size}/114 surahs`
    );
  }

  // coverage table: book x surah (all should be 114/114 given the checks above)
  console.log("\nCoverage table (book × surahs covered):");
  for (const book of TAFSIR_BOOKS) {
    console.log(`  ${book.key.padEnd(10)} ${coverage[book.key].size}/114`);
  }

  // ---- write to Postgres ----
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(
      "\nDATABASE_URL not set — validated data in memory only, skipping database write.\n" +
        "Set DATABASE_URL to a Postgres connection string (e.g. from Supabase project settings) to seed."
    );
    return;
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("begin");

    await client.query("truncate table tafsir_entries, ayahs, tafsir_books, surahs restart identity cascade");

    await client.query(
      `insert into surahs (id, name_ar, ayah_count, revelation_type)
       select * from unnest($1::smallint[], $2::text[], $3::smallint[], $4::text[])`,
      [
        surahs.map((s) => s.id),
        surahs.map((s) => s.name_ar),
        surahs.map((s) => s.ayah_count),
        surahs.map((s) => s.revelation_type),
      ]
    );

    await client.query(
      `insert into ayahs (surah, number, text, text_normalized)
       select * from unnest($1::smallint[], $2::smallint[], $3::text[], $4::text[])`,
      [
        ayahs.map((a) => a.surah),
        ayahs.map((a) => a.number),
        ayahs.map((a) => a.text),
        ayahs.map((a) => a.text_normalized),
      ]
    );

    const bookIdByKey = new Map<TafsirBookKey, number>();
    for (const book of TAFSIR_BOOKS) {
      const res = await client.query<{ id: number }>(
        `insert into tafsir_books (key, name_ar, author_ar, sort_order)
         values ($1, $2, $3, $4) returning id`,
        [book.key, book.name_ar, book.author_ar, book.sort_order]
      );
      bookIdByKey.set(book.key, res.rows[0].id);
    }

    const batchSize = 2000;
    for (let i = 0; i < tafsirEntries.length; i += batchSize) {
      const batch = tafsirEntries.slice(i, i + batchSize);
      await client.query(
        `insert into tafsir_entries (book_id, surah, verse_from, verse_to, text, source_path)
         select * from unnest($1::smallint[], $2::smallint[], $3::smallint[], $4::smallint[], $5::text[], $6::text[])`,
        [
          batch.map((e) => bookIdByKey.get(e.bookKey)!),
          batch.map((e) => e.surah),
          batch.map((e) => e.verse_from),
          batch.map((e) => e.verse_to),
          batch.map((e) => e.text),
          batch.map((e) => e.source_path),
        ]
      );
    }

    await client.query("commit");
    console.log(
      `\n✓ seeded: ${surahs.length} surahs, ${ayahs.length} ayahs, ${TAFSIR_BOOKS.length} books, ${tafsirEntries.length} tafsir entries`
    );
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
