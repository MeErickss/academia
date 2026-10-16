import { addDays, startOfWeek } from "./dates";
import { ALL_MUSCLES, REGIONS } from "./muscles";
import type { Exercise, Measure, Muscle, PlanItem, Session, SessionExercise, SetLog } from "./types";

export function fmt(n: number | null | undefined, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "–";
  return n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
}

export const MEASURE_UNIT: Record<Measure, string> = { reps: "reps", seconds: "seg", minutes: "min" };

export function rangeLabel(min: number, max: number) {
  return min === max || !max ? `${min}` : `${min}–${max}`;
}

/** "3 × 10–12", "3 × 30 seg cada lado", "15–20 min" */
export function targetLabel(
  t: { sets: number; repsMin: number; repsMax: number; perSide?: boolean },
  measure: Measure,
) {
  const range = rangeLabel(t.repsMin, t.repsMax);
  const side = t.perSide ? " cada lado" : "";
  if (measure === "minutes") return t.sets > 1 ? `${t.sets} × ${range} min` : `${range} min`;
  if (measure === "seconds") return `${t.sets} × ${range} seg${side}`;
  return `${t.sets} × ${range}${side}`;
}

export const doneSets = (ex: SessionExercise) => ex.sets.filter((s) => s.done);

export function sessionProgress(s: Session) {
  let done = 0;
  let total = 0;
  for (const ex of s.exercises) {
    total += ex.sets.length;
    done += doneSets(ex).length;
  }
  return { done, total };
}

export function sessionVolume(s: Session) {
  let v = 0;
  for (const ex of s.exercises) {
    if (ex.measure !== "reps") continue;
    for (const set of doneSets(ex)) v += (set.weight ?? 0) * (set.value ?? 0);
  }
  return v;
}

export function maxWeight(sets: SetLog[]) {
  let m: number | null = null;
  for (const s of sets) if (s.done && s.weight != null && (m === null || s.weight > m)) m = s.weight;
  return m;
}

export interface LastPerformance {
  sessionId: string;
  date: number;
  sets: SetLog[];
}

/** Última vez que ela fez esse exercício (só séries concluídas). */
export function lastPerformance(
  exerciseId: string,
  sessions: Session[],
  excludeSessionId?: string,
): LastPerformance | null {
  let best: LastPerformance | null = null;
  for (const s of sessions) {
    if (s.status !== "done" || s.id === excludeSessionId) continue;
    const date = s.finishedAt ?? s.startedAt;
    if (best && date <= best.date) continue;
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    const sets = doneSets(ex);
    if (!sets.length) continue;
    best = { sessionId: s.id, date, sets };
  }
  return best;
}

export function lastSummary(last: LastPerformance, measure: Measure, weighted: boolean) {
  const unit = MEASURE_UNIT[measure];
  const values = last.sets.map((s) => s.value ?? 0);
  const allSame = values.every((v) => v === values[0]);
  const reps = allSame ? `${last.sets.length} × ${values[0]} ${unit}` : `${values.join(", ")} ${unit}`;
  const w = maxWeight(last.sets);
  return weighted && w ? `${reps} · ${fmt(w)} kg` : reps;
}

/** Fez todas as séries no máximo de repetições? Então dá pra subir a carga. */
export function readyToIncrease(last: LastPerformance | null, item: Pick<PlanItem, "sets" | "repsMax">, ex: Pick<Exercise, "measure" | "weighted">) {
  if (!last || ex.measure !== "reps" || !ex.weighted) return false;
  if (last.sets.length < item.sets) return false;
  return last.sets.every((s) => (s.value ?? 0) >= item.repsMax);
}

/** Séries já preenchidas com o que ela fez da última vez (ou a carga sugerida). */
export function prefillSets(item: PlanItem, ex: Exercise, last: LastPerformance | null): SetLog[] {
  const lastW = last ? maxWeight(last.sets) : null;
  return Array.from({ length: Math.max(1, item.sets) }, (_, i) => ({
    weight: ex.weighted ? (last?.sets[i]?.weight ?? lastW ?? item.loadKg ?? null) : null,
    value: item.repsMax || item.repsMin || null,
    done: false,
  }));
}

export interface ExercisePoint {
  sessionId: string;
  date: number;
  maxWeight: number | null;
  bestValue: number;
  sets: SetLog[];
}

export function exerciseHistory(exerciseId: string, sessions: Session[]): ExercisePoint[] {
  const pts: ExercisePoint[] = [];
  for (const s of sessions) {
    if (s.status !== "done") continue;
    for (const ex of s.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      const sets = doneSets(ex);
      if (!sets.length) continue;
      pts.push({
        sessionId: s.id,
        date: s.finishedAt ?? s.startedAt,
        maxWeight: maxWeight(sets),
        bestValue: Math.max(...sets.map((x) => x.value ?? 0)),
        sets,
      });
    }
  }
  return pts.sort((a, b) => a.date - b.date);
}

/** Exercícios em que ela bateu a maior carga da vida neste treino. */
export function personalRecords(session: Session, sessions: Session[]) {
  const prs: { name: string; weight: number; previous: number }[] = [];
  const before = sessions.filter(
    (s) => s.status === "done" && s.id !== session.id && (s.finishedAt ?? s.startedAt) < (session.finishedAt ?? Date.now()),
  );
  for (const ex of session.exercises) {
    if (!ex.weighted || ex.measure !== "reps") continue;
    const now = maxWeight(ex.sets);
    if (!now) continue;
    let prev: number | null = null;
    for (const s of before) {
      for (const e of s.exercises) {
        if (e.exerciseId !== ex.exerciseId) continue;
        const w = maxWeight(e.sets);
        if (w !== null && (prev === null || w > prev)) prev = w;
      }
    }
    if (prev !== null && now > prev) prs.push({ name: ex.name, weight: now, previous: prev });
  }
  return prs;
}

// ——— Recuperação muscular ———

export type RecoveryStatus = "descansando" | "recuperando" | "pronto" | "saudade";

export const RECOVERY_INFO: Record<RecoveryStatus, { label: string; color: string; hint: string }> = {
  descansando: { label: "Descansando", color: "#e8836b", hint: "treinou há pouco" },
  recuperando: { label: "Recuperando", color: "#f2b544", hint: "quase pronto" },
  pronto: { label: "Prontinho", color: "#86b062", hint: "pode treinar" },
  saudade: { label: "Com saudade", color: "#c9bba5", hint: "faz tempo" },
};

export interface MuscleRecovery {
  last: number | null;
  sets: number;
  status: RecoveryStatus;
}

export function muscleRecovery(sessions: Session[], now = Date.now()): Record<Muscle, MuscleRecovery> {
  const out = {} as Record<Muscle, MuscleRecovery>;
  for (const m of ALL_MUSCLES) out[m] = { last: null, sets: 0, status: "saudade" };

  for (const s of sessions) {
    if (s.status !== "done") continue;
    const when = s.finishedAt ?? s.startedAt;
    const perMuscle = new Map<Muscle, number>();
    for (const ex of s.exercises) {
      if (ex.category !== "forca") continue;
      const n = doneSets(ex).length;
      if (!n) continue;
      for (const m of ex.muscles) perMuscle.set(m, (perMuscle.get(m) ?? 0) + n);
      for (const m of ex.secondary) perMuscle.set(m, (perMuscle.get(m) ?? 0) + n * 0.5);
    }
    for (const [m, sets] of perMuscle) {
      const cur = out[m];
      if (cur.last === null || when > cur.last) out[m] = { ...cur, last: when, sets };
    }
  }

  for (const m of ALL_MUSCLES) {
    const r = out[m];
    if (r.last === null) continue;
    const hours = (now - r.last) / 3600000;
    const heavy = r.sets >= 6;
    const light = r.sets < 3; // só ajudou em outro exercício
    if (light) r.status = hours < 24 ? "recuperando" : hours <= 24 * 8 ? "pronto" : "saudade";
    else if (hours < 24) r.status = "descansando";
    else if (hours < (heavy ? 72 : 48)) r.status = "recuperando";
    else if (hours <= 24 * 8) r.status = "pronto";
    else r.status = "saudade";
  }
  return out;
}

const STATUS_RANK: Record<RecoveryStatus, number> = { descansando: 3, recuperando: 2, pronto: 1, saudade: 0 };

export function regionRecovery(rec: Record<Muscle, MuscleRecovery>) {
  return REGIONS.map((region) => {
    let last: number | null = null;
    let status: RecoveryStatus = "saudade";
    for (const m of region.muscles) {
      const r = rec[m];
      if (r.last !== null && (last === null || r.last > last)) last = r.last;
      if (STATUS_RANK[r.status] > STATUS_RANK[status]) status = r.status;
    }
    return { region, last, status };
  });
}

// ——— Semana / sequência ———

export function sessionsInWeek(sessions: Session[], weekStart: Date) {
  const a = weekStart.getTime();
  const b = addDays(weekStart, 7).getTime();
  return sessions.filter((s) => s.status === "done" && s.startedAt >= a && s.startedAt < b);
}

/** Semanas seguidas com pelo menos um treino (contando a atual se já tiver). */
export function weekStreak(sessions: Session[], now = new Date()) {
  let week = startOfWeek(now);
  let streak = 0;
  if (sessionsInWeek(sessions, week).length) streak++;
  week = addDays(week, -7);
  while (sessionsInWeek(sessions, week).length) {
    streak++;
    week = addDays(week, -7);
  }
  return streak;
}
