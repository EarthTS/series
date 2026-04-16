"use client";

import { Button } from "@/components/ui";
import { memberValidByExpiredDate, useAppState } from "@/context/app-state";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatThaiDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function SettingsPage() {
  const { user, logout } = useAppState();
  const router = useRouter();
  const active = memberValidByExpiredDate(user?.expiredDate ?? null);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-6">
      <h1 className="mb-6 text-lg font-bold tracking-tight text-[var(--foreground)]">ตั้งค่า</h1>

      <div className="mb-5 flex items-center gap-4 rounded-3xl border border-[var(--border-strong)] bg-[var(--card)] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--accent)]/35 bg-gradient-to-br from-[var(--muted)] to-[var(--card-solid)] text-xl font-bold text-[var(--accent-bright)] shadow-inner">
          {(user?.name ?? "?").slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-[var(--foreground)]">{user?.name}</p>
          <p className="truncate text-sm text-[var(--foreground-muted)]">{user?.email}</p>
        </div>
      </div>

      <section className="mb-5 overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--card-solid)] shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
        <div className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/12 to-transparent px-5 py-4">
          <h2 className="text-sm font-bold text-[var(--foreground)]">สมาชิก Winter Series</h2>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">29 บาท/เดือน · รับชมทุกตอน</p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            สถานะ:{" "}
            <span
              className={
                active ? "font-bold text-emerald-400" : "font-bold text-amber-300"
              }
            >
              {active ? "ใช้งานได้" : "ยังไม่สมัคร / หมดอายุ"}
            </span>
          </p>
          {active && user?.expiredDate && (
            <p className="text-sm text-[var(--foreground-muted)]">
              ใช้ได้ถึง{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {formatThaiDate(user.expiredDate)}
              </span>
            </p>
          )}
          <Link
            href="/subscribe"
            className={`flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold transition-[box-shadow,opacity] ${
              active
                ? "border border-[var(--border-strong)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted-hover)]"
                : "bg-gradient-to-br from-[#5a9fe8] via-[#6eb5ff] to-[#8ecfff] text-[#061018] shadow-[0_8px_28px_var(--accent-glow)] hover:brightness-[1.05]"
            }`}
          >
            {active ? "ต่ออายุ / จัดการแพ็กเกจ" : "สมัครสมาชิก 29 บาท/เดือน"}
          </Link>
        </div>
      </section>

      <Button
        variant="secondary"
        className="w-full border-[var(--border-strong)]"
        onClick={() => {
          logout();
          router.replace("/login");
        }}
      >
        ออกจากระบบ
      </Button>
    </div>
  );
}
