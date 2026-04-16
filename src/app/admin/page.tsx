"use client";

import { useMemo } from "react";
import { useRefreshSeriesList } from "@/hooks/use-series-list";

export default function AdminDashboardPage() {
  const [series, refresh] = useRefreshSeriesList();

  const stats = useMemo(() => {
    const epCount = series.reduce((n, s) => n + s.episodes.length, 0);
    const views = series.reduce((n, s) => n + s.views, 0);
    return { series: series.length, episodes: epCount, views };
  }, [series]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">แดชบอร์ด</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          สรุปภาพรวมคอนเทนต์ในเครื่องนี้ (ข้อมูลจำลอง + ที่อัปโหลด)
        </p>
      </div>

      <button
        type="button"
        onClick={() => refresh()}
        className="text-xs font-semibold text-[var(--accent-bright)] underline underline-offset-2"
      >
        รีเฟรชข้อมูล
      </button>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <p className="text-sm text-[var(--foreground-muted)]">ซีรี่ทั้งหมด</p>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{stats.series}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <p className="text-sm text-[var(--foreground-muted)]">ตอนทั้งหมด</p>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{stats.episodes}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <p className="text-sm text-[var(--foreground-muted)]">ยอดวิวรวม (ในระบบ)</p>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            {(stats.views / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-5 text-sm text-[var(--foreground-muted)] backdrop-blur-md">
        <p className="font-bold text-[var(--foreground)]">หมายเหตุ POC</p>
        <p className="mt-2 leading-relaxed">
          รายได้สมาชิกและผู้ใช้งานจริงยังไม่ได้เชื่อมแบ็กเอนด์ — หน้านี้ใช้สำหรับทดสอบ UI และ
          flow การจัดการซีรี่เท่านั้น
        </p>
      </div>
    </div>
  );
}
