import Link from "next/link";
import type { Series } from "@/lib/types";
import { cn } from "@/components/ui";

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("th-TH");
}

export function SeriesPosterCard({
  series,
  className,
  aspect = "poster",
  fullWidth,
}: {
  series: Series;
  className?: string;
  aspect?: "poster" | "wide";
  fullWidth?: boolean;
}) {
  return (
    <Link
      href={`/series/${series.id}`}
      className={cn(
        "group block shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] shadow-[0_8px_32px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.04] transition-[transform,box-shadow] active:scale-[0.98]",
        aspect === "poster" && !fullWidth && "w-[8rem] sm:w-[8.25rem]",
        (aspect === "wide" || fullWidth) && "w-full",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-[var(--muted)]",
          aspect === "poster" ? "aspect-[2/3]" : "aspect-video"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ปกจาก URL ภายนอก/แอดมิน */}
        <img
          src={series.coverUrl}
          alt={series.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a10]/90 via-[#060a10]/15 to-transparent" />
        <span className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/45 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/95 backdrop-blur-md">
          {formatViews(series.views)}
        </span>
      </div>
      <div className="border-t border-[var(--border)] bg-[var(--card-solid)]/90 px-2.5 py-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-[var(--foreground)] sm:text-xs">
          {series.title}
        </p>
      </div>
    </Link>
  );
}

export function SeriesRow({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-dim)]" />
          <h2 className="text-sm font-bold tracking-tight text-[var(--foreground)]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}
