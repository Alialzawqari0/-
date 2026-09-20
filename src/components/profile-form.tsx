"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteAccount, updateDisplayName, updatePreferredBooks } from "@/lib/actions/profile";
import type { TafsirBook, TafsirBookKey } from "@/types/db";

export function ProfileForm({
  email,
  displayName,
  books,
  preferredBooks,
}: {
  email: string;
  displayName: string;
  books: TafsirBook[];
  preferredBooks: TafsirBookKey[];
}) {
  const [name, setName] = React.useState(displayName);
  const [selected, setSelected] = React.useState<Set<TafsirBookKey>>(new Set(preferredBooks));
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function toggleBook(key: TafsirBookKey) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
    await updatePreferredBooks(Array.from(next));
  }

  function handleExport() {
    import("@/lib/actions/profile").then(async ({ exportUserData }) => {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diraya-data.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col gap-32">
      <div className="flex flex-col gap-8">
        <Label htmlFor="display_name">الاسم</Label>
        <Input
          id="display_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && updateDisplayName(name.trim())}
          className="max-w-[320px]"
        />
      </div>

      <div className="flex flex-col gap-8">
        <Label>البريد الإلكتروني</Label>
        <p className="text-body text-graphite" dir="ltr">
          {email}
        </p>
      </div>

      <div id="books" className="flex flex-col gap-8">
        <Label>التفاسير المفضلة</Label>
        <div className="flex flex-col gap-8">
          {books.map((book) => (
            <label key={book.id} className="flex items-center gap-8 text-body">
              <Checkbox checked={selected.has(book.key)} onCheckedChange={() => toggleBook(book.key)} />
              {book.name_ar}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-8 border-t border-warm-mist pt-16">
        <Button variant="outline" onClick={handleExport}>
          تصدير بياناتي
        </Button>
        <Button variant="ghost" onClick={() => setConfirmOpen(true)}>
          حذف الحساب
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف الحساب</DialogTitle>
            <DialogDescription>
              سيؤدي هذا إلى حذف حسابك وجميع مشاريعك ومحادثاتك ومصادرك المحفوظة نهائياً. هذا
              الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={() => deleteAccount()}>تأكيد الحذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
