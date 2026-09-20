"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProject } from "@/lib/actions/projects";

interface ProjectSummary {
  id: string;
  title: string;
}

export function ProjectPickerDialog({
  open,
  onOpenChange,
  onPicked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPicked: (projectId: string) => void | Promise<void>;
}) {
  const [projects, setProjects] = React.useState<ProjectSummary[] | null>(null);
  const [newTitle, setNewTitle] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>احفظ في مشروع</DialogTitle>
        </DialogHeader>

        {projects === null ? (
          <p className="text-body-sm text-graphite">جارٍ التحميل…</p>
        ) : projects.length === 0 ? (
          <p className="text-body-sm text-graphite leading-reading">
            ما عندك مشاريع بعد. أنشئ مشروعاً لتحفظ فيه هذا المصدر.
          </p>
        ) : (
          <div className="flex max-h-[240px] flex-col gap-4 overflow-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPicked(p.id)}
                className="rounded-md px-8 py-8 text-start text-body hover:bg-warm-mist/35"
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-8 border-t border-warm-mist pt-16">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="مشروع جديد"
          />
          <Button
            variant="outline"
            disabled={!newTitle.trim()}
            onClick={async () => {
              const project = await createProject(newTitle.trim());
              setNewTitle("");
              await onPicked(project.id);
            }}
          >
            إنشاء وحفظ
          </Button>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
