"use client";

import * as React from "react";
import { Composer } from "@/components/composer";
import { SuggestionRows } from "@/components/suggestion-rows";
import { startChat } from "@/lib/actions/chat";
import type { TafsirBook, TafsirBookKey } from "@/types/db";

export function NewChatView({
  displayName,
  books,
  preferredBooks,
  projectId,
}: {
  displayName: string;
  books: TafsirBook[];
  preferredBooks: TafsirBookKey[];
  projectId?: string;
}) {
  const [pending, setPending] = React.useState(false);

  async function handleSend(text: string) {
    setPending(true);
    try {
      await startChat(text, projectId);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-96px)] w-full max-w-[720px] flex-col justify-center px-16 md:px-32">
      <h1 className="text-center text-title font-semibold text-pure-black">
        السلام عليكم يا {displayName}
      </h1>
      <div className="mt-32">
        <Composer onSend={handleSend} books={books} preferredBooks={preferredBooks} pending={pending} />
      </div>
      <div className="mt-32">
        <SuggestionRows />
      </div>
    </div>
  );
}
