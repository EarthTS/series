"use client";

import { Button, Input, Label } from "@/components/ui";
import { createSeries } from "@/lib/api/series-api";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UploadMode = "manual" | "bilibili";
type EpRow = {
  title: string;
  url: string;
  sourceUrl: string;
  status: "idle" | "processing" | "done" | "error";
  message?: string;
};
type UploadStreamResult = {
  items?: Array<{
    cloudinaryUrl: string;
    downloadedFile: string;
    publicId: string;
  }>;
  message?: string;
};

export default function AdminUploadPage() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState("");
  const [referer, setReferer] = useState("https://www.bilibili.tv/");
  const [userAgent, setUserAgent] = useState(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  const [cookie, setCookie] = useState("");
  const [cookiesFromBrowser, setCookiesFromBrowser] = useState("");
  const [eps, setEps] = useState<EpRow[]>([
    { title: "", url: "", sourceUrl: "", status: "idle" },
  ]);
  const [processingAll, setProcessingAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function addRow() {
    setEps((e) => [...e, { title: "", url: "", sourceUrl: "", status: "idle" }]);
  }

  function updateRow(i: number, patch: Partial<EpRow>) {
    setEps((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setEps((rows) => rows.filter((_, j) => j !== i));
  }

  async function downloadAndUploadToCloudinary(sourceUrl: string): Promise<string> {
    const res = await fetch("/api/v1/tools/bilibili/upload-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: sourceUrl.trim(),
        referer: referer.trim(),
        userAgent: userAgent.trim(),
        cookie: cookie.trim(),
        cookiesFromBrowser: cookiesFromBrowser.trim(),
        playlist: false,
        maxItems: 1,
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error("ไม่สามารถเริ่ม Bilibili downloader ได้");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalPayload: UploadStreamResult | null = null;
    let streamError = "";

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
        const payload = JSON.parse(dataLine.replace("data: ", "").trim()) as UploadStreamResult;
        if (eventType === "error") {
          streamError = payload.message || "ดาวน์โหลดหรืออัปโหลดไม่สำเร็จ";
        }
        if (eventType === "complete") {
          finalPayload = payload;
        }
      }
    }

    if (streamError) {
      throw new Error(streamError);
    }
    const cloudinaryUrl = finalPayload?.items?.[0]?.cloudinaryUrl;
    if (!cloudinaryUrl) {
      throw new Error("ไม่พบ Cloudinary URL จากผลลัพธ์");
    }
    return cloudinaryUrl;
  }

  async function processEpisodeByIndex(index: number) {
    const sourceUrl = eps[index]?.sourceUrl?.trim();
    if (!sourceUrl) {
      setEps((rows) =>
        rows.map((row, i) =>
          i === index ? { ...row, status: "error", message: "กรุณาใส่ลิงก์ต้นทางก่อน" } : row
        )
      );
      return;
    }

    setEps((rows) =>
      rows.map((row, i) =>
        i === index ? { ...row, status: "processing", message: "กำลังดาวน์โหลดและอัปโหลด..." } : row
      )
    );

    try {
      const cloudinaryUrl = await downloadAndUploadToCloudinary(sourceUrl);
      setEps((rows) =>
        rows.map((row, i) =>
          i === index
            ? { ...row, url: cloudinaryUrl, status: "done", message: "พร้อมบันทึกแล้ว" }
            : row
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
      setEps((rows) =>
        rows.map((row, i) => (i === index ? { ...row, status: "error", message } : row))
      );
    }
  }

  async function processAllEpisodes() {
    const indexes = eps
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.sourceUrl.trim() && !row.url.trim())
      .map(({ index }) => index);
    if (indexes.length === 0) {
      alert("ยังไม่มีลิงก์ที่ต้องแปลง หรือแปลงครบแล้ว");
      return;
    }
    setProcessingAll(true);
    for (const index of indexes) {
      await processEpisodeByIndex(index);
    }
    setProcessingAll(false);
  }

  async function submit() {
    const filtered = eps.filter((e) => e.url.trim());
    const episodes = filtered.map((e, idx) => ({
      title: e.title.trim() || `ตอนที่ ${idx + 1}`,
      url: e.url.trim(),
    }));
    if (!title.trim() || !coverUrl.trim() || episodes.length === 0 || episodes.length !== eps.length) {
      alert("กรุณากรอกข้อมูลให้ครบ และให้ทุกตอนมี URL วิดีโอปลายทางก่อนบันทึก");
      return;
    }
    setSubmitting(true);
    const ok = await createSeries({
      title: title.trim(),
      description: description.trim(),
      coverUrl: coverUrl.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      uploadBy: "admin-web",
      episodes,
    }).catch(() => false);
    setSubmitting(false);
    if (!ok) {
      alert("บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ API");
      return;
    }
    router.push("/admin/series");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">อัปโหลดซีรี่</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          ตั้งค่าข้อมูลซีรี่ แล้วเลือกวิธีใส่วิดีโอแต่ละตอน
        </p>
      </div>

      <div className="flex w-fit rounded-xl border border-[var(--border)] bg-[var(--muted)] p-1">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "manual"
              ? "bg-gradient-to-r from-[#5a9fe8] to-[#6eb5ff] text-[#061018]"
              : "text-[var(--foreground-muted)]"
          }`}
        >
          กรอก URL เอง
        </button>
        <button
          type="button"
          onClick={() => setMode("bilibili")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "bilibili"
              ? "bg-gradient-to-r from-[#5a9fe8] to-[#6eb5ff] text-[#061018]"
              : "text-[var(--foreground-muted)]"
          }`}
        >
          Bilibili Downloader
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div>
          <Label htmlFor="t">ชื่อซีรี่</Label>
          <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="d">คำอธิบาย</Label>
          <Input id="d" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="c">URL รูปปก</Label>
          <Input
            id="c"
            type="url"
            placeholder="https://..."
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="tg">แท็ก (คั่นด้วยจุลภาค)</Label>
          <Input
            id="tg"
            placeholder="รักโรแมนติก, แนวตั้ง"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--foreground)]">ตอน (Video URL ปลายทาง)</h2>
          <Button type="button" variant="secondary" className="min-h-9 text-xs" onClick={addRow}>
            + เพิ่มตอน
          </Button>
        </div>
        {mode === "bilibili" && (
          <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
            <p className="text-xs text-[var(--foreground-muted)]">
              โหมดนี้จะดาวน์โหลดจากลิงก์ต้นทาง แล้วอัปโหลดไป Cloudinary ก่อนนำ URL ปลายทางมาใส่ในแต่ละตอน
            </p>
            <div>
              <Label htmlFor="bili-referer">Referer</Label>
              <Input
                id="bili-referer"
                value={referer}
                onChange={(e) => setReferer(e.target.value)}
                placeholder="https://www.bilibili.tv/"
              />
            </div>
            <div>
              <Label htmlFor="bili-ua">User-Agent</Label>
              <Input
                id="bili-ua"
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                placeholder="Mozilla/5.0 ..."
              />
            </div>
            <div>
              <Label htmlFor="bili-cookie">Cookie (optional)</Label>
              <Input
                id="bili-cookie"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="SESSDATA=...; bili_jct=..."
              />
            </div>
            <div>
              <Label htmlFor="bili-browser-cookie">Cookies from browser (optional)</Label>
              <Input
                id="bili-browser-cookie"
                value={cookiesFromBrowser}
                onChange={(e) => setCookiesFromBrowser(e.target.value)}
                placeholder="chrome / firefox / safari"
              />
            </div>
            <Button type="button" onClick={processAllEpisodes} disabled={processingAll || submitting}>
              {processingAll ? "กำลังแปลงลิงก์ทั้งหมด..." : "แปลงลิงก์ทุกตอนที่ยังไม่พร้อม"}
            </Button>
          </div>
        )}
        <ul className="space-y-3">
          {eps.map((row, i) => (
            <li
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`et-${i}`}>ชื่อตอน</Label>
                  <Input
                    id={`et-${i}`}
                    value={row.title}
                    onChange={(e) => updateRow(i, { title: e.target.value })}
                    placeholder={`ตอนที่ ${i + 1}`}
                  />
                </div>
                {mode === "manual" ? (
                  <div className="min-w-0 flex-[2]">
                    <Label htmlFor={`eu-${i}`}>ลิงก์วิดีโอ</Label>
                    <Input
                      id={`eu-${i}`}
                      type="url"
                      value={row.url}
                      onChange={(e) =>
                        updateRow(i, {
                          url: e.target.value,
                          status: "idle",
                          message: "",
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <div className="min-w-0 flex-[2]">
                    <Label htmlFor={`src-${i}`}>ลิงก์ต้นทาง Bilibili / direct</Label>
                    <Input
                      id={`src-${i}`}
                      type="url"
                      value={row.sourceUrl}
                      onChange={(e) =>
                        updateRow(i, {
                          sourceUrl: e.target.value,
                          status: "idle",
                          message: "",
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                )}
                {eps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-9 shrink-0 text-red-400"
                    onClick={() => removeRow(i)}
                  >
                    ลบ
                  </Button>
                )}
              </div>
              {mode === "bilibili" && (
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="min-w-0">
                    <Label htmlFor={`eu-${i}`}>Cloudinary URL (ปลายทาง)</Label>
                    <Input
                      id={`eu-${i}`}
                      type="url"
                      value={row.url}
                      onChange={(e) => updateRow(i, { url: e.target.value })}
                      placeholder="ระบบจะเติมให้อัตโนมัติหลังแปลงสำเร็จ"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => processEpisodeByIndex(i)}
                    disabled={row.status === "processing" || submitting || processingAll}
                  >
                    {row.status === "processing" ? "กำลังแปลง..." : "แปลงตอนนี้"}
                  </Button>
                </div>
              )}
              {mode === "bilibili" && row.message && (
                <p
                  className={`mt-2 text-xs ${
                    row.status === "error"
                      ? "text-red-300"
                      : row.status === "done"
                        ? "text-emerald-300"
                        : "text-[var(--foreground-muted)]"
                  }`}
                >
                  {row.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Button type="button" className="w-full sm:w-auto" onClick={submit} disabled={submitting}>
        {submitting ? "กำลังบันทึก..." : "บันทึกซีรี่"}
      </Button>
    </div>
  );
}
