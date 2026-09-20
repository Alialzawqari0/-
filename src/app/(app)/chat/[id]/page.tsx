import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllTafsirBooks, getProfile } from "@/lib/data";
import { ChatTopBar } from "@/components/chat-top-bar";
import { AnswerBlock } from "@/components/answer-block";
import { ChatComposerWrapper } from "@/components/chat-composer-wrapper";
import { AutoScrollAnchor } from "@/components/auto-scroll-anchor";
import type { AnswerContent, UserMessageContent } from "@/types/db";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: chat }, { data: messages }, books, profile] = await Promise.all([
    supabase.from("chats").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("messages").select("*").eq("chat_id", id).order("created_at"),
    getAllTafsirBooks(),
    getProfile(user.id),
  ]);

  if (!chat) notFound();

  let projectTitle: string | null = null;
  if (chat.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", chat.project_id)
      .maybeSingle();
    projectTitle = project?.title ?? null;
  }

  const preferredBooks = profile?.preferred_books ?? ["tabari", "kathir", "saadi", "muyassar"];

  return (
    <div className="flex h-svh flex-col">
      <ChatTopBar title={chat.title} chatId={chat.id} projectTitle={projectTitle} />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-[720px] flex-col gap-32 px-16 py-32 md:px-32">
          {(messages ?? []).map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-start">
                <p className="max-w-[85%] rounded-xl bg-warm-mist/35 px-16 py-8 text-body-lg text-ink">
                  {(message.content_json as UserMessageContent).text}
                </p>
              </div>
            ) : (
              <AnswerBlock
                key={message.id}
                content={message.content_json as AnswerContent}
                projectId={chat.project_id}
                chatId={chat.id}
              />
            )
          )}
        </div>
        <AutoScrollAnchor trigger={(messages ?? []).length} />
      </div>
      <div className="border-t border-warm-mist bg-parchment pt-12 pb-16">
        <ChatComposerWrapper chatId={chat.id} books={books} preferredBooks={preferredBooks} />
      </div>
    </div>
  );
}
