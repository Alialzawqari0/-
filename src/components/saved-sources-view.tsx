import { VerseCard } from "@/components/verse-card";
import { SavedSourceCard } from "@/components/saved-source-card";
import { formatVerseLabel } from "@/lib/format";
import type { SavedSourceRow } from "@/lib/data";

const SHOW_REVIEW_BADGE = process.env.SHOW_REVIEW_BADGE !== "false";

export function SavedSourcesView({
  sources,
  showProjectLabel = false,
}: {
  sources: SavedSourceRow[];
  showProjectLabel?: boolean;
}) {
  if (sources.length === 0) {
    return (
      <p className="text-body text-graphite leading-reading">لا توجد مصادر محفوظة بعد.</p>
    );
  }

  const ordered = showProjectLabel
    ? [...sources].sort((a, b) => a.project_title.localeCompare(b.project_title, "ar"))
    : sources;

  const groups = new Map<string, SavedSourceRow[]>();
  for (const s of ordered) {
    const key = `${s.project_id}:${s.surah}:${s.ayah}`;
    const group = groups.get(key);
    if (group) group.push(s);
    else groups.set(key, [s]);
  }

  return (
    <div className="flex flex-col gap-32">
      {[...groups.entries()].map(([key, group]) => {
        const first = group[0];
        return (
          <div key={key} className="flex flex-col gap-16">
            {showProjectLabel && (
              <p className="text-body-sm text-graphite">{first.project_title}</p>
            )}
            <VerseCard
              surahNameAr={first.surah_name_ar}
              ayahFrom={first.ayah}
              ayahTo={first.ayah}
              verses={[{ number: first.ayah, text: first.ayah_text }]}
            />
            <div className="flex flex-col gap-12">
              {group.map((s) => (
                <SavedSourceCard
                  key={s.id}
                  bookNameAr={s.book_name_ar}
                  authorAr={s.book_author_ar}
                  verseFrom={s.tafsir_verse_from}
                  verseTo={s.tafsir_verse_to}
                  reviewed={s.reviewed}
                  showReviewBadge={SHOW_REVIEW_BADGE}
                  text={s.tafsir_text}
                  referenceLabel={formatVerseLabel(
                    s.surah_name_ar,
                    s.tafsir_verse_from,
                    s.tafsir_verse_to
                  )}
                  surah={s.surah}
                  ayah={s.ayah}
                  bookId={s.book_id}
                  currentProjectId={s.project_id}
                  savedSourceId={s.id}
                  projectId={s.project_id}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
