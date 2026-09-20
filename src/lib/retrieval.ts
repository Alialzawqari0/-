import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Surah } from "@/types/db";
import { normalizeArabic } from "@/lib/normalize";
import { validateReference } from "@/lib/reference";
import type { RouterOutput } from "@/lib/router";

export interface RetrievedVerse {
  surah: number;
  ayah_from: number;
  ayah_to: number;
}

/**
 * Retrieval per spec section 10:
 *  1. explicit reference → validate against Surah.ayah_count
 *  2. quoted/partial verse text → match on text_normalized
 *  3. topic → search over normalized verse text and tafsir text, at most 3 verses
 * Never invents a result — an empty list means the caller should render no_result.
 */
export async function retrieve(
  db: SupabaseClient<Database>,
  surahs: Pick<Surah, "id" | "ayah_count">[],
  routerOutput: RouterOutput,
  preferredBookIds: number[]
): Promise<RetrievedVerse[]> {
  if (routerOutput.intent !== "search") return [];

  if (routerOutput.surah != null) {
    const ref = validateReference(
      surahs,
      routerOutput.surah,
      routerOutput.ayah_from,
      routerOutput.ayah_to
    );
    return ref ? [ref] : [];
  }

  if (!routerOutput.topic) return [];

  const normalizedTopic = normalizeArabic(routerOutput.topic);

  // Step 2: does the topic look like (partial) verse text already present verbatim?
  const { data: directMatch } = await db
    .from("ayahs")
    .select("surah, number")
    .ilike("text_normalized", `%${normalizedTopic}%`)
    .limit(3);

  if (directMatch && directMatch.length > 0) {
    return directMatch.map((a) => ({ surah: a.surah, ayah_from: a.number, ayah_to: a.number }));
  }

  // Step 3: ranked topic search across verse + tafsir text.
  const { data: ranked, error } = await db.rpc("search_verses_by_topic", {
    topic_normalized: normalizedTopic,
    p_book_ids: preferredBookIds,
    match_limit: 3,
  });
  if (error) throw error;

  return (ranked ?? []).map((r: { surah: number; ayah: number }) => ({
    surah: r.surah,
    ayah_from: r.ayah,
    ayah_to: r.ayah,
  }));
}
