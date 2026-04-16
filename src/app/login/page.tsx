"use client";

import { useAppState } from "@/context/app-state";
import { Button, Input, Label } from "@/components/ui";
import { loginWithPassword, type AuthLoginResult } from "@/lib/api/series-api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { login, user, hydrated } = useAppState();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated || !user) return;
    router.replace(user.isAdmin ? "/admin" : "/home");
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--foreground-muted)]">
        กำลังโหลด…
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col">
      <div className="relative overflow-hidden px-6 pb-10 pt-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[var(--accent)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--muted)] text-xl font-bold tracking-tight text-[var(--accent-bright)] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            WS
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-bright)]">
            Winter Series
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            เข้าสู่ระบบ
          </h1>
          <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-[var(--foreground-muted)]">
            ซีรี่แนวตั้ง คมชัด พร้อมดูต่อเมื่อไหร่ก็ได้
          </p>
        </div>
      </div>

      <div className="mt-auto px-6 pb-10">
        <div className="rounded-[1.75rem] border border-[var(--border-strong)] bg-[var(--card)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!email.trim() || !password.trim()) return;
              setLoading(true);
              setError("");
              let auth: AuthLoginResult;
              try {
                auth = await loginWithPassword({
                  email: email.trim(),
                  password: password.trim(),
                });
              } catch {
                auth = {
                  ok: false,
                  id: "",
                  name: "",
                  email: email.trim(),
                  isAdmin: false,
                  token: null,
                  message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
                };
              }
              setLoading(false);
              if (!auth.ok) {
                setError(auth.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
                return;
              }
              login({
                id: auth.id,
                name: auth.name,
                email: auth.email,
                isAdmin: auth.isAdmin,
                expiredDate: auth.expiredDate,
              });
              router.replace(auth.isAdmin ? "/admin" : "/home");
            }}
          >
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบ"}
            </Button>
            {error && <p className="text-xs text-red-300">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
