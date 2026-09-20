"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildAnswer, titleFromText } from "@/lib/answer";
import type { UserMessageContent } from "@/types/db";

async function getContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const [{ data: surahs }, { data: profile }, { data: allBooks }] = await Promise.all([
    supabase.from("surahs").select("id, ayah_count"),
    supabase.from("profiles").select("preferred_books").eq("id", userId).maybeSingle(),
    supabase.from("tafsir_books").select("*").order("sort_order"),
  ]);

  const preferredKeys = profile?.preferred_books ?? ["tabari", "kathir", "saadi", "muyassar"];
  const books = (allBooks ?? []).filter((b) => preferredKeys.includes(b.key));

  return { surahs: surahs ?? [], books: books.length > 0 ? books : allBooks ?? [] };
}

export async function startChat(text: string, projectId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .insert({ user_id: user.id, project_id: projectId ?? null, title: titleFromText(text) })
    .select()
    .single();
  if (chatError) throw chatError;

  const userContent: UserMessageContent = { text };
  await supabase.from("messages").insert({ chat_id: chat.id, role: "user", content_json: userContent });

  const { surahs, books } = await getContext(supabase, user.id);
  const answer = await buildAnswer(supabase, text, surahs, books);
  await supabase.from("messages").insert({ chat_id: chat.id, role: "assistant", content_json: answer });

  revalidatePath("/", "layout");
  redirect(`/chat/${chat.id}`);
}

export async function postMessage(chatId: string, text: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const userContent: UserMessageContent = { text };
  await supabase.from("messages").insert({ chat_id: chatId, role: "user", content_json: userContent });

  const { surahs, books } = await getContext(supabase, user.id);
  const answer = await buildAnswer(supabase, text, surahs, books);
  await supabase.from("messages").insert({ chat_id: chatId, role: "assistant", content_json: answer });

  revalidatePath(`/chat/${chatId}`);
}

export async function renameChat(chatId: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("chats").update({ title }).eq("id", chatId);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function moveChatToProject(chatId: string, projectId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("chats").update({ project_id: projectId }).eq("id", chatId);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export interface ChatSnapshot {
  chat: { id: string; user_id: string; project_id: string | null; title: string; created_at: string };
  messages: { id: string; role: string; content_json: unknown; created_at: string }[];
}

export async function deleteChat(chatId: string): Promise<ChatSnapshot | null> {
  const supabase = await createClient();

  const { data: chat } = await supabase.from("chats").select("*").eq("id", chatId).maybeSingle();
  if (!chat) return null;
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at");

  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  if (error) throw error;

  revalidatePath("/", "layout");
  return { chat, messages: messages ?? [] };
}

export async function restoreChat(snapshot: ChatSnapshot) {
  const supabase = await createClient();
  const { error: chatError } = await supabase.from("chats").insert({
    id: snapshot.chat.id,
    user_id: snapshot.chat.user_id,
    project_id: snapshot.chat.project_id,
    title: snapshot.chat.title,
    created_at: snapshot.chat.created_at,
  });
  if (chatError) throw chatError;

  if (snapshot.messages.length > 0) {
    const { error: messagesError } = await supabase.from("messages").insert(
      snapshot.messages.map((m) => ({
        id: m.id,
        chat_id: snapshot.chat.id,
        role: m.role as "user" | "assistant",
        content_json: m.content_json as UserMessageContent,
        created_at: m.created_at,
      }))
    );
    if (messagesError) throw messagesError;
  }

  revalidatePath("/", "layout");
}
