"use client";

import { useState } from "react";
import { signInWithEmail } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const result = await signInWithEmail(email, window.location.origin);
    setStatus(result.error ? "error" : "sent");
  }

  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-parchment px-16">
      <div className="w-full max-w-[360px] rounded-2xl border border-warm-mist bg-soft-paper p-32 shadow-subtle">
        <h1 className="text-title font-semibold text-pure-black">دِرَايَة</h1>
        <p className="mt-8 text-body text-graphite">أداة بحث في كتب تفسير القرآن</p>

        {status === "sent" ? (
          <p className="mt-32 text-body-lg text-ink leading-reading" role="status">
            أرسلنا رابط الدخول إلى بريدك الإلكتروني. افتح بريدك واتبع الرابط لإكمال تسجيل الدخول.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-32 flex flex-col gap-16">
            <div className="flex flex-col gap-8">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="text-start"
              />
            </div>
            {status === "error" && (
              <p className="text-body-sm text-ink" role="alert">
                تعذّر إرسال رابط الدخول. تحقق من البريد الإلكتروني وأعد المحاولة.
              </p>
            )}
            <Button type="submit" disabled={status === "sending"} className="w-full">
              {status === "sending" ? "جارٍ الإرسال…" : "إرسال رابط الدخول"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
