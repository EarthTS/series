/** Normalize Dropbox share links for HTML5 <video> (direct stream in browser). */
export function toDropboxDirectUrl(input: string): string {
  const trimmed = input.trim();
  try {
    const u = new URL(trimmed);
    if (!u.hostname.endsWith("dropbox.com")) return trimmed;
    u.searchParams.delete("dl");
    u.searchParams.set("raw", "1");
    return u.toString();
  } catch {
    return trimmed;
  }
}

export type PlayerKind = "bilibili" | "direct";

export function classifyVideoUrl(input: string): { kind: PlayerKind; src: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (host === "www.bilibili.tv" || host === "bilibili.tv") {
      return { kind: "bilibili", src: u.toString() };
    }
    if (host.endsWith("dropbox.com") || host.endsWith("dropboxusercontent.com")) {
      return { kind: "direct", src: toDropboxDirectUrl(trimmed) };
    }
    const path = u.pathname.toLowerCase();
    if (/\.(mp4|webm|ogg|ogv|m3u8)(\?|$)/i.test(path)) {
      return { kind: "direct", src: trimmed };
    }
    if (u.protocol === "https:" || u.protocol === "http:") {
      return { kind: "direct", src: trimmed };
    }
    return null;
  } catch {
    return null;
  }
}
