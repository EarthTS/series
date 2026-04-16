"use client";

import { Button, Input, Label } from "@/components/ui";
import { createSeries } from "@/lib/api/series-api";
import { useRouter } from "next/navigation";
import { useState } from "react";

type EpRow = { title: string; url: string };

export default function AdminUploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState("");
  const [eps, setEps] = useState<EpRow[]>([{ title: "", url: "" }]);
  const [submitting, setSubmitting] = useState(false);

  function addRow() {
    setEps((e) => [...e, { title: "", url: "" }]);
  }

  function updateRow(i: number, patch: Partial<EpRow>) {
    setEps((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setEps((rows) => rows.filter((_, j) => j !== i));
  }

  async function submit() {
    const filtered = eps.filter((e) => e.url.trim());
    const episodes = filtered.map((e, idx) => ({
      title: e.title.trim() || `ตอนที่ ${idx + 1}`,
      url: e.url.trim(),
    }));
    if (!title.trim() || !coverUrl.trim() || episodes.length === 0) {
      alert("กรุณากรอกชื่อซีรี่ URL ปก และอย่างน้อยหนึ่งตอนที่มีลิงก์วิดีโอ");
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
          วาง URL รูปปก และลิงก์วิดีโอแต่ละตอน (Dropbox / bilibili.tv / ไฟล์ตรง)
        </p>
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
          <h2 className="text-sm font-bold text-[var(--foreground)]">ตอน (URL)</h2>
          <Button type="button" variant="secondary" className="min-h-9 text-xs" onClick={addRow}>
            + เพิ่มตอน
          </Button>
        </div>
        <ul className="space-y-3">
          {eps.map((row, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 flex-1">
                <Label htmlFor={`et-${i}`}>ชื่อตอน</Label>
                <Input
                  id={`et-${i}`}
                  value={row.title}
                  onChange={(e) => updateRow(i, { title: e.target.value })}
                  placeholder={`ตอนที่ ${i + 1}`}
                />
              </div>
              <div className="min-w-0 flex-[2]">
                <Label htmlFor={`eu-${i}`}>ลิงก์วิดีโอ</Label>
                <Input
                  id={`eu-${i}`}
                  type="url"
                  value={row.url}
                  onChange={(e) => updateRow(i, { url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
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
