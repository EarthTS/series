"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/components/ui";
import { useAppState } from "@/context/app-state";

const LINKS = [
  { href: "/admin", label: "แดชบอร์ด" },
  { href: "/admin/users", label: "ผู้ใช้" },
  { href: "/admin/series", label: "ซีรี่ทั้งหมด" },
  { href: "/admin/upload", label: "อัปโหลด" },
  { href: "/admin/settings", label: "ตั้งค่าระบบ" },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { adminLogout } = useAppState();
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-dvh">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card-solid)] py-6 md:flex">
          <div className="px-4 pb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent-bright)]">
              Winter Admin
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">จัดการคอนเทนต์</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-2">
            {LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-[var(--accent)]/18 text-[var(--accent-bright)]"
                      : "text-[var(--foreground-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-1 border-t border-[var(--border)] px-4 pt-4">
            <Link
              href="/home"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-[var(--accent-bright)] hover:bg-[var(--muted)]"
            >
              ไปหน้าผู้ใช้
            </Link>
            <button
              type="button"
              onClick={() => {
                adminLogout();
                router.replace("/login");
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/10"
            >
              ออกจากแอดมิน
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card-solid)]/90 px-4 py-3 backdrop-blur-md md:hidden">
            <p className="text-sm font-bold">แอดมิน</p>
            <Link href="/home" className="text-xs font-semibold text-[var(--accent-bright)]">
              ผู้ใช้
            </Link>
          </header>
          <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--card-solid)] px-2 py-2 md:hidden">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
                  pathname === href
                    ? "bg-gradient-to-r from-[#5a9fe8] to-[#6eb5ff] text-[#061018]"
                    : "bg-[var(--muted)] text-[var(--foreground-muted)]"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
