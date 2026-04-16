"use client";

import { useAppState } from "@/context/app-state";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();
  const { user, hydrated } = useAppState();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(user ? "/home" : "/login");
  }, [hydrated, user, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--foreground-muted)]">
      กำลังโหลด…
    </div>
  );
}
