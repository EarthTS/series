import { Suspense } from "react";
import { SeriesDetailClient } from "./series-detail-client";

export default function SeriesDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--foreground-muted)]">
          กำลังโหลด…
        </div>
      }
    >
      <SeriesDetailClient />
    </Suspense>
  );
}
