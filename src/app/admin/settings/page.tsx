"use client";

import { Button, Input, Label } from "@/components/ui";
import { useState } from "react";

const KEYS = [
  "winter_series_db",
  "winter_user",
  "winter_subscription",
  "winter_continue",
  "winter_admin_session",
] as const;

export default function AdminSettingsPage() {
  const [bilibiliUrl, setBilibiliUrl] = useState("");
  const [referer, setReferer] = useState("https://www.bilibili.tv/");
  const [userAgent, setUserAgent] = useState(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  const [cookie, setCookie] = useState("");
  const [cookiesFromBrowser, setCookiesFromBrowser] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<{
    cloudinaryUrl: string;
    downloadedFile: string;
    publicId: string;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleBilibiliDownload() {
    if (!bilibiliUrl.trim()) {
      setError("กรุณาใส่ลิงก์ Bilibili");
      return;
    }
    setDownloading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/v1/tools/bilibili/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: bilibiliUrl.trim(),
        referer: referer.trim(),
        userAgent: userAgent.trim(),
        cookie: cookie.trim(),
        cookiesFromBrowser: cookiesFromBrowser.trim(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      cloudinaryUrl?: string;
      downloadedFile?: string;
      publicId?: string;
    };
    setDownloading(false);
    if (!res.ok || !data.ok || !data.cloudinaryUrl) {
      setError(data.message || "ไม่สามารถดาวน์โหลด/อัปโหลดได้");
      return;
    }
    setResult({
      cloudinaryUrl: data.cloudinaryUrl,
      downloadedFile: data.downloadedFile || "",
      publicId: data.publicId || "",
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">ตั้งค่าระบบ</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          สไตล์เดียวกับส่วนผู้ใช้ — โทน Winter Night สบายตา เน้นภาษาไทย
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h2 className="text-sm font-bold text-[var(--foreground)]">ภาษาและโทน</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--foreground-muted)]">
          <li>ฟอนต์หลัก: Noto Sans Thai</li>
          <li>พื้นหลังมืด (#060a10) + accent น้ำแข็ง (#6eb5ff)</li>
          <li>การ์ดโปร่งแสง ขอบนุ่ม เน้นอ่านง่ายในที่แสงน้อย</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-5 backdrop-blur-md">
        <h2 className="text-sm font-bold text-[var(--foreground)]">ความปลอดภัย (POC)</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          ยังไม่มีการยืนยันตัวตนจริง แอดมินและผู้ใช้เก็บใน localStorage ของเบราว์เซอร์เท่านั้น
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h2 className="text-sm font-bold text-[var(--foreground)]">Bilibili Downloader (POC)</h2>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          วางลิงก์ Bilibili แล้วระบบจะดึงวิดีโอและอัปโหลดเข้า Cloudinary
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="bili-url">ลิงก์ Bilibili</Label>
            <Input
              id="bili-url"
              placeholder="https://www.bilibili.com/video/..."
              value={bilibiliUrl}
              onChange={(e) => setBilibiliUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bili-referer">Referer (ช่วยลด 412)</Label>
            <Input
              id="bili-referer"
              placeholder="https://www.bilibili.tv/"
              value={referer}
              onChange={(e) => setReferer(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bili-ua">User-Agent (ช่วยลด 412)</Label>
            <Input
              id="bili-ua"
              placeholder="Mozilla/5.0 ..."
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bili-cookie">Cookie (optional)</Label>
            <Input
              id="bili-cookie"
              placeholder="SESSDATA=...; bili_jct=..."
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bili-browser-cookie">Cookies from browser (optional)</Label>
            <Input
              id="bili-browser-cookie"
              placeholder="chrome / firefox / safari"
              value={cookiesFromBrowser}
              onChange={(e) => setCookiesFromBrowser(e.target.value)}
            />
          </div>
          <Button type="button" onClick={handleBilibiliDownload} disabled={downloading}>
            {downloading ? "กำลังประมวลผล..." : "ดาวน์โหลดและอัปโหลดไป Cloudinary"}
          </Button>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {result && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
              <p className="font-semibold text-emerald-200">สำเร็จ</p>
              <p className="mt-1 text-emerald-100 break-all">
                Cloudinary URL: {result.cloudinaryUrl}
              </p>
              <p className="mt-1 text-emerald-100 break-all">Public ID: {result.publicId}</p>
              <p className="mt-1 text-emerald-100 break-all">Downloaded file: {result.downloadedFile}</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-400/30 bg-[var(--warning-muted)] p-5">
        <h2 className="text-sm font-bold text-amber-100">รีเซ็ตข้อมูลทดลอง</h2>
        <p className="mt-2 text-sm text-amber-100/85">
          ล้างซีรี่ที่อัปโหลด สมาชิก ผู้ใช้ และเซสชันแอดมิน แล้วรีโหลดไปหน้าเข้าสู่ระบบผู้ใช้
        </p>
        <Button
          type="button"
          variant="danger"
          className="mt-4"
          onClick={() => {
            KEYS.forEach((k) => localStorage.removeItem(k));
            window.location.href = "/login";
          }}
        >
          รีเซ็ตทั้งหมด
        </Button>
      </section>
    </div>
  );
}
