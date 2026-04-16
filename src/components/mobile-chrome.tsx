"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const NAV = [
  { href: "/home", label: "หน้าแรก", icon: HomeIcon },
  { href: "/search", label: "ค้นหา", icon: SearchIcon },
  { href: "/settings", label: "ฉัน", icon: UserIcon },
] as const;

export function MobileChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showBottom = NAV.some((n) => n.href === pathname);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)] text-[var(--foreground)]">
      <div
        className={cn(
          "flex flex-1 flex-col",
          showBottom && "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
        )}
      >
        {children}
      </div>
      {showBottom && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <nav
            className="pointer-events-auto flex w-full max-w-md items-stretch justify-around gap-1 rounded-[1.35rem] border border-[var(--border-strong)] bg-[var(--nav-surface)] px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            aria-label="เมนูหลัก"
          >
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-w-[4.25rem] flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold transition-colors",
                    active
                      ? "bg-[var(--accent)]/15 text-[var(--accent-bright)]"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                      active ? "bg-[var(--accent)]/20" : "bg-transparent"
                    )}
                  >
                    <Icon active={active} />
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}

function HomeIcon({ active }: { active?: boolean }) {
  const stroke = active ? "var(--accent-bright)" : "currentColor";
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.75"
      className="opacity-95"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function SearchIcon({ active }: { active?: boolean }) {
  const stroke = active ? "var(--accent-bright)" : "currentColor";
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

function UserIcon({ active }: { active?: boolean }) {
  const stroke = active ? "var(--accent-bright)" : "currentColor";
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-4 12.5-4 14 0" />
    </svg>
  );
}
