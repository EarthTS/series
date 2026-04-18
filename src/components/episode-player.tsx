"use client";

import { classifyVideoUrl } from "@/lib/video-url";
import { useEffect, useId, useMemo } from "react";

const CLOUDINARY_CLOUD_NAME = "dfk8gyhhj";
const CLOUDINARY_PLAYER_SCRIPT =
  "https://unpkg.com/cloudinary-video-player@1.11.1/dist/cld-video-player.min.js";
const CLOUDINARY_PLAYER_STYLE =
  "https://unpkg.com/cloudinary-video-player@1.11.1/dist/cld-video-player.min.css";

type CloudinaryPlayerInstance = {
  destroy?: () => void;
};

type CloudinaryGlobal = {
  player: (
    elementId: string,
    options: { cloudName: string; publicId?: string }
  ) => CloudinaryPlayerInstance;
};

function ensureCloudinaryPlayerAssets(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const head = document.head;
    if (!head) {
      resolve();
      return;
    }

    const existingCss = document.querySelector<HTMLLinkElement>(
      'link[data-cloudinary-player="1"]'
    );
    if (!existingCss) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = CLOUDINARY_PLAYER_STYLE;
      css.dataset.cloudinaryPlayer = "1";
      head.appendChild(css);
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-cloudinary-player="1"]'
    );
    if (existingScript) {
      if ((window as Window & { cloudinary?: CloudinaryGlobal }).cloudinary?.player) {
        resolve();
        return;
      }
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("load player failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = CLOUDINARY_PLAYER_SCRIPT;
    script.async = true;
    script.dataset.cloudinaryPlayer = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("load player failed"));
    head.appendChild(script);
  });
}

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

export function EpisodePlayer({ url, title }: { url: string; title: string }) {
  const parsed = classifyVideoUrl(url);
  const playerId = useId().replace(/:/g, "-");
  const cloudinaryPublicId = useMemo(
    () => (parsed ? toCloudinaryPublicId(parsed.src) : null),
    [parsed]
  );
  const shouldUseCloudinaryJsPlayer = Boolean(
    parsed &&
      cloudinaryPublicId &&
      (parsed.kind === "cloudinary-player" || parsed.kind === "direct")
  );

  useEffect(() => {
    if (!shouldUseCloudinaryJsPlayer || !cloudinaryPublicId) return;
    let disposed = false;
    let instance: CloudinaryPlayerInstance | null = null;

    ensureCloudinaryPlayerAssets()
      .then(() => {
        if (disposed) return;
        const global = (window as Window & { cloudinary?: CloudinaryGlobal }).cloudinary;
        if (!global?.player) return;
        instance = global.player(playerId, {
          cloudName: CLOUDINARY_CLOUD_NAME,
          publicId: cloudinaryPublicId,
        });
      })
      .catch(() => {
        // keep silent and let UI remain stable if SDK fails to load.
      });

    return () => {
      disposed = true;
      instance?.destroy?.();
    };
  }, [cloudinaryPublicId, playerId, shouldUseCloudinaryJsPlayer]);

  if (!parsed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-4 text-center text-sm text-[var(--foreground-muted)]">
        ไม่รองรับรูปแบบลิงก์นี้สำหรับการเล่นในแอป
      </div>
    );
  }

  if (shouldUseCloudinaryJsPlayer) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <video
          id={playerId}
          className="cld-video-player absolute inset-0 h-full w-full"
          controls
          playsInline
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
