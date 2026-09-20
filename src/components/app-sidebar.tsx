"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronDown, Folder, MoreHorizontal, Search, SquarePen } from "lucide-react";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toArabicNumber } from "@/lib/format";
import { groupChatsByDate } from "@/lib/date-groups";
import type { Chat } from "@/types/db";
import { createProject, deleteProject, renameProject } from "@/lib/actions/projects";
import { deleteChat, moveChatToProject, renameChat, restoreChat } from "@/lib/actions/chat";
import { signOut } from "@/lib/actions/auth";

export interface SidebarProjectSummary {
  id: string;
  title: string;
  chat_count: number;
}

interface AppSidebarProps {
  displayName: string;
  email: string;
  projects: SidebarProjectSummary[];
  chatsWithoutProject: Chat[];
  allChatsForSearch: { id: string; title: string }[];
}

export function AppSidebar({
  displayName,
  email,
  projects,
  chatsWithoutProject,
  allChatsForSearch,
}: AppSidebarProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [newProjectOpen, setNewProjectOpen] = React.useState(false);

  return (
    <Sidebar side="right" variant="inset" collapsible="offcanvas">
      <SidebarHeader className="flex flex-row items-center justify-between">
        <Link href="/" className="text-body-lg font-semibold text-pure-black">
          دِرَايَة
        </Link>
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <SquarePen />
                    بحث جديد
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSearchOpen(true)}>
                  <Search />
                  بحث في المحادثات
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/saved">
                    <Bookmark />
                    المحفوظات
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Collapsible defaultOpen className="group/projects">
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer">
                <ChevronDown className="transition-transform group-data-[state=closed]/projects:-rotate-90" />
                المشاريع
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <SidebarGroupAction onClick={() => setNewProjectOpen(true)} aria-label="مشروع جديد">
              +
            </SidebarGroupAction>
            <CollapsibleContent>
              <SidebarGroupContent>
                {projects.length === 0 ? (
                  <p className="px-8 py-4 text-body-sm text-graphite leading-reading">
                    ما عندك مشاريع بعد. المشروع يجمع محادثاتك ومصادرك المحفوظة.
                  </p>
                ) : (
                  <SidebarMenu>
                    {projects.slice(0, 5).map((project) => (
                      <ProjectRow key={project.id} project={project} />
                    ))}
                    {projects.length > 5 && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/saved">عرض الكل</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen className="group/chats">
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer">
                <ChevronDown className="transition-transform group-data-[state=closed]/chats:-rotate-90" />
                المحادثات
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                {chatsWithoutProject.length === 0 ? (
                  <p className="px-8 py-4 text-body-sm text-graphite">محادثاتك تظهر هنا.</p>
                ) : (
                  groupChatsByDate(chatsWithoutProject).map((group) => (
                    <div key={group.label}>
                      <p className="px-8 pt-8 text-caption text-graphite">{group.label}</p>
                      <SidebarMenu>
                        {group.chats.map((chat) => (
                          <ChatRow key={chat.id} chat={chat} projects={projects} />
                        ))}
                      </SidebarMenu>
                    </div>
                  ))
                )}
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-36 w-full justify-start gap-8 border-0 px-8">
              <Avatar className="size-32">
                <AvatarFallback className="bg-warm-mist text-ink">
                  {displayName.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-start text-body">{displayName}</span>
              <ChevronDown className="size-16 text-graphite" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-[224px]">
            <DropdownMenuItem asChild>
              <Link href="/profile">الملف الشخصي</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile#books">التفاسير المفضلة</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/methodology">منهجنا ومصادرنا</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                const { exportUserData } = await import("@/lib/actions/profile");
                const data = await exportUserData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "diraya-data.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              تصدير بياناتي
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>تسجيل الخروج</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <p className="truncate px-8 text-caption text-graphite" dir="ltr">
          {email}
        </p>
      </SidebarFooter>
      <SidebarRail />

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="ابحث في عناوين المحادثات…" />
        <CommandList>
          <CommandEmpty>لا توجد نتائج.</CommandEmpty>
          <CommandGroup>
            {allChatsForSearch.map((chat) => (
              <CommandItem
                key={chat.id}
                value={chat.title}
                onSelect={() => {
                  setSearchOpen(false);
                  router.push(`/chat/${chat.id}`);
                }}
              >
                {chat.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </Sidebar>
  );
}

function NewProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setPending(true);
    const project = await createProject(title.trim());
    setPending(false);
    setTitle("");
    onOpenChange(false);
    router.push(`/projects/${project.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>مشروع جديد</DialogTitle>
        </DialogHeader>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان المشروع"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <DialogFooter>
          <Button onClick={handleCreate} disabled={pending || !title.trim()}>
            إنشاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectRow({ project }: { project: SidebarProjectSummary }) {
  const router = useRouter();
  const [renaming, setRenaming] = React.useState(false);
  const [title, setTitle] = React.useState(project.title);

  return (
    <SidebarMenuItem className="group/row">
      {renaming ? (
        <Input
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onBlur={async () => {
            setRenaming(false);
            if (title.trim() && title !== project.title) await renameProject(project.id, title.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-32"
        />
      ) : (
        <SidebarMenuButton asChild>
          <Link href={`/projects/${project.id}`}>
            <Folder />
            <span className="truncate">{project.title}</span>
          </Link>
        </SidebarMenuButton>
      )}
      <SidebarMenuBadge>{toArabicNumber(project.chat_count)}</SidebarMenuBadge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontal />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="start">
          <DropdownMenuItem onClick={() => setRenaming(true)}>إعادة تسمية</DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await deleteProject(project.id);
              router.refresh();
            }}
          >
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function ChatRow({
  chat,
  projects,
}: {
  chat: Chat;
  projects: SidebarProjectSummary[];
}) {
  const [renaming, setRenaming] = React.useState(false);
  const [title, setTitle] = React.useState(chat.title);

  async function handleDelete() {
    const snapshot = await deleteChat(chat.id);
    if (!snapshot) return;
    toast("حُذفت المحادثة", {
      action: {
        label: "تراجع",
        onClick: () => restoreChat(snapshot),
      },
    });
  }

  return (
    <SidebarMenuItem className="group/row">
      {renaming ? (
        <Input
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onBlur={async () => {
            setRenaming(false);
            if (title.trim() && title !== chat.title) await renameChat(chat.id, title.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-32"
        />
      ) : (
        <SidebarMenuButton asChild>
          <Link href={`/chat/${chat.id}`}>
            <span className="truncate">{chat.title || "محادثة جديدة"}</span>
          </Link>
        </SidebarMenuButton>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontal />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="start">
          <DropdownMenuItem onClick={() => setRenaming(true)}>إعادة تسمية</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>نقل إلى مشروع</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {projects.length === 0 ? (
                <DropdownMenuItem disabled>لا توجد مشاريع</DropdownMenuItem>
              ) : (
                projects.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => moveChatToProject(chat.id, p.id)}>
                    {p.title}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={handleDelete}>حذف</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
