"use client";

import { EpisodePlayer } from "@/components/episode-player";
import { PageHeader } from "@/components/page-header";
import { formatViews } from "@/components/series-poster";
import { memberValidByExpiredDate, useAppState } from "@/context/app-state";
import { fetchSeriesById } from "@/lib/api/series-api";
import type { Series } from "@/lib/types";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function SeriesDetailClient() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const playEp = searchParams.get("play");
  const { user, updateContinue } = useAppState();
  const canWatch = memberValidByExpiredDate(user?.expiredDate ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchSeriesById(id)
      .then((item) => {
        if (mounted) setSeries(item);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const sortedEps = useMemo(
    () => [...(series?.episodes ?? [])].sort((a, b) => a.order - b.order),
    [series]
  );

  const playingEp = useMemo(() => {
    if (sortedEps.length === 0) return null;
    return sortedEps.find((e) => e.id === playEp) ?? sortedEps[0];
  }, [sortedEps, playEp]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center text-sm text-[var(--foreground-muted)]">
        กำลังโหลด...
      </div>
    );
  }

  if (!series) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center text-sm text-[var(--foreground-muted)]">
        ไม่พบซีรี่นี้
        <Link href="/home" className="mt-4 block text-[var(--accent)] underline">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md pb-8">
      <PageHeader title={series.title} backHref="/home" />

      <div className="px-4 pt-4">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--muted)] shadow-[0_20px_60px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.05]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={series.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="text-xs opacity-90">{formatViews(series.views)} วิว</p>
            <p className="mt-1 line-clamp-3 text-sm opacity-95">{series.description}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {series.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-0.5 text-xs text-[var(--foreground-muted)]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {playingEp && canWatch && (
        <div className="mt-6 px-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              กำลังรับชม: {playingEp.title}
            </h2>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
              EP
            </button>
          </div>
          <EpisodePlayer url={playingEp.url} title={playingEp.title} />
        </div>
      )}

      <div className="mt-6 px-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
          EP ทั้งหมด {sortedEps.length} ตอน · เลือกตอนผ่านปุ่มเมนูด้านบน
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-auto rounded-t-3xl border border-[var(--border)] bg-[var(--card-solid)] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--foreground)]">เลือกตอน</p>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs text-[var(--foreground-muted)]"
                onClick={() => setMenuOpen(false)}
              >
                ปิด
              </button>
            </div>
            <ul className="space-y-2">
              {sortedEps.map((ep) => (
                <li key={ep.id}>
                  {canWatch ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-left text-sm font-semibold text-[var(--foreground)]"
                      onClick={() => {
                        updateContinue({
                          seriesId: series.id,
                          episodeId: ep.id,
                          seriesTitle: series.title,
                          episodeTitle: ep.title,
                          coverUrl: series.coverUrl,
                          progress: 8,
                        });
                        setMenuOpen(false);
                        router.replace(`/series/${series.id}?play=${ep.id}`, { scroll: false });
                      }}
                    >
                      {ep.title}
                      {playEp === ep.id && (
                        <span className="rounded-lg bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-bold text-[var(--accent-bright)]">
                          กำลังเล่น
                        </span>
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/subscribe"
                      className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
                    >
                      {ep.title}
                      <span className="text-xs font-bold text-[var(--accent-bright)]">ปลดล็อก</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!canWatch && (
        <div className="mt-6 px-4">
          <div className="rounded-3xl border border-amber-400/25 bg-[var(--warning-muted)] p-4 text-sm text-amber-100">
            <p className="font-bold text-amber-50">ดูรายการตอนได้ แต่ยังเล่นไม่ได้</p>
            <p className="mt-1 text-amber-100/85">
              สมัครสมาชิก 29 บาท/เดือน เพื่อรับชมทุกตอน
            </p>
            <Link
              href="/subscribe"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5a9fe8] via-[#6eb5ff] to-[#8ecfff] px-5 text-sm font-bold text-[#061018] shadow-[0_8px_24px_var(--accent-glow)]"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
