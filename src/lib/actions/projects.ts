"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProject(title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, title, description: "", notes: "" })
    .select()
    .single();
  if (error) throw error;

  revalidatePath("/", "layout");
  return data;
}

export async function renameProject(projectId: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ title }).eq("id", projectId);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function updateProjectDescription(projectId: string, description: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ description }).eq("id", projectId);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectNotes(projectId: string, notes: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ notes }).eq("id", projectId);
  if (error) throw error;
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
  revalidatePath("/", "layout");
}
