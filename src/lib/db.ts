import Dexie, { type EntityTable } from "dexie";
import { BUILTIN_EXERCISES } from "./catalog";
import { defaultPlans } from "./seed";
import type { BodyLog, Exercise, FoodDay, MealEntry, MediaItem, Plan, Profile, Session } from "./types";

/**
 * "Banco de dados" do app: IndexedDB do próprio navegador.
 * Nada sai do celular — por isso existe o backup em JSON.
 */
export class GirassolDB extends Dexie {
  profile!: EntityTable<Profile, "id">;
  exercises!: EntityTable<Exercise, "id">;
  plans!: EntityTable<Plan, "id">;
  sessions!: EntityTable<Session, "id">;
  bodyLogs!: EntityTable<BodyLog, "id">;
  media!: EntityTable<MediaItem, "id">;
  meals!: EntityTable<MealEntry, "id">;
  foodDays!: EntityTable<FoodDay, "date">;

  constructor() {
    super("girassol");
    this.version(1).stores({
      profile: "id",
      exercises: "id, name, custom",
      plans: "id, order",
      sessions: "id, status, startedAt, planId",
      bodyLogs: "id, date",
      media: "id, purpose, exerciseId, date",
    });
    // v2: alimentação
    this.version(2).stores({
      meals: "id, date",
      foodDays: "date",
    });
    this.on("populate", (tx) => {
      tx.table("exercises").bulkAdd(BUILTIN_EXERCISES);
      tx.table("plans").bulkAdd(defaultPlans());
    });
  }
}

export const db = new GirassolDB();

const STATIC_FIELDS = [
  "muscles",
  "secondary",
  "equipment",
  "category",
  "measure",
  "frames",
  "steps",
  "tip",
] as const;

/**
 * Garante que os exercícios que vêm com o app estejam atualizados
 * (novos exercícios, textos corrigidos…) sem mexer no que ela adicionou:
 * fotos/vídeos, anotações e nome personalizado ficam como estão.
 */
export async function syncBuiltinExercises() {
  await db.transaction("rw", db.exercises, async () => {
    const existing = await db.exercises.bulkGet(BUILTIN_EXERCISES.map((e) => e.id));
    const toPut: Exercise[] = [];
    BUILTIN_EXERCISES.forEach((builtin, i) => {
      const current = existing[i];
      if (!current) {
        toPut.push(builtin);
        return;
      }
      const changed = STATIC_FIELDS.some(
        (k) => JSON.stringify(current[k]) !== JSON.stringify(builtin[k]),
      );
      if (changed) {
        const next: Exercise = { ...current };
        for (const k of STATIC_FIELDS) (next as unknown as Record<string, unknown>)[k] = builtin[k];
        toPut.push(next);
      }
    });
    if (toPut.length) await db.exercises.bulkPut(toPut);
  });
}

export function uid(prefix = "") {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return prefix ? `${prefix}-${rnd}` : rnd;
}

/** Pede ao navegador para não apagar os dados quando faltar espaço. */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* sem suporte — tudo bem */
  }
}
