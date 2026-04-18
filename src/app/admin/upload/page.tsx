"use client";

import { Button, Input, Label, Textarea } from "@/components/ui";
import { createSeries, createSeriesAndGetId } from "@/lib/api/series-api";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UploadMode = "manual" | "auto" | "bulk";

type BulkBlock = {
  title: string;
  coverUrl: string;
  videoUrls: string[];
};

function parseBulkTextarea(text: string): BulkBlock[] | { error: string } {
  const rawBlocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (rawBlocks.length === 0) {
    return { error: "ไม่พบข้อมูล แยกแต่ละเรื่องด้วยบรรทัดว่าง" };
  }
  const blocks: BulkBlock[] = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const lines = rawBlocks[i]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 3) {
      return {
        error: `บล็อกที่ ${i + 1} ไม่ครบ: ต้องมี ชื่อเรื่อง, URL รูปปก, และอย่างน้อย 1 URL วิดีโอ (บรรทัดละ 1 ลิงก์)`,
      };
    }
    const title = lines[0];
    const coverUrl = lines[1];
    const videoUrls = lines.slice(2);
    blocks.push({ title, coverUrl, videoUrls });
  }
  return blocks;
}
type EpRow = {
  url: string;
  sourceUrl: string;
  status: "idle" | "queued" | "processing" | "done" | "error";
  message?: string;
  jobId?: string;
};

const DEFAULT_REFERER = "https://www.bilibili.tv/";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function toEpisodeTitle(index: number): string {
  return `ep. ${index + 1}`;
}

export default function AdminUploadPage() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState("");
  const [eps, setEps] = useState<EpRow[]>([{ url: "", sourceUrl: "", status: "idle" }]);
  const [bulkText, setBulkText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function addRow() {
    setEps((e) => [...e, { url: "", sourceUrl: "", status: "idle" }]);
  }

  function updateRow(i: number, patch: Partial<EpRow>) {
    setEps((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setEps((rows) => rows.filter((_, j) => j !== i));
  }

  async function queueBilibiliJob(sourceUrl: string, movieId: string): Promise<string | null> {
    const res = await fetch("/api/v1/tools/bilibili/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: sourceUrl.trim(),
        referer: DEFAULT_REFERER,
        userAgent: DEFAULT_USER_AGENT,
        playlist: false,
        maxItems: 1,
        movieId,
      }),
    });

    const raw = await res.text();
    let payload: { message?: string } | null = null;
    try {
      payload = raw ? (JSON.parse(raw) as { message?: string }) : null;
    } catch {
      payload = null;
    }
    if (res.status === 202) return null;
    return payload?.message || `HTTP ${res.status}`;
  }

  async function submit() {
    if (mode !== "bulk") {
      if (!title.trim() || !coverUrl.trim()) {
        alert("กรุณากรอกข้อมูลพื้นฐานให้ครบ");
        return;
      }
    }

    if (mode === "manual") {
      const filtered = eps.filter((e) => e.url.trim());
      const episodes = filtered.map((e, idx) => ({
        title: toEpisodeTitle(idx),
        url: e.url.trim(),
      }));
      if (episodes.length === 0 || episodes.length !== eps.length) {
        alert("กรุณาใส่ URL ปลายทางให้ครบทุกตอน");
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
        episodes,
      }).catch(() => false);
      setSubmitting(false);
      if (!ok) {
        alert("บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ API");
        return;
      }
      router.push("/admin/series");
      return;
    }

    if (mode === "bulk") {
      const parsed = parseBulkTextarea(bulkText);
      if ("error" in parsed) {
        alert(parsed.error);
        return;
      }
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      setSubmitting(true);
      for (let b = 0; b < parsed.length; b++) {
        const block = parsed[b];
        const created = await createSeriesAndGetId({
          title: block.title,
          description: description.trim(),
          coverUrl: block.coverUrl,
          tags: tagList,
          episodes: block.videoUrls.map((url, idx) => ({
            title: toEpisodeTitle(idx),
            url: url.trim(),
          })),
        }).catch(() => ({ ok: false, id: "", errorMessage: "เชื่อมต่อ API ไม่สำเร็จ" }));
        if (!created.ok || !created.id) {
          setSubmitting(false);
          alert(
            `${created.errorMessage || "สร้างซีรี่ไม่สำเร็จ"} (เรื่อง: ${block.title})`
          );
          return;
        }
        for (const sourceUrl of block.videoUrls) {
          const queueError = await queueBilibiliJob(sourceUrl, created.id);
          if (queueError) {
            setSubmitting(false);
            alert(`คิวงานดาวน์โหลดไม่สำเร็จ (${block.title}): ${queueError}`);
            router.push("/admin/series");
            return;
          }
        }
      }
      setSubmitting(false);
      alert(
        `สร้าง ${parsed.length} ซีรี่แล้ว และคิวอัปโหลดแยกตาม URL แล้ว แบ็กเอนด์จะอัปเดต Cloudinary ให้เมื่อแต่ละ job เสร็จ`
      );
      router.push("/admin/series");
      return;
    }

    const sources = eps.map((e) => e.sourceUrl.trim()).filter(Boolean);
    if (sources.length === 0 || sources.length !== eps.length) {
      alert("กรุณาใส่ download url ให้ครบทุกบรรทัด");
      return;
    }

    setSubmitting(true);
    const draft = {
      title: title.trim(),
      description: description.trim(),
      coverUrl: coverUrl.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const queuedRows: EpRow[] = sources.map((sourceUrl) => ({
      sourceUrl,
      url: sourceUrl,
      status: "queued",
      message: "queued",
    }));
    const created = await createSeriesAndGetId({
      ...draft,
      episodes: queuedRows.map((row, idx) => ({
        title: toEpisodeTitle(idx),
        url: row.url,
      })),
    }).catch(() => ({ ok: false, id: "", errorMessage: "เชื่อมต่อ API ไม่สำเร็จ" }));
    setSubmitting(false);
    if (!created.ok || !created.id) {
      alert(created.errorMessage || "สร้างซีรี่ไม่สำเร็จ");
      return;
    }

    for (const sourceUrl of sources) {
      const queueError = await queueBilibiliJob(sourceUrl, created.id);
      if (queueError) {
        alert(`คิวงานดาวน์โหลดไม่สำเร็จ: ${queueError}`);
        router.push("/admin/series");
        return;
      }
    }

    alert("สร้างซีรี่แล้ว แบ็กเอนด์จะอัปเดต URL จาก Cloudinary ให้เมื่อแต่ละ job เสร็จ");
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
          onClick={() => setMode("auto")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "auto"
              ? "bg-gradient-to-r from-[#5a9fe8] to-[#6eb5ff] text-[#061018]"
              : "text-[var(--foreground-muted)]"
          }`}
        >
          Auto Upload (Bilibili)
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "bulk"
              ? "bg-gradient-to-r from-[#5a9fe8] to-[#6eb5ff] text-[#061018]"
              : "text-[var(--foreground-muted)]"
          }`}
        >
          Bulk (textarea)
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        {mode !== "bulk" && (
          <div>
            <Label htmlFor="t">ชื่อซีรี่</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        )}
        <div>
          <Label htmlFor="d">คำอธิบาย</Label>
          <Input id="d" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {mode !== "bulk" && (
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
        )}
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

      {mode === "bulk" ? (
        <div className="space-y-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <h2 className="text-sm font-bold text-[var(--foreground)]">รายการหลายเรื่อง (วางข้อความ)</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            แยกแต่ละเรื่องด้วยบรรทัดว่าง ภายในแต่ละบล็อก: บรรทัดที่ 1 = ชื่อเรื่อง, บรรทัดที่ 2 = URL รูปปก,
            บรรทัดถัดไป = URL วิดีโอต้นทาง (Bilibili) หนึ่งบรรทัดต่อหนึ่งตอน — ระบบจะสร้างซีรี่แล้วคิว job แยกทุก URL
            ทันที (ใช้คำอธิบาย/แท็กด้านบนร่วมกันทุกเรื่อง)
          </p>
          <div>
            <Label htmlFor="bulk">ข้อความ</Label>
            <Textarea
              id="bulk"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`เรื่องแรก\nhttps://cover...\nhttps://video-ep1...\nhttps://video-ep2...\n\nเรื่องสอง\nhttps://cover...\nhttps://video-ep1...`}
              className="font-mono text-xs"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              {mode === "manual" ? "ตอน (Video URL ปลายทาง)" : "download url (รายการต้นทาง)"}
            </h2>
            <Button type="button" variant="secondary" className="min-h-9 text-xs" onClick={addRow}>
              + เพิ่มรายการ
            </Button>
          </div>
          {mode === "auto" && (
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
              <p className="text-xs text-[var(--foreground-muted)]">
                ระบบจะใช้ Referer และ User-Agent มาตรฐานของ Bilibili ให้อัตโนมัติ สร้างซีรี่ก่อนทันที
                แล้วแบ็กเอนด์จะแทนที่แต่ละ download url ในรายการตอนด้วย URL จาก Cloudinary เมื่อ job นั้นอัปโหลดครบ
              </p>
            </div>
          )}
          <ul className="space-y-3">
            {eps.map((row, i) => (
              <li
                key={i}
                className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  {mode === "manual" ? (
                    <div className="min-w-0 flex-1">
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
                    <div className="min-w-0 flex-1">
                      <Label htmlFor={`src-${i}`}>download url</Label>
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
                {mode === "auto" && row.message && (
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
      )}

      <Button type="button" className="w-full sm:w-auto" onClick={submit} disabled={submitting}>
        {submitting ? "กำลังบันทึก..." : mode === "bulk" ? "สร้างและคิวทั้งหมด" : "บันทึกซีรี่"}
      </Button>
    </div>
  );
}
