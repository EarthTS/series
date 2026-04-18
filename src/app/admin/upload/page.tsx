"use client";

import { Button, Input, Label } from "@/components/ui";
import { createSeries, createSeriesAndGetId } from "@/lib/api/series-api";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UploadMode = "manual" | "auto";
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
    if (!title.trim() || !coverUrl.trim()) {
      alert("กรุณากรอกข้อมูลพื้นฐานให้ครบ");
      return;
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

      <Button type="button" className="w-full sm:w-auto" onClick={submit} disabled={submitting}>
        {submitting ? "กำลังบันทึก..." : "บันทึกซีรี่"}
      </Button>
    </div>
  );
}
