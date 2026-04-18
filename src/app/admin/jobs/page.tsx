"use client";

import { getApiV1ToolsBilibiliJobs } from "@/lib/api/generated/swagger";
import type { InternalHandlerBilibiliJob } from "@/lib/api/generated/swagger-model";
import { useCallback, useEffect, useMemo, useState } from "react";

type JobsResponse = {
  total?: number;
  jobs?: InternalHandlerBilibiliJob[];
};

function toJobsResponse(payload: unknown): JobsResponse {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  const maybe = payload as { total?: unknown; jobs?: unknown };
  return {
    total: typeof maybe.total === "number" ? maybe.total : undefined,
    jobs: Array.isArray(maybe.jobs) ? (maybe.jobs as InternalHandlerBilibiliJob[]) : undefined,
  };
}

function formatTime(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("th-TH");
}

function statusClassName(status?: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-300";
    case "failed":
      return "bg-red-500/15 text-red-300";
    case "running":
      return "bg-sky-500/15 text-sky-300";
    default:
      return "bg-[var(--muted)] text-[var(--foreground-muted)]";
  }
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<InternalHandlerBilibiliJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchJobs = useCallback(async () => {
    setError("");
    const response = await getApiV1ToolsBilibiliJobs();
    const payload = toJobsResponse(response.data);
    setJobs(payload.jobs ?? []);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function runInitialFetch() {
      try {
        await fetchJobs();
      } catch (cause) {
        if (!mounted) return;
        const message = cause instanceof Error ? cause.message : "โหลดรายการ jobs ไม่สำเร็จ";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    runInitialFetch();
    const intervalId = window.setInterval(() => {
      fetchJobs().catch(() => {
        // Keep old data if a periodic refresh fails.
      });
    }, 5000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [fetchJobs]);

  const runningCount = useMemo(
    () => jobs.filter((job) => job.status === "queued" || job.status === "running").length,
    [jobs]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Bilibili Jobs</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            ดูงานที่อยู่ในคิวและสถานะการประมวลผลจาก `/api/v1/tools/bilibili/jobs`
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchJobs()
              .catch((cause) => {
                const message = cause instanceof Error ? cause.message : "โหลดรายการ jobs ไม่สำเร็จ";
                setError(message);
              })
              .finally(() => setLoading(false));
          }}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          รีเฟรชตอนนี้
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/90 p-4">
          <p className="text-xs text-[var(--foreground-muted)]">จำนวนทั้งหมด</p>
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{jobs.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/90 p-4">
          <p className="text-xs text-[var(--foreground-muted)]">กำลังรัน / รอคิว</p>
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{runningCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/90 p-4">
          <p className="text-xs text-[var(--foreground-muted)]">อัปเดตล่าสุด</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
            {lastUpdated ? lastUpdated.toLocaleTimeString("th-TH") : "-"}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)]">
        <div className="grid grid-cols-[1.4fr_90px_100px_120px_150px] gap-2 border-b border-[var(--border)] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
          <p>Job</p>
          <p>สถานะ</p>
          <p>Progress</p>
          <p>ไฟล์</p>
          <p>เวลาเริ่ม</p>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-sm text-[var(--foreground-muted)]">กำลังโหลด jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="px-4 py-8 text-sm text-[var(--foreground-muted)]">ยังไม่มี jobs ในระบบ</div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {jobs.map((job) => {
              const itemCount = job.items?.length ?? 0;
              return (
                <li key={job.id || `${job.sourceUrl}-${job.createdAt}`} className="space-y-2 px-4 py-3 text-sm">
                  <div className="grid grid-cols-[1.4fr_90px_100px_120px_150px] gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--foreground)]">{job.id || "-"}</p>
                      <p className="truncate text-xs text-[var(--foreground-muted)]">{job.sourceUrl || "-"}</p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClassName(job.status)}`}
                      >
                        {job.status || "-"}
                      </span>
                    </div>
                    <p className="text-[var(--foreground)]">{Math.max(0, job.progress ?? 0)}%</p>
                    <p className="text-[var(--foreground)]">
                      {itemCount}
                      {job.total ? ` / ${job.total}` : ""}
                    </p>
                    <p className="text-[var(--foreground-muted)]">{formatTime(job.startedAt || job.createdAt)}</p>
                  </div>
                  {(job.message || job.error) && (
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {job.error ? `error: ${job.error}` : job.message}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
