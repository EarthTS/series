"use client";

import { classifyVideoUrl } from "@/lib/video-url";
import { useMemo } from "react";

const CLOUDINARY_CLOUD_NAME = "dfk8gyhhj";

function toCloudinaryPublicId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (host === "player.cloudinary.com") {
      const fromQuery = u.searchParams.get("public_id");
      if (fromQuery) return fromQuery;
    }
    if (host === "res.cloudinary.com") {
      const marker = "/video/upload/";
      const at = u.pathname.indexOf(marker);
      if (at >= 0) {
        let rest = u.pathname.slice(at + marker.length);
        rest = rest.replace(/^v\d+\//, "");
        rest = rest.replace(/\.[^.\/]+$/, "");
        return rest || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function toCloudinaryEmbedUrl(input: string): string | null {
  const publicId = toCloudinaryPublicId(input);
  if (!publicId) return null;
  return `https://player.cloudinary.com/embed/?cloud_name=${encodeURIComponent(
    CLOUDINARY_CLOUD_NAME,
  )}&public_id=${encodeURIComponent(publicId)}`;
}

export function EpisodePlayer({ url, title }: { url: string; title: string }) {
  const parsed = classifyVideoUrl(url);
  const cloudinaryEmbedUrl = useMemo(
    () => (parsed ? toCloudinaryEmbedUrl(parsed.src) : null),
    [parsed],
  );

  if (!parsed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-4 text-center text-sm text-[var(--foreground-muted)]">
        ไม่รองรับรูปแบบลิงก์นี้สำหรับการเล่นในแอป
      </div>
    );
  }

  if (cloudinaryEmbedUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <iframe
          title={title}
          src={cloudinaryEmbedUrl}
          width="640"
          height="360"
          style={{ width: "100%", height: "auto", aspectRatio: "640 / 360" }}
          className="absolute inset-0 border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          frameBorder={0}
        />
      </div>
    );
  }

  if (parsed.kind === "bilibili" || parsed.kind === "cloudinary-player") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <iframe
          title={title}
          src={parsed.src}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
      <video
        key={parsed.src}
        className="absolute inset-0 h-full w-full"
        controls
        playsInline
        preload="metadata"
        src={parsed.src}
      >
        เบราว์เซอร์ไม่รองรับการเล่นวิดีโอ
      </video>
    </div>
  );
}
