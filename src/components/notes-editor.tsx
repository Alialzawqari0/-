"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { updateProjectNotes } from "@/lib/actions/projects";

export function NotesEditor({ projectId, initialNotes }: { projectId: string; initialNotes: string }) {
  const [notes, setNotes] = React.useState(initialNotes);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setNotes(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateProjectNotes(projectId, value);
    }, 800);
  }

  return (
    <Textarea
      value={notes}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="اكتب ملاحظاتك عن هذا المشروع…"
      className="min-h-[240px] rounded-xl border border-warm-mist bg-soft-paper p-16 text-body-lg leading-reading"
    />
  );
}
