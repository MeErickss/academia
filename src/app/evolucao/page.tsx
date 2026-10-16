"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ExtendedBodyPart, Slug } from "react-muscle-highlighter";
import { Sunflower } from "@/components/art";
import { BodyFigure } from "@/components/BodyMap";
import { LineChart } from "@/components/LineChart";
import { SessionSheet } from "@/components/SessionSheet";
import { Card, cx, EmptyState, PageHeader, SectionTitle, Select, Sheet, Spinner } from "@/components/ui";
import { addDays, dayKey, formatDate, formatDuration, MONTHS, relativeDay, WEEKDAYS_LETTER } from "@/lib/dates";
import { useDoneSessions, useExerciseMap } from "@/lib/hooks";
import { ALL_MUSCLES, MUSCLE_SLUGS } from "@/lib/muscles";
import {
  exerciseHistory,
  muscleRecovery,
  RECOVERY_INFO,
  regionRecovery,
  sessionProgress,
  weekStreak,
  type RecoveryStatus,
} from "@/lib/stats";
import type { Session } from "@/lib/types";

const RANK: Record<RecoveryStatus, number> = { descansando: 3, recuperando: 2, pronto: 1, saudade: 0 };

function listPt(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function RecoveryCard({ sessions }: { sessions: Session[] }) {
  const rec = muscleRecovery(sessions);
  const regions = regionRecovery(rec);

  const slugStatus = new Map<Slug, RecoveryStatus>();
  for (const m of ALL_MUSCLES) {
    const r = rec[m];
    if (r.last === null) continue;
    for (const s of MUSCLE_SLUGS[m]) {
      const cur = slugStatus.get(s);
      if (!cur || RANK[r.status] > RANK[cur]) slugStatus.set(s, r.status);
    }
  }
  const parts: ExtendedBodyPart[] = [...slugStatus]
    .filter(([, st]) => st !== "saudade")
    .map(([slug, st]) => ({ slug, styles: { fill: RECOVERY_INFO[st].color } }));

  const ready = regions.filter((r) => r.status === "pronto").map((r) => r.region.label.toLowerCase());
  const missing = regions.filter((r) => r.status === "saudade" && r.last !== null).map((r) => r.region.label.toLowerCase());
  const never = regions.every((r) => r.last === null);

  return (
    <Card className="p-4">
      <p className="text-lg font-extrabold leading-snug">
        {never
          ? "Seus músculos estão esperando o primeiro treino 🌱"
          : ready.length
            ? `Prontinho pra treinar: ${listPt(ready)}`
            : "Tudo descansando — bom sinal de que você treinou!"}
      </p>
      {missing.length > 0 && <p className="mt-1 text-sm font-bold text-peach">Faz tempo que você não treina {listPt(missing)}.</p>}

      <div className="my-4 flex justify-center gap-6">
        <BodyFigure side="front" parts={parts} className="w-[38%] max-w-[150px]" />
        <BodyFigure side="back" parts={parts} className="w-[38%] max-w-[150px]" />
      </div>

      <div className="mb-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink-2">
        {(Object.keys(RECOVERY_INFO) as RecoveryStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s === "saudade" ? "var(--line)" : RECOVERY_INFO[s].color }} />
            {RECOVERY_INFO[s].label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {regions.map(({ region, last, status }) => (
          <div key={region.id} className="rounded-2xl bg-card-2 p-3">
            <p className="flex items-center gap-1.5 font-extrabold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: status === "saudade" ? "var(--ink-3)" : RECOVERY_INFO[status].color }} />
              {region.label}
            </p>
            <p className="text-sm text-ink-2">{last ? RECOVERY_INFO[status].label : "Esperando 🌱"}</p>
            <p className="text-xs text-ink-3">{last ? relativeDay(last) : "ainda não treinou"}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-3">
        É uma estimativa pelo tempo desde o último treino e quantas séries ele teve. Recuperação de verdade também depende de
        sono e comida — isso o app não sabe 😉
      </p>
    </Card>
  );
}

function Calendar({ sessions, onOpen }: { sessions: Session[]; onOpen: (list: Session[]) => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const first = new Date(cursor.y, cursor.m, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const byDay = new Map<string, Session[]>();
  for (const s of sessions) {
    const k = dayKey(s.startedAt);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }
  const monthCount = [...byDay.keys()].filter((k) => k.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`)).length;
  const today = dayKey();
  const now = new Date();
  const isCurrentMonth = cursor.y === now.getFullYear() && cursor.m === now.getMonth();

  const shift = (n: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" onClick={() => shift(-1)} className="flex h-10 w-10 items-center justify-center rounded-full active:bg-card-2">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-extrabold">
            {MONTHS[cursor.m][0].toUpperCase() + MONTHS[cursor.m].slice(1)} de {cursor.y}
          </p>
          <p className="text-xs text-ink-3">{monthCount ? `${monthCount} ${monthCount === 1 ? "dia de treino" : "dias de treino"}` : "nenhum treino"}</p>
        </div>
        <button
          type="button"
          aria-label="Próximo mês"
          disabled={isCurrentMonth}
          onClick={() => shift(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-card-2 disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {[1, 2, 3, 4, 5, 6, 0].map((d, i) => (
          <span key={i} className="pb-1 text-[11px] font-bold text-ink-3">
            {WEEKDAYS_LETTER[d]}
          </span>
        ))}
        {Array.from({ length: startPad }, (_, i) => (
          <span key={`p${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(cursor.y, cursor.m, i + 1);
          const k = dayKey(date);
          const list = byDay.get(k);
          const future = date > now && k !== today;
          return (
            <button
              key={k}
              type="button"
              disabled={!list}
              onClick={() => list && onOpen(list)}
              className={cx(
                "relative flex aspect-square items-center justify-center rounded-xl text-sm font-bold",
                list ? "bg-sun-pale" : "bg-card-2",
                future && "opacity-40",
                k === today && "ring-2 ring-sun",
              )}
            >
              {list ? <Sunflower size={30} /> : i + 1}
              {list && <span className="absolute bottom-0.5 right-1 text-[9px] font-extrabold text-ink-2">{i + 1}</span>}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function ExerciseProgress({ sessions }: { sessions: Session[] }) {
  const exercises = useExerciseMap();
  const counts = new Map<string, { name: string; n: number }>();
  for (const s of sessions)
    for (const e of s.exercises) {
      if (e.category !== "forca") continue;
      const c = counts.get(e.exerciseId);
      counts.set(e.exerciseId, { name: e.name, n: (c?.n ?? 0) + 1 });
    }
  const options = [...counts.entries()].sort((a, b) => b[1].n - a[1].n);
  const [picked, setPicked] = useState<string | null>(null);
  const id = picked && counts.has(picked) ? picked : options[0]?.[0];
  if (!id) return <p className="py-4 text-center text-sm text-ink-3">Depois do primeiro treino, sua evolução aparece aqui.</p>;

  const ex = exercises?.get(id);
  const hist = exerciseHistory(id, sessions);
  const weighted = (ex?.weighted ?? true) && hist.some((h) => h.maxWeight !== null);
  const unit = weighted ? "kg" : ex?.measure === "seconds" ? "seg" : ex?.measure === "minutes" ? "min" : "reps";
  const pts = hist.map((h) => ({ x: h.date, y: weighted ? (h.maxWeight ?? 0) : h.bestValue }));
  const first = pts[0]?.y;
  const lastV = pts[pts.length - 1]?.y;

  return (
    <div>
      <Select
        ariaLabel="Exercício do gráfico"
        title="Escolher exercício"
        value={id}
        onChange={setPicked}
        options={options.map(([eid, o]) => ({
          value: eid,
          label: exercises?.get(eid)?.name ?? o.name,
          hint: `${o.n} ${o.n === 1 ? "treino" : "treinos"}`,
        }))}
      />
      <div className="mt-3">
        <LineChart points={pts} unit={unit} />
      </div>
      {pts.length >= 2 && lastV !== undefined && first !== undefined && (
        <p className="mt-2 text-center text-sm text-ink-2">
          {lastV > first ? (
            <>
              Você foi de <b>{first}</b> para <b>{lastV} {unit}</b>. Que evolução! 🌻
            </>
          ) : (
            "Constância é o que importa. Continue firme!"
          )}
        </p>
      )}
    </div>
  );
}

export default function EvolucaoPage() {
  const sessions = useDoneSessions();
  const [daySessions, setDaySessions] = useState<Session[] | null>(null);
  const [open, setOpen] = useState<Session | null>(null);
  if (!sessions) return <Spinner />;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = sessions.filter((s) => dayKey(s.startedAt).startsWith(monthKey)).length;
  const totalTime = sessions.reduce((t, s) => t + ((s.finishedAt ?? s.startedAt) - s.startedAt), 0);
  const recent = [...sessions].reverse().slice(0, 12);
  const last30 = sessions.filter((s) => s.startedAt >= addDays(now, -30).getTime()).length;

  return (
    <div>
      <PageHeader title="Evolução" subtitle="Seu jardim de treinos 🌻" />

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-3xl font-extrabold">{thisMonth}</p>
          <p className="text-sm text-ink-3">treinos esse mês</p>
        </Card>
        <Card className="p-4">
          <p className="text-3xl font-extrabold">{weekStreak(sessions)}</p>
          <p className="text-sm text-ink-3">semanas seguidas</p>
        </Card>
        <Card className="p-4">
          <p className="text-3xl font-extrabold">{sessions.length}</p>
          <p className="text-sm text-ink-3">treinos no total</p>
        </Card>
        <Card className="p-4">
          <p className="text-3xl font-extrabold">{formatDuration(totalTime)}</p>
          <p className="text-sm text-ink-3">treinando ({last30} nos últimos 30 dias)</p>
        </Card>
      </div>

      <section className="mb-6">
        <SectionTitle>Como estão seus músculos</SectionTitle>
        <RecoveryCard sessions={sessions} />
      </section>

      <section className="mb-6">
        <SectionTitle>Calendário</SectionTitle>
        <Calendar sessions={sessions} onOpen={(list) => (list.length === 1 ? setOpen(list[0]) : setDaySessions(list))} />
      </section>

      <section className="mb-6">
        <SectionTitle>Evolução por exercício</SectionTitle>
        <Card className="p-4">
          <ExerciseProgress sessions={sessions} />
        </Card>
      </section>

      <section>
        <SectionTitle>Últimos treinos</SectionTitle>
        {recent.length === 0 ? (
          <EmptyState title="Nenhum treino ainda">Seu histórico aparece aqui.</EmptyState>
        ) : (
          <Card className="divide-y divide-line">
            {recent.map((s) => (
              <button key={s.id} type="button" onClick={() => setOpen(s)} className="flex w-full items-center gap-3 p-3 text-left active:bg-card-2">
                <Sunflower size={34} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{s.planName}</span>
                  <span className="block text-sm text-ink-3">
                    {formatDate(s.startedAt)} · {sessionProgress(s).done} séries
                    {s.finishedAt ? ` · ${formatDuration(s.finishedAt - s.startedAt)}` : ""}
                  </span>
                </span>
                <ChevronRight size={18} className="text-ink-3" />
              </button>
            ))}
          </Card>
        )}
      </section>

      <Sheet open={!!daySessions} onClose={() => setDaySessions(null)} title="Treinos do dia">
        <div className="space-y-2">
          {daySessions?.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setOpen(s);
                setDaySessions(null);
              }}
              className="w-full rounded-2xl border border-line p-3 text-left font-bold"
            >
              {s.planName}
            </button>
          ))}
        </div>
      </Sheet>
      <SessionSheet key={open?.id} session={open} onClose={() => setOpen(null)} />
    </div>
  );
}
