const arabicDigits = new Intl.NumberFormat("ar-EG", { useGrouping: false });

/** Renders a number using Arabic-Indic digits, per spec section 2. */
export function toArabicNumber(n: number): string {
  return arabicDigits.format(n);
}

/** "سورة البقرة، الآية ٢٥٥" or "سورة البقرة، الآيات ١–٧" */
export function formatVerseLabel(surahNameAr: string, from: number, to: number): string {
  if (from === to) {
    return `سورة ${surahNameAr}، الآية ${toArabicNumber(from)}`;
  }
  return `سورة ${surahNameAr}، الآيات ${toArabicNumber(from)}–${toArabicNumber(to)}`;
}
