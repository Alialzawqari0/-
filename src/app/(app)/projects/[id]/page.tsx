import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSavedSources } from "@/lib/data";
import { EditableDescription, EditableTitle } from "@/components/editable-text";
import { NotesEditor } from "@/components/notes-editor";
import { SavedSourcesView } from "@/components/saved-sources-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toArabicNumber } from "@/lib/format";
import { renameProject, updateProjectDescription } from "@/lib/actions/projects";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: chats }, sources] = await Promise.all([
    supabase
      .from("chats")
      .select("id, title, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    getSavedSources(user.id, id),
  ]);

  const chatQuestionCounts = new Map<string, number>();
  if (chats && chats.length > 0) {
    const { data: counts } = await supabase
      .from("messages")
      .select("chat_id")
      .in(
        "chat_id",
        chats.map((c) => c.id)
      )
      .eq("role", "user");
    for (const row of counts ?? []) {
      chatQuestionCounts.set(row.chat_id, (chatQuestionCounts.get(row.chat_id) ?? 0) + 1);
    }
  }

  async function saveTitle(title: string) {
    "use server";
    await renameProject(id, title);
  }

  async function saveDescription(description: string) {
    "use server";
    await updateProjectDescription(id, description);
  }

  return (
    <div className="mx-auto max-w-[720px] px-16 py-32 md:px-32">
      <EditableTitle value={project.title} onSave={saveTitle} />
      <div className="mt-8">
        <EditableDescription value={project.description} onSave={saveDescription} />
      </div>

      <div className="mt-16">
        <Button asChild>
          <Link href={`/?project=${id}`}>بحث جديد في المشروع</Link>
        </Button>
      </div>

      <Tabs defaultValue="chats" className="mt-32">
        <TabsList>
          <TabsTrigger value="chats">المحادثات ({toArabicNumber(chats?.length ?? 0)})</TabsTrigger>
          <TabsTrigger value="sources">المصادر المحفوظة ({toArabicNumber(sources.length)})</TabsTrigger>
          <TabsTrigger value="notes">الملاحظات</TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="mt-16">
          {!chats || chats.length === 0 ? (
            <p className="text-body text-graphite">محادثاتك تظهر هنا.</p>
          ) : (
            <div className="flex flex-col">
              {chats.map((chat, i) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className={`flex items-center justify-between py-12 text-body text-ink hover:bg-warm-mist/35 ${
                    i > 0 ? "border-t border-warm-mist" : ""
                  }`}
                >
                  <span className="truncate">{chat.title || "محادثة جديدة"}</span>
                  <span className="text-body-sm text-graphite">
                    {toArabicNumber(chatQuestionCounts.get(chat.id) ?? 0)} أسئلة
                  </span>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sources" className="mt-16">
          <SavedSourcesView sources={sources} />
        </TabsContent>

        <TabsContent value="notes" className="mt-16">
          <NotesEditor projectId={id} initialNotes={project.notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
