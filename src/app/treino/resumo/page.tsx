"use client";

import { Trophy } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Cat, PetalRain } from "@/components/art";
import { Button, Card, cx, EmptyState, inputClass, Spinner } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDuration } from "@/lib/dates";
import { useDoneSessions, useProfile } from "@/lib/hooks";
import { fmt, personalRecords, sessionProgress, sessionVolume } from "@/lib/stats";
import type { Session } from "@/lib/types";

const CHEERS = [
  "Você é incrível!",
  "Mais um girassol no jardim!",
  "Que orgulho!",
  "Arrasou demais!",
  "Treino lindo!",
];

const FEELINGS = [
  { v: 1, e: "😮‍💨", l: "Exausta" },
  { v: 2, e: "😕", l: "Cansada" },
  { v: 3, e: "🙂", l: "Ok" },
  { v: 4, e: "😊", l: "Bem" },
  { v: 5, e: "🤩", l: "Incrível" },
];

function Summary({ session }: { session: Session }) {
  const router = useRouter();
  const profile = useProfile();
  const sessions = useDoneSessions();
  const [note, setNote] = useState(session.note ?? "");
  const { done } = sessionProgress(session);
  const volume = sessionVolume(session);
  const prs = sessions ? personalRecords(session, sessions) : [];
  const cheer = CHEERS[session.startedAt % CHEERS.length];
  const duration = (session.finishedAt ?? session.startedAt) - session.startedAt;

  return (
    <div className="pt-4">
      <PetalRain />
      <div className="flex flex-col items-center text-center">
        <Cat pose="happy" size={160} className="animate-pop" />
        <h1 className="mt-2 font-hand text-5xl font-bold">{cheer}</h1>
        <p className="mt-1 text-ink-2">
          {profile?.name ? `${profile.name}, você` : "Você"} terminou o <b>{session.planName}</b>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xl font-extrabold">{formatDuration(duration)}</p>
          <p className="text-xs text-ink-3">de treino</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-extrabold">{done}</p>
          <p className="text-xs text-ink-3">séries</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-extrabold">{volume >= 1000 ? `${fmt(volume / 1000, 1)} t` : volume ? `${fmt(volume, 0)} kg` : session.exercises.length}</p>
          <p className="text-xs text-ink-3">{volume ? "levantadas" : "exercícios"}</p>
        </Card>
      </div>

      {prs.length > 0 && (
        <Card className="mt-4 p-4">
          <p className="mb-2 flex items-center gap-2 font-extrabold">
            <Trophy size={18} className="text-sun-deep" /> Recordes novos!
          </p>
          <ul className="space-y-1 text-sm">
            {prs.map((p) => (
              <li key={p.name} className="flex justify-between gap-2">
                <span className="text-ink-2">{p.name}</span>
                <span className="font-bold">
                  {fmt(p.weight)} kg <span className="text-ink-3">(antes {fmt(p.previous)})</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-4 p-4">
        <p className="mb-3 font-extrabold">Como você se sentiu?</p>
        <div className="grid grid-cols-5 gap-1.5">
          {FEELINGS.map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => db.sessions.update(session.id, { feeling: f.v })}
              className={cx(
                "flex flex-col items-center gap-1 rounded-2xl border py-2 transition",
                session.feeling === f.v ? "border-sun bg-sun-pale" : "border-line bg-card",
              )}
            >
              <span className="text-2xl">{f.e}</span>
              <span className="text-[11px] font-bold text-ink-2">{f.l}</span>
            </button>
          ))}
        </div>
        <textarea
          rows={2}
          className={cx(inputClass, "mt-3 h-auto py-3")}
          placeholder="Anotação (opcional): dor, energia, o que mudar…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => db.sessions.update(session.id, { note: note.trim() || undefined })}
        />
      </Card>

      <Button
        variant="sun"
        size="lg"
        className="mt-6 w-full"
        onClick={async () => {
          await db.sessions.update(session.id, { note: note.trim() || undefined });
          router.replace("/");
        }}
      >
        Pronto 🌻
      </Button>
    </div>
  );
}

function Loader() {
  const id = useSearchParams().get("id");
  const session = useLiveQuery(async () => (id ? ((await db.sessions.get(id)) ?? null) : null), [id]);
  if (session === undefined) return <Spinner />;
  if (!session) return <EmptyState title="Treino não encontrado" />;
  return <Summary session={session} />;
}

export default function ResumoPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Loader />
    </Suspense>
  );
}
