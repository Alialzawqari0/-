"use client";

import * as React from "react";
import { ArrowUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePreferredBooks } from "@/lib/actions/profile";
import type { TafsirBook, TafsirBookKey } from "@/types/db";

export function Composer({
  onSend,
  books,
  preferredBooks,
  pending,
}: {
  onSend: (text: string) => void | Promise<void>;
  books: TafsirBook[];
  preferredBooks: TafsirBookKey[];
  pending: boolean;
}) {
  const [text, setText] = React.useState("");
  const [selected, setSelected] = React.useState<Set<TafsirBookKey>>(new Set(preferredBooks));
  const [composing, setComposing] = React.useState(false);

  function handleSend() {
    const value = text.trim();
    if (!value || pending) return;
    setText("");
    onSend(value);
  }

  async function toggleBook(key: TafsirBookKey) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
    await updatePreferredBooks(Array.from(next));
  }

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="rounded-2xl border border-warm-mist bg-soft-paper p-12 shadow-subtle focus-within:border-deep-teal">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !composing) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="اسأل عن آية أو موضوع في التفسير…"
          className="min-h-[56px] max-h-[160px] resize-none border-0 bg-transparent p-4 text-body-lg shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="dense" className="border-0 text-graphite">
                <BookOpen />
                التفاسير
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[220px]">
              <div className="flex flex-col gap-8">
                {books.map((book) => (
                  <label key={book.id} className="flex items-center gap-8 text-body">
                    <Checkbox
                      checked={selected.has(book.key)}
                      onCheckedChange={() => toggleBook(book.key)}
                    />
                    {book.name_ar}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            size="icon"
            className="rounded-full"
            disabled={!text.trim() || pending}
            onClick={handleSend}
            aria-label="إرسال"
          >
            <ArrowUp />
          </Button>
        </div>
      </div>
      <p className="mt-8 text-body-sm text-graphite">
        دِرَايَة أداة بحث في كتب التفسير، وليست مصدر فتوى.
      </p>
    </div>
  );
}
