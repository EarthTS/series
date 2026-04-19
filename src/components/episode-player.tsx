"use client";

import { CldVideoPlayer } from "next-cloudinary";

import { classifyVideoUrl, toCldVideoPlayerSrc } from "@/lib/video-url";

const playerShellClass =
  "relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/10";

export function EpisodePlayer({ url, title }: { url: string; title: string }) {
  const parsed = classifyVideoUrl(url);

  if (!parsed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-4 text-center text-sm text-[var(--foreground-muted)]">
        ไม่รองรับรูปแบบลิงก์นี้สำหรับการเล่นในแอป
      </div>
    );
  }

  if (parsed.kind === "bilibili") {
    return (
      <div className={playerShellClass}>
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

  if (parsed.kind === "cloudinary") {
    const src = toCldVideoPlayerSrc(parsed.src);
    return (
      <div className={playerShellClass}>
        <CldVideoPlayer
          key={src}
          src={src}
          width={1920}
          height={1080}
          fluid
          controls
          className="h-full w-full [&_.video-js]:!h-full [&_.video-js]:!w-full"
        />
      </div>
    );
  }

  return (
    <div className={playerShellClass}>
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
