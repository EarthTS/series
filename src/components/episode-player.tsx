"use client";

import { classifyVideoUrl } from "@/lib/video-url";
import { useEffect, useId, useMemo, useRef } from "react";

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
    CLOUDINARY_CLOUD_NAME
  )}&public_id=${encodeURIComponent(publicId)}`;
}

function toCloudinarySource(input: string): { publicId?: string; sourceUrl?: string } | null {
  const publicId = toCloudinaryPublicId(input);
  if (publicId) return { publicId };
  try {
    const u = new URL(input);
    if (u.hostname.toLowerCase() === "res.cloudinary.com") {
      return { sourceUrl: input };
    }
    return null;
  } catch {
    return null;
  }
}

function ensureCloudinaryPlayerStyles() {
  if (document.querySelector('link[data-cloudinary-player="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/cloudinary-video-player/dist/cld-video-player.min.css";
  link.setAttribute("data-cloudinary-player", "true");
  document.head.appendChild(link);
}

export function EpisodePlayer({ url, title }: { url: string; title: string }) {
  const parsed = classifyVideoUrl(url);
  const playerId = useId().replace(/:/g, "_");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cloudinarySource = useMemo(
    () => (parsed ? toCloudinarySource(parsed.src) : null),
    [parsed]
  );
  const cloudinaryEmbedUrl = useMemo(
    () => (parsed ? toCloudinaryEmbedUrl(parsed.src) : null),
    [parsed]
  );

  useEffect(() => {
    if (!cloudinarySource || !videoRef.current) return;

    let activePlayer: import("cloudinary-video-player").VideoPlayer | null = null;
    let cancelled = false;

    ensureCloudinaryPlayerStyles();

    void import("cloudinary-video-player").then(({ videoPlayer }) => {
      if (cancelled) return;
      const player = videoPlayer(playerId, {
        cloudName: CLOUDINARY_CLOUD_NAME,
        secure: true,
        autoplayMode: "on-scroll",
        showJumpControls: true,
        fluid: true,
        autoplay: true,
        controls: true,
      });
      activePlayer = player;

      if (cloudinarySource.publicId) {
        player.source(cloudinarySource.publicId);
      } else if (cloudinarySource.sourceUrl) {
        player.source(cloudinarySource.sourceUrl);
      }
    });

    return () => {
      cancelled = true;
      activePlayer?.dispose?.();
    };
  }, [cloudinarySource, playerId]);

  if (!parsed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-4 text-center text-sm text-[var(--foreground-muted)]">
        ไม่รองรับรูปแบบลิงก์นี้สำหรับการเล่นในแอป
      </div>
    );
  }

  if (cloudinarySource) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <video
          id={playerId}
          ref={videoRef}
          className="cld-video-player absolute inset-0 h-full w-full"
          controls
          playsInline
          preload="metadata"
          aria-label={title}
        />
      </div>
    );
  }

  if (cloudinaryEmbedUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <iframe
          title={title}
          src={cloudinaryEmbedUrl}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
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
