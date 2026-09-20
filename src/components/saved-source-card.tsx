"use client";

import { useRouter } from "next/navigation";
import { TafsirCard, type TafsirCardProps } from "@/components/tafsir-card";
import { removeSavedSource } from "@/lib/actions/saved-sources";

export function SavedSourceCard(
  props: Omit<TafsirCardProps, "onRemoveFromProject"> & { savedSourceId: string; projectId: string }
) {
  const router = useRouter();

  return (
    <TafsirCard
      {...props}
      onRemoveFromProject={async () => {
        await removeSavedSource(props.savedSourceId, props.projectId);
        router.refresh();
      }}
    />
  );
}
