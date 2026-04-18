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
  const [playlist, setPlaylist] = useState(false);
  const [maxItems, setMaxItems] = useState(10);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("พร้อมใช้งาน");
  const [result, setResult] = useState<{
    items: Array<{
      cloudinaryUrl: string;
      downloadedFile: string;
      publicId: string;
    }>;
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
    setProgress(1);
    setStatusText("เริ่มต้นการประมวลผล...");

    const res = await fetch("/api/v1/tools/bilibili/upload-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: bilibiliUrl.trim(),
        referer: referer.trim(),
        userAgent: userAgent.trim(),
        cookie: cookie.trim(),
        cookiesFromBrowser: cookiesFromBrowser.trim(),
        playlist,
        maxItems,
      }),
    });
    if (!res.ok || !res.body) {
      setDownloading(false);
      setError("ไม่สามารถเริ่ม stream progress ได้");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const rawEvent of events) {
        const lines = rawEvent.split("\n");
        const eventLine = lines.find((line) => line.startsWith("event: "));
        const dataLine = lines.find((line) => line.startsWith("data: "));
        if (!eventLine || !dataLine) continue;
        const eventType = eventLine.replace("event: ", "").trim();
        const payload = JSON.parse(dataLine.replace("data: ", "").trim()) as {
          progress?: number;
          message?: string;
          items?: Array<{
            cloudinaryUrl: string;
            downloadedFile: string;
            publicId: string;
          }>;
        };

        if (eventType === "progress") {
          setProgress(payload.progress ?? 0);
          setStatusText(payload.message || "กำลังประมวลผล...");
        } else if (eventType === "error") {
          setError(payload.message || "เกิดข้อผิดพลาด");
          setStatusText("เกิดข้อผิดพลาด");
          setDownloading(false);
          return;
        } else if (eventType === "complete") {
          setProgress(100);
          setStatusText("เสร็จสิ้น");
          setResult({ items: payload.items || [] });
          completed = true;
        }
      }
    }

    setDownloading(false);
    if (!completed) {
      setError("การประมวลผลไม่สมบูรณ์");
      setStatusText("ไม่สำเร็จ");
    }
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
          <div className="flex items-center gap-2">
            <input
              id="bili-playlist"
              type="checkbox"
              checked={playlist}
              onChange={(e) => setPlaylist(e.target.checked)}
            />
            <Label htmlFor="bili-playlist" className="mb-0">
              ดาวน์โหลดแบบ playlist
            </Label>
          </div>
          {playlist && (
            <div>
              <Label htmlFor="bili-max-items">จำนวนตอนสูงสุด</Label>
              <Input
                id="bili-max-items"
                type="number"
                min={1}
                max={200}
                value={String(maxItems)}
                onChange={(e) => setMaxItems(Math.max(1, Number(e.target.value || "1")))}
              />
            </div>
          )}
          <Button type="button" onClick={handleBilibiliDownload} disabled={downloading}>
            {downloading ? "กำลังประมวลผล..." : "ดาวน์โหลดและอัปโหลดไป Cloudinary"}
          </Button>
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full bg-gradient-to-r from-[#5a9fe8] to-[#8ecfff] transition-all"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">
              {statusText} ({Math.round(progress)}%)
            </p>
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {result && result.items.length > 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
              <p className="font-semibold text-emerald-200">สำเร็จ</p>
              <p className="mt-1 text-emerald-100 break-all">จำนวนไฟล์: {result.items.length}</p>
              {result.items.slice(0, 5).map((item, idx) => (
                <div key={`${item.publicId}-${idx}`} className="mt-2 rounded-lg border border-emerald-300/20 p-2">
                  <p className="text-emerald-100 break-all">Downloaded: {item.downloadedFile}</p>
                  <p className="text-emerald-100 break-all">Cloudinary URL: {item.cloudinaryUrl}</p>
                  <p className="text-emerald-100 break-all">Public ID: {item.publicId}</p>
                </div>
              ))}
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
