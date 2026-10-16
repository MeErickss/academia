"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { db } from "@/lib/db";
import { formatDate, formatDuration, formatTime, WEEKDAYS } from "@/lib/dates";
import { fmt, MEASURE_UNIT, sessionVolume } from "@/lib/stats";
import type { Session } from "@/lib/types";
import { Paw } from "./art";
import { Button, ConfirmSheet, Sheet } from "./ui";

const FEEL = ["", "😮‍💨 exausta", "😕 cansada", "🙂 ok", "😊 bem", "🤩 incrível"];

export function SessionSheet({ session, onClose }: { session: Session | null; onClose: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (!session) return null;
  const d = new Date(session.startedAt);
  const volume = sessionVolume(session);
  return (
    <>
      <Sheet open={!!session && !confirm} onClose={onClose} title={session.planName}>
        <p className="mb-3 text-sm text-ink-2">
          {WEEKDAYS[d.getDay()]}, {formatDate(d, true)} · {formatTime(d)}
          {session.finishedAt ? ` · ${formatDuration(session.finishedAt - session.startedAt)}` : ""}
          {volume ? ` · ${fmt(volume, 0)} kg no total` : ""}
          {session.feeling ? ` · ${FEEL[session.feeling]}` : ""}
        </p>
        {session.note && <p className="mb-3 rounded-2xl bg-sun-pale p-3 text-sm">{session.note}</p>}
        <ul className="space-y-3">
          {session.exercises.map((ex) => (
            <li key={ex.key} className="rounded-2xl border border-line p-3">
              <p className="font-bold">{ex.name}</p>
              <ul className="mt-1 space-y-0.5 text-sm text-ink-2">
                {ex.sets.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Paw size={12} className="text-sun-deep" />
                    {ex.weighted && s.weight != null ? `${fmt(s.weight)} kg × ` : ""}
                    {s.value ?? "–"} {MEASURE_UNIT[ex.measure]}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <Button variant="danger" className="mt-5 w-full" onClick={() => setConfirm(true)}>
          <Trash2 size={16} /> Apagar esse treino
        </Button>
      </Sheet>
      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Apagar treino?"
        message="Ele sai do histórico e dos gráficos. Não dá pra desfazer."
        confirmLabel="Apagar"
        danger
        onConfirm={async () => {
          await db.sessions.delete(session.id);
          setConfirm(false);
          onClose();
        }}
      />
    </>
  );
}
