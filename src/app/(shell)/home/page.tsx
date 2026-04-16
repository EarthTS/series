"use client";

import { SeriesPosterCard, SeriesRow, formatViews } from "@/components/series-poster";
import { useAppState } from "@/context/app-state";
import { useSeriesList } from "@/hooks/use-series-list";
import Link from "next/link";

export default function HomePage() {
  const list = useSeriesList();
  const { user, continueWatching } = useAppState();

  const byViews = [...list].sort((a, b) => b.views - a.views);
  const recommended = byViews.slice(0, 6);
  const hero = recommended[0];
  const recommendedRow = recommended.slice(1);
  const topViews = byViews.slice(0, 8);
  const newest = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const continueItems = continueWatching
    .map((c) => {
      const s = list.find((x) => x.id === c.seriesId);
      if (!s) return null;
      return { ...c, series: s };
    })
    .filter(Boolean) as Array<
      (typeof continueWatching)[0] & { series: (typeof list)[0] }
    >;

  return (
    <div className="mx-auto w-full max-w-md pb-6 pt-1">
      <div className="px-4 pb-5 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          สวัสดี
        </p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {user?.name}
        </p>
        <p className="mt-1.5 text-sm text-[var(--foreground-muted)]">
          คัดมาให้วันนี้ — แนะนำ · ฮิต · ใหม่
        </p>
      </div>

      {hero && (
        <div className="mb-8 px-4">
          <Link
            href={`/series/${hero.id}`}
            className="group relative block overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--card-solid)] shadow-[0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05]"
          >
            <div className="relative aspect-[16/10] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060a10] via-[#060a10]/4 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-flex rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-md">
                  แนะนำ
                </span>
                <p className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-white drop-shadow-md">
                  {hero.title}
                </p>
                <p className="mt-1 text-xs font-medium text-white/75">
                  {formatViews(hero.views)} วิว · แตะเพื่อดูรายละเอียด
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {continueItems.length > 0 && (
        <div className="mb-8 px-4">
          <SeriesRow title="ดูต่อ">
            {continueItems.map((item) => (
              <Link
                key={`${item.seriesId}-${item.episodeId}`}
                href={`/series/${item.seriesId}?play=${item.episodeId}`}
                className="group w-[9.5rem] shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.04] transition-transform active:scale-[0.98]"
              >
                <div className="relative aspect-video w-full bg-[var(--muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.coverUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-black/35">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-dim)] to-[var(--accent-bright)]"
                      style={{ width: `${Math.min(100, item.progress)}%` }}
                    />
                  </div>
                  <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
                <div className="border-t border-[var(--border)] px-2.5 py-2">
                  <p className="line-clamp-1 text-xs font-semibold text-[var(--foreground)]">
                    {item.seriesTitle}
                  </p>
                  <p className="line-clamp-1 text-[10px] text-[var(--foreground-muted)]">
                    {item.episodeTitle}
                  </p>
                </div>
              </Link>
            ))}
          </SeriesRow>
        </div>
      )}

      <div className="space-y-9 px-4">
        {recommendedRow.length > 0 && (
          <SeriesRow title="แนะนำสำหรับคุณ">
            {recommendedRow.map((s) => (
              <SeriesPosterCard key={s.id} series={s} />
            ))}
          </SeriesRow>
        )}

        <SeriesRow title="ยอดวิวสูงสุด">
          {topViews.map((s) => (
            <SeriesPosterCard key={`tv-${s.id}`} series={s} />
          ))}
        </SeriesRow>

        <SeriesRow title="อัปเดตใหม่">
          {newest.map((s) => (
            <SeriesPosterCard key={`nw-${s.id}`} series={s} />
          ))}
        </SeriesRow>
      </div>

      <p className="px-4 pt-8 text-center text-[10px] text-[var(--foreground-muted)]">
        ยอดวิวในชุดตัวอย่าง · สูงสุด {formatViews(byViews[0]?.views ?? 0)} วิว
      </p>
    </div>
  );
}
