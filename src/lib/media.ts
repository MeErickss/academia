"use client";

import { useEffect, useState } from "react";
import { db, uid } from "./db";
import type { MediaItem } from "./types";

export const MAX_VIDEO_MB = 60;
export const MAX_GIF_MB = 15;

/** Diminui fotos grandes do iPhone (que podem ter 5+ MB) para caber bem no celular. */
async function compressImage(file: File, maxSide = 1400, quality = 0.82): Promise<{ data: ArrayBuffer; mime: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("sem canvas");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob) throw new Error("falhou");
    return { data: await blob.arrayBuffer(), mime: "image/jpeg" };
  } catch {
    return { data: await file.arrayBuffer(), mime: file.type || "image/jpeg" };
  }
}

export async function saveMediaFile(
  file: File,
  opts: { purpose: MediaItem["purpose"]; exerciseId?: string; date?: string },
): Promise<MediaItem> {
  const isVideo = file.type.startsWith("video/");
  const isGif = file.type === "image/gif";
  const mb = file.size / 1024 / 1024;
  if (isVideo && mb > MAX_VIDEO_MB) {
    throw new Error(`Esse vídeo tem ${Math.round(mb)} MB. Tente um trecho mais curto (até ${MAX_VIDEO_MB} MB) ou cole um link do YouTube/Instagram.`);
  }
  if (isGif && mb > MAX_GIF_MB) throw new Error(`Esse GIF é grande demais (${Math.round(mb)} MB).`);
  if (!isVideo && !file.type.startsWith("image/") && file.type !== "") {
    throw new Error("Escolha uma foto, GIF ou vídeo.");
  }
  const payload =
    isVideo || isGif ? { data: await file.arrayBuffer(), mime: file.type || "video/mp4" } : await compressImage(file);
  const item: MediaItem = {
    id: uid("midia"),
    purpose: opts.purpose,
    exerciseId: opts.exerciseId,
    date: opts.date,
    mime: payload.mime,
    data: payload.data,
    createdAt: Date.now(),
  };
  await db.media.add(item);
  return item;
}

/** URL temporária para mostrar uma mídia salva no banco. */
export function useMediaUrl(mediaId: string | undefined) {
  const [state, setState] = useState<{ id?: string; url: string | null; mime: string | null }>({ url: null, mime: null });
  useEffect(() => {
    if (!mediaId) return;
    let url: string | null = null;
    let cancelled = false;
    db.media.get(mediaId).then((m) => {
      if (cancelled || !m) return;
      url = URL.createObjectURL(new Blob([m.data], { type: m.mime }));
      setState({ id: mediaId, url, mime: m.mime });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [mediaId]);
  return state.id === mediaId ? state : { url: null, mime: null };
}

// ——— Links de vídeo (YouTube etc.) ———

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {
    /* link inválido */
  }
  return null;
}

export function isDirectMedia(url: string) {
  return /\.(gif|jpe?g|png|webp|mp4|webm|mov)(\?|$)/i.test(url);
}

export function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export function linkLabel(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("youtu")) return "YouTube";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    return host;
  } catch {
    return "link";
  }
}
