"use client";

import Link from "next/link";

export function PageHeader({
  title,
  backHref,
}: {
  title: string;
  backHref: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 py-3.5 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--background)]/65">
      <Link
        href={backHref}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--muted-hover)]"
        aria-label="กลับ"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="flex-1 truncate text-base font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h1>
    </header>
  );
}
