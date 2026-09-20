/**
 * Arabic text normalization for verse matching (spec section 3): strips tashkeel and
 * tatweel, unifies alef/ya/ta-marbuta forms. The result is used only for matching —
 * the original text is always what gets displayed.
 */

const TASHKEEL_AND_QURANIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭࣔ-ࣣ࣡-ࣿ]/g;
const TATWEEL = /ـ/g;
const STRAY_MARKS = /[﻿​-‏‪-‮]/g;
const ALEF_VARIANTS = /[آأإٱ]/g; // آ أ إ ٱ
const YA_VARIANTS = /[ى]/g; // ى -> ي
const TA_MARBUTA = /ة/g; // ة -> ه

export function normalizeArabic(text: string): string {
  return text
    .normalize("NFC")
    .replace(STRAY_MARKS, "")
    .replace(TASHKEEL_AND_QURANIC_MARKS, "")
    .replace(TATWEEL, "")
    .replace(ALEF_VARIANTS, "ا") // ا
    .replace(YA_VARIANTS, "ي") // ي
    .replace(TA_MARBUTA, "ه") // ه
    .replace(/\s+/g, " ")
    .trim();
}

/** Strips the BOM/stray direction marks and normalizes to NFC, but keeps the text otherwise byte-for-byte (for display). */
export function cleanDisplayText(text: string): string {
  return text.replace(STRAY_MARKS, "").normalize("NFC");
}

/**
 * The source tafsir export wraps each entry in <p>…</p> blocks (structural paragraph
 * breaks only — verified in DATA_AUDIT.md, no other markup across the four target
 * books). This extracts the plain text, joining paragraphs with a blank line, without
 * altering any character of the actual content.
 */
export function stripParagraphTags(html: string): string {
  const withoutTags = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/^<p>/i, "")
    .replace(/<\/p>$/i, "");
  return cleanDisplayText(withoutTags).trim();
}
