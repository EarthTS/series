"use client";

import { MobileChrome } from "@/components/mobile-chrome";
import { useAppState } from "@/context/app-state";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hydrated } = useAppState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--foreground-muted)]">
        กำลังโหลด…
      </div>
    );
  }

  return <MobileChrome key={pathname}>{children}</MobileChrome>;
}
