import type { Surah } from "@/types/db";

export interface ValidatedReference {
  surah: number;
  ayah_from: number;
  ayah_to: number;
}

/**
 * Router output is never trusted (spec section 12): validates surah 1–114 and the ayah
 * range against the surah's actual ayah_count before any query runs. Returns null for
 * anything invalid, which the caller treats as no_result.
 */
export function validateReference(
  surahs: Pick<Surah, "id" | "ayah_count">[],
  surah?: number,
  ayahFrom?: number,
  ayahTo?: number
): ValidatedReference | null {
  if (surah == null || !Number.isInteger(surah) || surah < 1 || surah > 114) return null;

  const s = surahs.find((x) => x.id === surah);
  if (!s) return null;

  const from = ayahFrom ?? 1;
  const to = ayahTo ?? from;

  if (!Number.isInteger(from) || !Number.isInteger(to)) return null;
  if (from < 1 || to < from || to > s.ayah_count) return null;

  return { surah, ayah_from: from, ayah_to: to };
}
