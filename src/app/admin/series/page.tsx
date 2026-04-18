"use client";

import { Button } from "@/components/ui";
import { formatViews } from "@/components/series-poster";
import { deleteSeries } from "@/lib/api/series-api";
import { useRefreshSeriesList } from "@/hooks/use-series-list";
import Link from "next/link";
import { useState } from "react";

export default function AdminSeriesPage() {
  const [series, refresh] = useRefreshSeriesList();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(s: { id: string; title: string }) {
    if (!confirm(`ลบซีรี่ "${s.title}" ถาวร? การกระทำนี้ย้อนกลับไม่ได้`)) {
      return;
    }
    setDeletingId(s.id);
    const result = await deleteSeries(s.id);
    setDeletingId(null);
    if (!result.ok) {
      alert(result.message || "ลบไม่สำเร็จ");
      return;
    }
    refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">ซีรี่ทั้งหมด</h1>
        <p className="text-sm text-[var(--foreground-muted)]">ดึงรายการจาก API ตามสเปกล่าสุด</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted)] text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อ</th>
              <th className="px-4 py-3 font-medium">ตอน</th>
              <th className="px-4 py-3 font-medium">วิว</th>
              <th className="px-4 py-3 font-medium">แท็ก</th>
              <th className="px-4 py-3 font-medium text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              return (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                    <Link href={`/admin/series/${s.id}`} className="hover:text-[var(--accent-bright)]">
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)]">{s.episodes.length}</td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)]">{formatViews(s.views)}</td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)]">
                    {s.tags.length > 0 ? s.tags.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="danger"
                      className="min-h-9 px-3 text-xs"
                      disabled={deletingId === s.id}
                      onClick={() => handleDelete(s)}
                    >
                      {deletingId === s.id ? "กำลังลบ..." : "ลบ"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
