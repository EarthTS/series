"use client";

import { AdminShell } from "@/components/admin-shell";
import { useAppState } from "@/context/app-state";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { adminSession, hydrated } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!adminSession) router.replace("/login");
  }, [hydrated, adminSession, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--foreground-muted)]">
        กำลังโหลด…
      </div>
    );
  }

  if (!adminSession) {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}
