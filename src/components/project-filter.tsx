"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Folder } from "lucide-react";

export function ProjectFilter({ projects }: { projects: { id: string; title: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("project");
  const currentTitle = projects.find((p) => p.id === current)?.title;

  function select(id: string | null) {
    const params = new URLSearchParams(searchParams);
    if (id) params.set("project", id);
    else params.delete("project");
    router.push(`/saved${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="dense" className="border-0 text-graphite">
          <Folder className="size-14" />
          {currentTitle ?? "كل المشاريع"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => select(null)}>كل المشاريع</DropdownMenuItem>
        {projects.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => select(p.id)}>
            {p.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
