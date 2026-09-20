import { createClient } from "@/lib/supabase/server";
import { VerseCard } from "@/components/verse-card";
import { TafsirCard } from "@/components/tafsir-card";
import { FixedMessage } from "@/components/fixed-message";
import { formatVerseLabel } from "@/lib/format";
import type { AnswerContent } from "@/types/db";

const SHOW_REVIEW_BADGE = process.env.SHOW_REVIEW_BADGE !== "false";

export async function AnswerBlock({
  content,
  projectId,
  chatId,
}: {
  content: AnswerContent;
  projectId: string | null;
  chatId?: string;
}) {
  if (content.intent !== "search" || !content.results || content.results.length === 0) {
    return <FixedMessage intent={content.intent} chatId={chatId} />;
  }

  const supabase = await createClient();

  const leadLine =
    content.results.length === 1 && content.results[0].book_ids.length === 1
      ? "هذا ما ورد في التفسير عن"
      : "هذا ما ورد في التفاسير عن";

  return (
    <div className="flex flex-col gap-32">
      {await Promise.all(
        content.results.map(async (result, i) => {
          const [{ data: surah }, { data: verses }, { data: books }, { data: savedRows }] =
            await Promise.all([
              supabase.from("surahs").select("name_ar").eq("id", result.surah).maybeSingle(),
              supabase
                .from("ayahs")
                .select("number, text")
                .eq("surah", result.surah)
                .gte("number", result.ayah_from)
                .lte("number", result.ayah_to)
                .order("number"),
              supabase.from("tafsir_books").select("*").in("id", result.book_ids).order("sort_order"),
              projectId
                ? supabase
                    .from("saved_sources")
                    .select("id, book_id")
                    .eq("project_id", projectId)
                    .eq("surah", result.surah)
                    .eq("ayah", result.ayah_from)
                : Promise.resolve({ data: [] as { id: string; book_id: number }[] }),
            ]);

          const surahNameAr = surah?.name_ar ?? "";

          const tafsirEntries = await Promise.all(
            (books ?? []).map((book) =>
              supabase
                .from("tafsir_entries")
                .select("*")
                .eq("book_id", book.id)
                .eq("surah", result.surah)
                .lte("verse_from", result.ayah_from)
                .gte("verse_to", result.ayah_from)
                .maybeSingle()
                .then((r) => ({ book, entry: r.data }))
            )
          );

          return (
            <div key={`${result.surah}-${result.ayah_from}-${i}`} className="flex flex-col gap-16">
              <p className="text-body-lg text-ink">
                {leadLine} {formatVerseLabel(surahNameAr, result.ayah_from, result.ayah_to)}:
              </p>
              <VerseCard
                surahNameAr={surahNameAr}
                ayahFrom={result.ayah_from}
                ayahTo={result.ayah_to}
                verses={verses ?? []}
              />
              <div className="flex flex-col gap-12">
                {tafsirEntries.map(({ book, entry }) => {
                  const saved = (savedRows ?? []).find((s) => s.book_id === book.id);
                  return (
                    <TafsirCard
                      key={book.id}
                      bookNameAr={book.name_ar}
                      authorAr={book.author_ar}
                      verseFrom={entry?.verse_from ?? result.ayah_from}
                      verseTo={entry?.verse_to ?? result.ayah_from}
                      reviewed={entry?.reviewed ?? false}
                      showReviewBadge={SHOW_REVIEW_BADGE}
                      text={entry?.text ?? null}
                      referenceLabel={formatVerseLabel(
                        surahNameAr,
                        entry?.verse_from ?? result.ayah_from,
                        entry?.verse_to ?? result.ayah_from
                      )}
                      surah={result.surah}
                      ayah={result.ayah_from}
                      bookId={book.id}
                      currentProjectId={projectId}
                      savedSourceId={saved?.id ?? null}
                    />
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
