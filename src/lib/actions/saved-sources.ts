"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveSource(
  projectId: string,
  surah: number,
  ayah: number,
  bookId: number
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_sources")
    .insert({ project_id: projectId, surah, ayah, book_id: bookId })
    .select()
    .maybeSingle();
  // unique(project_id, surah, ayah, book_id) — saving twice is a no-op, not an error
  if (error && error.code !== "23505") throw error;
  revalidatePath("/saved");
  revalidatePath(`/projects/${projectId}`);
}

export async function removeSavedSource(savedSourceId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("saved_sources").delete().eq("id", savedSourceId);
  if (error) throw error;
  revalidatePath("/saved");
  revalidatePath(`/projects/${projectId}`);
}
