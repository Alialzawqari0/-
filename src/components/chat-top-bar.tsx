"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectPickerDialog } from "@/components/project-picker-dialog";
import { moveChatToProject } from "@/lib/actions/chat";

export function ChatTopBar({
  title,
  chatId,
  projectTitle,
}: {
  title: string;
  chatId: string;
  projectTitle: string | null;
}) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <div className="flex h-[48px] items-center justify-between px-16">
      <h1 className="truncate text-body font-medium text-ink">{title || "محادثة جديدة"}</h1>
      <Button variant="ghost" size="dense" className="border-0 text-graphite" onClick={() => setPickerOpen(true)}>
        <Folder className="size-14" />
        {projectTitle ?? "بدون مشروع"}
      </Button>
      <ProjectPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPicked={async (projectId) => {
          await moveChatToProject(chatId, projectId);
          setPickerOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
