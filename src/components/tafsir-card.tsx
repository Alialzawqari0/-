"use client";

import * as React from "react";
import { Bookmark, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toArabicNumber } from "@/lib/format";
import { ProjectPickerDialog } from "@/components/project-picker-dialog";
import { saveSource, removeSavedSource } from "@/lib/actions/saved-sources";

export interface TafsirCardProps {
  bookNameAr: string;
  authorAr: string;
  verseFrom: number;
  verseTo: number;
  reviewed: boolean;
  showReviewBadge: boolean;
  text: string | null; // null: no commentary for this verse in this book (spec section 10)
  referenceLabel: string;
  surah: number;
  ayah: number;
  bookId: number;
  currentProjectId: string | null;
  savedSourceId: string | null;
  /** When set, the footer shows "أزل من المشروع" instead of the save/saved control (used on /saved and /projects/[id]). */
  onRemoveFromProject?: () => void | Promise<void>;
}

const CLAMP_CLASS = "line-clamp-[10]";

export function TafsirCard({
  bookNameAr,
  authorAr,
  verseFrom,
  verseTo,
  reviewed,
  showReviewBadge,
  text,
  referenceLabel,
  surah,
  ayah,
  bookId,
  currentProjectId,
  savedSourceId,
  onRemoveFromProject,
}: TafsirCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [saved, setSaved] = React.useState(!!savedSourceId);
  const [savedId, setSavedId] = React.useState(savedSourceId);

  async function handleSaveClick() {
    if (saved && savedId) {
      await removeSavedSource(savedId, currentProjectId ?? "");
      setSaved(false);
      setSavedId(null);
      return;
    }
    if (currentProjectId) {
      await saveSource(currentProjectId, surah, ayah, bookId);
      setSaved(true);
      return;
    }
    setPickerOpen(true);
  }

  return (
    <div className="rounded-xl border border-warm-mist bg-soft-paper p-16">
      <div className="flex flex-wrap items-baseline gap-8">
        <h3 className="text-body font-semibold text-ink">{bookNameAr}</h3>
        <span className="text-body-sm text-graphite">{authorAr}</span>
        {verseTo > verseFrom && (
          <span className="text-caption text-graphite">
            الآيات {toArabicNumber(verseFrom)}–{toArabicNumber(verseTo)}
          </span>
        )}
        {showReviewBadge && !reviewed && (
          <span className="rounded-md border border-dashed border-warm-mist px-4 text-caption text-ash">
            قيد المراجعة
          </span>
        )}
      </div>

      <div className="mt-12">
        {text === null ? (
          <p className="text-body-lg leading-reading text-graphite">
            لا يوجد في هذا الكتاب نص لهذه الآية.
          </p>
        ) : (
          <>
            <p
              className={`whitespace-pre-line text-body-lg leading-reading text-ink ${expanded ? "" : CLAMP_CLASS}`}
            >
              {text}
            </p>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-8 text-body-sm text-deep-teal"
            >
              {expanded ? "عرض أقل" : "عرض المزيد"}
            </button>
          </>
        )}
      </div>

      {text !== null && (
        <div className="mt-12 flex items-center justify-between border-t border-warm-mist pt-12">
          <span className="text-body-sm text-graphite">{referenceLabel}</span>
          {onRemoveFromProject ? (
            <Button variant="ghost" size="dense" onClick={onRemoveFromProject}>
              أزل من المشروع
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="dense"
              onClick={handleSaveClick}
              className={saved ? "bg-deep-teal/8 text-deep-teal" : ""}
            >
              {saved ? <Check /> : <Bookmark />}
              {saved ? "محفوظ" : "احفظ في المشروع"}
            </Button>
          )}
        </div>
      )}

      {!onRemoveFromProject && (
        <ProjectPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onPicked={async (projectId) => {
            await saveSource(projectId, surah, ayah, bookId);
            setSaved(true);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
