import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllTafsirBooks, getProfile } from "@/lib/data";
import { NewChatView } from "@/components/new-chat-view";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [books, profile] = await Promise.all([getAllTafsirBooks(), getProfile(user.id)]);

  return (
    <NewChatView
      displayName={profile?.display_name || user.email?.split("@")[0] || ""}
      books={books}
      preferredBooks={profile?.preferred_books ?? ["tabari", "kathir", "saadi", "muyassar"]}
      projectId={project}
    />
  );
}
