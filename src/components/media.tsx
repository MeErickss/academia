"use client";

import { ExternalLink, ImagePlus, Link2, Play, Trash2, Video } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { db, uid } from "@/lib/db";
import { isDirectMedia, isVideoUrl, linkLabel, saveMediaFile, useMediaUrl, youtubeId } from "@/lib/media";
import type { Exercise, ExerciseMediaRef } from "@/lib/types";
import { CatFace } from "./art";
import { Button, cx, inputClass, Sheet } from "./ui";

/** Alterna entre a foto da posição inicial e a final, como um GIF. */
export function FramesPlayer({ frames, alt, className }: { frames: string[]; alt: string; className?: string }) {
  if (!frames.length) return null;
  return (
    <div className={cx("relative overflow-hidden bg-white", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frames[1] ?? frames[0]} alt={`${alt} — posição final`} className="absolute inset-0 h-full w-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frames[0]}
        alt={`${alt} — posição inicial`}
        className={cx("absolute inset-0 h-full w-full object-cover", frames.length > 1 && "frame-a")}
      />
    </div>
  );
}

function UploadThumb({ mediaId, className }: { mediaId: string; className?: string }) {
  const { url, mime } = useMediaUrl(mediaId);
  if (!url) return <div className={cx("bg-card-2", className)} />;
  if (mime?.startsWith("video/")) {
    return <video src={url} muted playsInline preload="metadata" className={cx("object-cover", className)} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={cx("object-cover", className)} />;
}

/** Miniatura do exercício: foto dela > foto do app > gatinho. */
export function ExerciseThumb({ exercise, size = 56, className }: { exercise?: Exercise; size?: number; className?: string }) {
  const style = { width: size, height: size };
  const upload = exercise?.media.find((m): m is Extract<ExerciseMediaRef, { kind: "upload" }> => m.kind === "upload");
  const box = cx("relative shrink-0 overflow-hidden rounded-2xl border border-line bg-white", className);
  if (upload) {
    return (
      <div className={box} style={style}>
        <UploadThumb mediaId={upload.mediaId} className="h-full w-full" />
      </div>
    );
  }
  if (exercise?.frames.length) {
    return (
      <div className={box} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={exercise.frames[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={cx(box, "flex items-center justify-center bg-sun-pale")} style={style}>
      <CatFace size={size * 0.6} />
    </div>
  );
}

function UploadView({ mediaId }: { mediaId: string }) {
  const { url, mime } = useMediaUrl(mediaId);
  if (!url) return <div className="aspect-[4/3] w-full bg-card-2" />;
  if (mime?.startsWith("video/")) {
    return <video src={url} controls playsInline loop muted autoPlay className="aspect-[4/3] w-full bg-black object-contain" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="aspect-[4/3] w-full bg-white object-contain" />;
}

function LinkView({ url }: { url: string }) {
  const yt = youtubeId(url);
  if (yt) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${yt}?playsinline=1&rel=0`}
        title="Vídeo do YouTube"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="aspect-video w-full bg-black"
      />
    );
  }
  if (isDirectMedia(url)) {
    if (isVideoUrl(url)) return <video src={url} controls playsInline loop muted autoPlay className="aspect-[4/3] w-full bg-black object-contain" />;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="aspect-[4/3] w-full bg-white object-contain" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-sun-pale text-center font-bold text-ink"
    >
      <Play size={36} className="text-sun-deep" />
      Abrir vídeo no {linkLabel(url)}
      <span className="flex items-center gap-1 text-xs font-normal text-ink-2">
        abre fora do app <ExternalLink size={12} />
      </span>
    </a>
  );
}

type Slide = { key: string; label: string; render: () => ReactNode };

/** Galeria grande: fotos do app + o que ela adicionou (fotos, GIFs, vídeos, links). */
export function MediaGallery({ exercise, onAdd }: { exercise: Exercise; onAdd?: () => void }) {
  const slides: Slide[] = [];
  for (const m of exercise.media) {
    if (m.kind === "upload") slides.push({ key: m.id, label: m.mime.startsWith("video/") ? "Meu vídeo" : "Minha foto", render: () => <UploadView mediaId={m.mediaId} /> });
    else slides.push({ key: m.id, label: linkLabel(m.url), render: () => <LinkView url={m.url} /> });
  }
  if (exercise.frames.length) {
    slides.push({
      key: "frames",
      label: "Como fazer",
      render: () => <FramesPlayer frames={exercise.frames} alt={exercise.name} className="aspect-[4/3] w-full" />,
    });
  }
  const [index, setIndex] = useState(0);
  const current = slides[Math.min(index, slides.length - 1)];

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card">
      {current ? (
        <div key={current.key}>{current.render()}</div>
      ) : (
        <button type="button" onClick={onAdd} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-sun-pale">
          <CatFace size={64} />
          <span className="font-bold">Adicione uma foto ou vídeo</span>
          <span className="text-sm text-ink-2">pra lembrar exatamente qual é esse exercício</span>
        </button>
      )}
      {(slides.length > 1 || onAdd) && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto p-2">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setIndex(i)}
              className={cx(
                "h-8 shrink-0 rounded-full px-3 text-xs font-bold",
                i === Math.min(index, slides.length - 1) ? "bg-sun text-on-sun" : "bg-card-2 text-ink-2",
              )}
            >
              {s.label}
            </button>
          ))}
          {onAdd && (
            <button type="button" onClick={onAdd} className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-dashed border-sun-deep px-3 text-xs font-bold text-sun-deep">
              <ImagePlus size={14} /> Adicionar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

async function removeExerciseMedia(exercise: Exercise, ref: ExerciseMediaRef) {
  await db.exercises.update(exercise.id, { media: exercise.media.filter((m) => m.id !== ref.id), updatedAt: Date.now() });
  if (ref.kind === "upload") await db.media.delete(ref.mediaId);
}

/** Painel para adicionar/remover fotos, GIFs, vídeos e links de um exercício. */
export function MediaManagerSheet({ exercise, open, onClose }: { exercise: Exercise; open: boolean; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const refs: ExerciseMediaRef[] = [];
      for (const f of Array.from(files)) {
        const item = await saveMediaFile(f, { purpose: "exercise", exerciseId: exercise.id });
        refs.push({ id: uid("m"), kind: "upload", mediaId: item.id, mime: item.mime });
      }
      await db.exercises.update(exercise.id, { media: [...refs, ...exercise.media], updatedAt: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para salvar esse arquivo.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function addLink() {
    let url = link.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      new URL(url);
    } catch {
      setError("Esse link não parece válido.");
      return;
    }
    await db.exercises.update(exercise.id, { media: [{ id: uid("m"), kind: "url", url }, ...exercise.media], updatedAt: Date.now() });
    setLink("");
    setError(null);
  }

  const remove = (ref: ExerciseMediaRef) => removeExerciseMedia(exercise, ref);

  return (
    <Sheet open={open} onClose={onClose} title="Fotos e vídeos">
      <p className="mb-4 text-sm text-ink-2">
        Dica: peça pro professor fazer o exercício e grave um videozinho, ou tire foto da máquina. Assim você nunca mais
        esquece qual é qual.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <Button variant="sun" size="lg" className="w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
        <ImagePlus size={20} /> {busy ? "Salvando…" : "Escolher foto, GIF ou vídeo"}
      </Button>

      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
          <Link2 size={16} /> Ou cole um link (YouTube, Instagram, TikTok…)
        </p>
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder="https://youtube.com/…"
            value={link}
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <Button variant="soft" className="h-12 shrink-0" onClick={addLink} disabled={!link.trim()}>
            Salvar
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 rounded-2xl bg-danger/10 p-3 text-sm font-bold text-danger">{error}</p>}

      {exercise.media.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-3">Já adicionados</p>
          <ul className="space-y-2">
            {exercise.media.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-2">
                {m.kind === "upload" ? (
                  <div className="h-12 w-12 overflow-hidden rounded-xl">
                    <UploadThumb mediaId={m.mediaId} className="h-full w-full" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sun-pale text-sun-deep">
                    {youtubeId(m.url) ? <Video size={22} /> : <Link2 size={20} />}
                  </div>
                )}
                <span className="min-w-0 flex-1 truncate text-sm">
                  {m.kind === "upload" ? (m.mime.startsWith("video/") ? "Vídeo" : m.mime === "image/gif" ? "GIF" : "Foto") : m.url}
                </span>
                <button
                  type="button"
                  aria-label="Remover"
                  onClick={() => remove(m)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-danger active:bg-danger/10"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
