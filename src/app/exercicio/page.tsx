"use client";

import { ArrowLeft, ImagePlus, Pencil, PlayCircle, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Paw } from "@/components/art";
import { ExerciseMuscles } from "@/components/BodyMap";
import { ExerciseFormSheet } from "@/components/ExercisePicker";
import { LineChart } from "@/components/LineChart";
import { MediaGallery, MediaManagerSheet } from "@/components/media";
import { MuscleChips } from "@/components/plans";
import { Button, Card, Chip, ConfirmSheet, cx, EmptyState, IconButton, inputClass, SectionTitle, Spinner } from "@/components/ui";
import { CATEGORY_LABEL, youtubeSearchUrl } from "@/lib/catalog";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { useDoneSessions, usePlans } from "@/lib/hooks";
import { exerciseHistory, fmt, lastSummary } from "@/lib/stats";
import type { Exercise } from "@/lib/types";

function NoteBox({ exercise }: { exercise: Exercise }) {
  const [value, setValue] = useState(exercise.myNote ?? "");
  return (
    <textarea
      rows={2}
      className={cx(inputClass, "h-auto py-3")}
      placeholder="Ex.: banco na posição 4, pegada aberta…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== (exercise.myNote ?? "")) db.exercises.update(exercise.id, { myNote: value || undefined });
      }}
    />
  );
}

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
  const sessions = useDoneSessions();
  const plans = usePlans();
  const [media, setMedia] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const history = sessions ? exerciseHistory(exercise.id, sessions) : [];
  const usedIn = (plans ?? []).filter((p) => p.items.some((i) => i.exerciseId === exercise.id));
  const unit = exercise.measure === "reps" ? "reps" : exercise.measure === "seconds" ? "seg" : "min";
  const chartPoints = history.map((h) => ({ x: h.date, y: exercise.weighted && h.maxWeight !== null ? h.maxWeight : h.bestValue }));
  const chartUnit = exercise.weighted && history.some((h) => h.maxWeight !== null) ? "kg" : unit;

  async function remove() {
    await db.exercises.delete(exercise.id);
    const mediaIds = exercise.media.flatMap((m) => (m.kind === "upload" ? [m.mediaId] : []));
    if (mediaIds.length) await db.media.bulkDelete(mediaIds);
    router.replace("/fichas");
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between pt-1">
        <IconButton label="Voltar" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft size={22} />
        </IconButton>
        <IconButton label="Editar exercício" onClick={() => setEdit(true)}>
          <Pencil size={18} />
        </IconButton>
      </div>

      <MediaGallery key={exercise.media.length} exercise={exercise} onAdd={() => setMedia(true)} />

      <div className="mt-4">
        <h1 className="text-2xl font-extrabold leading-tight">{exercise.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {exercise.equipment && <Chip tone="plain">{exercise.equipment}</Chip>}
          {exercise.category !== "forca" && <Chip tone="leaf">{CATEGORY_LABEL[exercise.category]}</Chip>}
        </div>
        {exercise.muscles.length > 0 && (
          <div className="mt-2">
            <MuscleChips muscles={exercise.muscles} />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="sun" onClick={() => setMedia(true)}>
          <ImagePlus size={18} /> Foto / vídeo
        </Button>
        <a
          href={youtubeSearchUrl(exercise.name)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-card-2 px-4 text-[15px] font-bold"
        >
          <PlayCircle size={18} /> Ver no YouTube
        </a>
      </div>

      {exercise.steps.length > 0 && (
        <section className="mt-6">
          <SectionTitle>Como fazer</SectionTitle>
          <ol className="space-y-2.5">
            {exercise.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sun-soft text-xs font-extrabold">{i + 1}</span>
                <p className="text-[15px] leading-snug text-ink-2">{s}</p>
              </li>
            ))}
          </ol>
          {exercise.tip && (
            <div className="mt-3 flex gap-3 rounded-2xl bg-sun-pale p-3">
              <Paw size={22} className="shrink-0 text-sun-deep" />
              <p className="text-sm text-ink-2">{exercise.tip}</p>
            </div>
          )}
        </section>
      )}

      {(exercise.muscles.length > 0 || exercise.secondary.length > 0) && (
        <section className="mt-6">
          <SectionTitle>Músculos</SectionTitle>
          <Card className="p-4">
            <ExerciseMuscles muscles={exercise.muscles} secondary={exercise.secondary} />
            <div className="mt-3 flex justify-center gap-4 text-xs text-ink-2">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#e9a10f]" /> principal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#f8d77e]" /> ajuda
              </span>
            </div>
          </Card>
        </section>
      )}

      <section className="mt-6">
        <SectionTitle>Minha anotação</SectionTitle>
        <NoteBox key={exercise.id} exercise={exercise} />
      </section>

      <section className="mt-6">
        <SectionTitle>Seu histórico</SectionTitle>
        <Card className="p-4">
          <LineChart points={chartPoints} unit={chartUnit} emptyText="Quando você fizer esse exercício, a evolução aparece aqui." />
          {history.length > 0 && (
            <ul className="mt-3 divide-y divide-line">
              {[...history]
                .reverse()
                .slice(0, 6)
                .map((h) => (
                  <li key={h.sessionId} className="flex justify-between py-2 text-sm">
                    <span className="text-ink-3">{formatDate(h.date)}</span>
                    <span className="font-bold">{lastSummary({ sessionId: h.sessionId, date: h.date, sets: h.sets }, exercise.measure, exercise.weighted)}</span>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </section>

      {usedIn.length > 0 && (
        <p className="mt-4 text-center text-sm text-ink-3">Está na ficha: {usedIn.map((p) => p.name).join(", ")}</p>
      )}

      {exercise.custom && (
        <Button variant="danger" className="mt-6 w-full" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={16} /> Excluir exercício
        </Button>
      )}

      <MediaManagerSheet exercise={exercise} open={media} onClose={() => setMedia(false)} />
      {edit && <ExerciseFormSheet open exercise={exercise} onClose={() => setEdit(false)} onSaved={() => setEdit(false)} />}
      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir exercício?"
        message={
          usedIn.length
            ? `Ele está nas fichas: ${usedIn.map((p) => p.name).join(", ")}. Lá ele vai aparecer como "removido" até você trocar.`
            : "O histórico de treinos continua salvo."
        }
        confirmLabel="Excluir"
        danger
        onConfirm={remove}
      />
      <p className="mt-6 text-center text-xs text-ink-3">{fmt(history.length, 0)} treinos com esse exercício</p>
    </div>
  );
}

function Loader() {
  const id = useSearchParams().get("id");
  const exercise = useLiveQuery(async () => (id ? ((await db.exercises.get(id)) ?? null) : null), [id]);
  if (exercise === undefined) return <Spinner />;
  if (!exercise) return <EmptyState title="Exercício não encontrado" />;
  return <ExerciseDetail exercise={exercise} />;
}

export default function ExercicioPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Loader />
    </Suspense>
  );
}
