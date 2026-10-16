import { db, uid } from "./db";
import { lastPerformance, prefillSets } from "./stats";
import type { Exercise, Plan, PlanItem, Session, SessionExercise } from "./types";

export async function getActiveSession() {
  return db.sessions.where("status").equals("active").first();
}

function toSessionExercise(item: PlanItem, ex: Exercise, history: Session[]): SessionExercise {
  const last = lastPerformance(ex.id, history);
  return {
    key: uid("ex"),
    exerciseId: ex.id,
    name: ex.name,
    muscles: ex.muscles,
    secondary: ex.secondary,
    category: ex.category,
    measure: ex.measure,
    weighted: ex.weighted,
    target: {
      sets: item.sets,
      repsMin: item.repsMin,
      repsMax: item.repsMax,
      restSec: item.restSec,
      perSide: item.perSide,
    },
    note: item.note,
    sets: prefillSets(item, ex, last),
  };
}

/** Começa um treino a partir de uma ficha (ou devolve o que já está em andamento). */
export async function startWorkout(plan: Plan): Promise<string> {
  return db.transaction("rw", db.sessions, db.exercises, async () => {
    const active = await db.sessions.where("status").equals("active").first();
    if (active) return active.id;
    const history = await db.sessions.where("status").equals("done").toArray();
    const exs = await db.exercises.bulkGet(plan.items.map((i) => i.exerciseId));
    const exercises: SessionExercise[] = [];
    plan.items.forEach((item, i) => {
      const ex = exs[i];
      if (ex) exercises.push(toSessionExercise(item, ex, history));
    });
    const session: Session = {
      id: uid("treino"),
      planId: plan.id,
      planName: plan.subtitle ? `${plan.name} — ${plan.subtitle}` : plan.name,
      status: "active",
      startedAt: Date.now(),
      exercises,
    };
    await db.sessions.add(session);
    return session.id;
  });
}

/** Lê o treino atualizado, aplica a mudança e salva — tudo numa transação. */
export async function mutateSession(id: string, fn: (s: Session) => void) {
  await db.transaction("rw", db.sessions, async () => {
    const s = await db.sessions.get(id);
    if (!s) return;
    fn(s);
    await db.sessions.put(s);
  });
}

export async function addExerciseToSession(sessionId: string, ex: Exercise) {
  const history = await db.sessions.where("status").equals("done").toArray();
  const item: PlanItem = {
    id: uid("item"),
    exerciseId: ex.id,
    sets: ex.category === "cardio" ? 1 : 3,
    repsMin: ex.measure === "reps" ? 10 : ex.measure === "seconds" ? 30 : 15,
    repsMax: ex.measure === "reps" ? 12 : ex.measure === "seconds" ? 30 : 20,
    restSec: ex.category === "forca" ? 60 : 30,
  };
  const se = toSessionExercise(item, ex, history);
  await mutateSession(sessionId, (s) => {
    s.exercises.push(se);
  });
}

/** Troca um exercício do treino de hoje (ex.: máquina ocupada), mantendo séries e repetições. */
export async function replaceExerciseInSession(sessionId: string, key: string, ex: Exercise) {
  const history = await db.sessions.where("status").equals("done").toArray();
  await mutateSession(sessionId, (s) => {
    const i = s.exercises.findIndex((e) => e.key === key);
    if (i < 0) return;
    const old = s.exercises[i];
    const sameMeasure = old.measure === ex.measure;
    const item: PlanItem = {
      id: uid("item"),
      exerciseId: ex.id,
      sets: old.target.sets,
      repsMin: sameMeasure ? old.target.repsMin : ex.measure === "seconds" ? 30 : ex.measure === "minutes" ? 15 : 10,
      repsMax: sameMeasure ? old.target.repsMax : ex.measure === "seconds" ? 30 : ex.measure === "minutes" ? 20 : 12,
      restSec: old.target.restSec,
      perSide: old.target.perSide,
    };
    s.exercises[i] = { ...toSessionExercise(item, ex, history), note: old.note };
  });
}

export async function finishWorkout(id: string) {
  await mutateSession(id, (s) => {
    s.status = "done";
    s.finishedAt = Date.now();
    // Séries não feitas não entram no histórico.
    s.exercises = s.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
      .filter((e) => e.sets.length > 0);
  });
}

export async function discardWorkout(id: string) {
  await db.sessions.delete(id);
}
