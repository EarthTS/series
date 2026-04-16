"use client";

import { PageHeader } from "@/components/page-header";
import { memberValidByExpiredDate, useAppState } from "@/context/app-state";
import Link from "next/link";

const perks = [
  "รับชมทุกตอนแบบไม่มีโฆษณาคั่น (POC)",
  "ภาพคมชัด เล่นต่อได้บนมือถือ",
  "ยกเลิกได้เมื่อสิ้นรอบบิล (จำลอง)",
];

export default function SubscribePage() {
  const { user } = useAppState();
  const active = memberValidByExpiredDate(user?.expiredDate ?? null);

  return (
    <div className="mx-auto w-full max-w-md">
      <PageHeader title="สมัครสมาชิก" backHref="/settings" />
      <div className="space-y-5 px-4 py-6">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--accent)]/15 blur-2xl" />
          <p className="text-sm font-medium text-[var(--foreground-muted)]">แพ็กเกจรายเดือน</p>
          <p className="mt-2 bg-gradient-to-br from-white to-[var(--accent-bright)] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            29
            <span className="text-lg font-bold text-[var(--foreground-muted)]"> บาท/เดือน</span>
          </p>
          {active && (
            <p className="mt-4 rounded-2xl border border-emerald-500/25 bg-[var(--success-muted)] px-3 py-2.5 text-sm text-emerald-200">
              คุณเป็นสมาชิกอยู่แล้ว — ต่ออายุได้จากหน้าชำระเงิน
            </p>
          )}
        </div>

        <ul className="space-y-0 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]/60 backdrop-blur-md">
          {perks.map((p, i) => (
            <li
              key={p}
              className={`flex gap-3 px-4 py-3.5 text-sm text-[var(--foreground)] ${
                i > 0 ? "border-t border-[var(--border)]" : ""
              }`}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xs font-bold text-[var(--accent-bright)]">
                ✓
              </span>
              {p}
            </li>
          ))}
        </ul>

        <Link
          href="/pay"
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#5a9fe8] via-[#6eb5ff] to-[#8ecfff] px-4 text-sm font-bold text-[#061018] shadow-[0_10px_32px_var(--accent-glow)] transition-[filter] hover:brightness-[1.06]"
        >
          ไปชำระเงินด้วย Thai QR
        </Link>

        <p className="text-center text-xs leading-relaxed text-[var(--foreground-muted)]">
          POC การชำระเงินจำลองเท่านั้น ไม่มีการตัดบัตรจริง
        </p>
      </div>
    </div>
  );
}
