import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnswerContent, Database, Surah, TafsirBook } from "@/types/db";
import { createAnthropicComplete, routeQuery } from "@/lib/router";
import { retrieve } from "@/lib/retrieval";

/**
 * Runs the full spec section 10 pipeline for one user message: route → retrieve →
 * build the reference-only answer payload. Never touches verse/tafsir text itself —
 * only surah/ayah/book references go into content_json (spec section 4).
 */
export async function buildAnswer(
  db: SupabaseClient<Database>,
  userText: string,
  surahs: Pick<Surah, "id" | "ayah_count">[],
  books: TafsirBook[]
): Promise<AnswerContent> {
  const routerOutput = await routeQuery(userText, createAnthropicComplete());

  if (routerOutput.intent !== "search") {
    return { intent: routerOutput.intent };
  }

  const bookIds = books.map((b) => b.id);
  const results = await retrieve(db, surahs, routerOutput, bookIds);

  if (results.length === 0) {
    return { intent: "no_result" };
  }

  return {
    intent: "search",
    results: results.map((r) => ({
      surah: r.surah,
      ayah_from: r.ayah_from,
      ayah_to: r.ayah_to,
      book_ids: bookIds,
    })),
  };
}

/** First few words of the user's message, used as a chat title. */
export function titleFromText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed || "محادثة جديدة";
}
