"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Composer } from "@/components/composer";
import { LoadingIndicator } from "@/components/loading-indicator";
import { Button } from "@/components/ui/button";
import { postMessage } from "@/lib/actions/chat";
import type { TafsirBook, TafsirBookKey } from "@/types/db";

export function ChatComposerWrapper({
  chatId,
  books,
  preferredBooks,
}: {
  chatId: string;
  books: TafsirBook[];
  preferredBooks: TafsirBookKey[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [pendingText, setPendingText] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);
  const lastTextRef = React.useRef<string>("");

  async function send(text: string) {
    lastTextRef.current = text;
    setPending(true);
    setError(false);
    setPendingText(text);
    try {
      await postMessage(chatId, text);
      router.refresh();
      setPendingText(null);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {pendingText && (
        <div className="mx-auto flex w-full max-w-[720px] justify-start px-16">
          <p className="max-w-[85%] rounded-xl bg-warm-mist/35 px-16 py-8 text-body-lg text-ink">
            {pendingText}
          </p>
        </div>
      )}
      {pending && <LoadingIndicator bookCount={preferredBooks.length} />}
      {error && (
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-16">
          <p className="text-body-sm text-ink">تعذّر إتمام البحث. حاول مرة أخرى.</p>
          <Button variant="ghost" size="dense" onClick={() => send(lastTextRef.current)}>
            أعد المحاولة
          </Button>
        </div>
      )}
      <Composer onSend={send} books={books} preferredBooks={preferredBooks} pending={pending} />
    </div>
  );
}
