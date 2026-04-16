"use client";

import { PageHeader } from "@/components/page-header";
import { ThaiQrMock } from "@/components/thai-qr-mock";
import { Button } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PayPage() {
  const { activateSubscriptionDays } = useAppState();
  const router = useRouter();
  const [ref] = useState(
    () => `WS-${Date.now().toString(36).toUpperCase().slice(-10)}`
  );

  return (
    <div className="mx-auto w-full max-w-md">
      <PageHeader title="ชำระเงิน" backHref="/subscribe" />
      <div className="space-y-6 px-4 py-6 text-center">
        <div>
          <p className="text-sm font-medium text-[var(--foreground-muted)]">ยอดที่ต้องชำระ</p>
          <p className="mt-1 bg-gradient-to-r from-white to-[var(--accent-bright)] bg-clip-text text-3xl font-extrabold text-transparent">
            29.00 บาท
          </p>
        </div>

        <div className="mx-auto flex w-fit flex-col items-center gap-3 rounded-3xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="rounded-2xl bg-white p-3 shadow-inner ring-1 ring-black/5">
            <ThaiQrMock size={200} />
          </div>
          <p className="max-w-[220px] text-xs leading-relaxed text-[var(--foreground-muted)]">
            สแกน PromptPay / Thai QR (จำลอง)
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--muted)]/50 px-4 py-3.5 text-left">
          <p className="text-xs font-medium text-[var(--foreground-muted)]">รหัสอ้างอิง</p>
          <p className="mt-1 font-mono text-base font-bold tracking-wide text-[var(--accent-bright)]">
            {ref}
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => {
            activateSubscriptionDays(30);
            router.replace("/home");
          }}
        >
          ยืนยันชำระเงินแล้ว (จำลอง)
        </Button>

        <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
          ในระบบจริงจะต้องเชื่อมพร้อมเพย์หรือเกตเวย์ชำระเงิน
          <br />
          ที่นี่กดยืนยันเพื่อเปิดสิทธิ์รับชม 30 วันในเครื่องนี้
        </p>
      </div>
    </div>
  );
}
