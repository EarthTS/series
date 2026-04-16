"use client";

import { useMemo, useState } from "react";
import { useSeriesList } from "@/hooks/use-series-list";
import { SeriesPosterCard } from "@/components/series-poster";
import { Input } from "@/components/ui";

export default function SearchPage() {
  const list = useSeriesList();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (s) =>
        s.title.toLowerCase().includes(t) ||
        s.description.toLowerCase().includes(t) ||
        s.tags.some((tag) => tag.toLowerCase().includes(t))
    );
  }, [list, q]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/85 px-4 pb-4 pt-4 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--background)]/70">
        <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">ค้นหา</h1>
        <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
          ชื่อซีรี่ แนว หรือคำในเรื่องย่อ
        </p>
        <div className="relative mt-4">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
          </span>
          <Input
            type="search"
            placeholder="ค้นหาซีรี่…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-11"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="px-4 pb-8 pt-5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40 py-14 text-center">
            <p className="text-sm text-[var(--foreground-muted)]">ไม่พบซีรี่ที่ตรงกับคำค้น</p>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]/80">ลองคำสั้น ๆ หรือชื่อนักแสดง</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((s) => (
              <SeriesPosterCard key={s.id} series={s} fullWidth />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
