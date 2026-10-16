import { BUILTIN_EXERCISES } from "./catalog";
import { db, syncBuiltinExercises, uid } from "./db";
import { exerciseHistory, lastSummary, maxWeight } from "./stats";
import type {
  BodyLog,
  Category,
  Exercise,
  FoodDay,
  Measure,
  MealEntry,
  MediaItem,
  Muscle,
  Plan,
  PlanColor,
  PlanItem,
  Profile,
  Session,
} from "./types";
import { ALL_MUSCLES } from "./muscles";

export const BACKUP_FORMAT = 1;

export type MediaExport = Omit<MediaItem, "data"> & { dataUrl: string };

export interface BackupFile {
  app: "girassol";
  formato: number;
  tipo: "backup" | "fichas";
  exportadoEm: string;
  profile?: Profile | null;
  plans?: Plan[];
  exercises?: Exercise[];
  sessions?: Session[];
  bodyLogs?: BodyLog[];
  meals?: MealEntry[];
  foodDays?: FoodDay[];
  media?: MediaExport[];
  schedule?: Profile["schedule"];
  resumo?: unknown;
}

function bufferToDataUrl(data: ArrayBuffer, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(new Blob([data], { type: mime }));
  });
}

async function dataUrlToBuffer(dataUrl: string) {
  const res = await fetch(dataUrl);
  return res.arrayBuffer();
}

/** Resumo legível, pensado para quem for montar a próxima ficha. */
function buildSummary(sessions: Session[], exercises: Exercise[], profile: Profile | null) {
  const done = sessions.filter((s) => s.status === "done").sort((a, b) => a.startedAt - b.startedAt);
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const usedIds = new Set(done.flatMap((s) => s.exercises.map((e) => e.exerciseId)));
  const porExercicio = [...usedIds].map((id) => {
    const hist = exerciseHistory(id, done);
    const ex = byId.get(id);
    const name = ex?.name ?? done.flatMap((s) => s.exercises).find((e) => e.exerciseId === id)?.name ?? id;
    const last = hist[hist.length - 1];
    const first = hist[0];
    const measure = ex?.measure ?? "reps";
    const weighted = ex?.weighted ?? true;
    return {
      exercicio: name,
      id,
      vezes: hist.length,
      primeiraVez: first ? new Date(first.date).toISOString().slice(0, 10) : null,
      ultimaVez: last ? new Date(last.date).toISOString().slice(0, 10) : null,
      ultimoTreino: last ? lastSummary({ sessionId: last.sessionId, date: last.date, sets: last.sets }, measure, weighted) : null,
      cargaInicialKg: first ? maxWeight(first.sets) : null,
      maiorCargaKg: hist.reduce<number | null>((m, p) => (p.maxWeight !== null && (m === null || p.maxWeight > m) ? p.maxWeight : m), null),
    };
  });
  const sentimentos = done.filter((s) => s.feeling).map((s) => s.feeling as number);
  return {
    aluna: profile
      ? { nome: profile.name, idade: profile.age, pesoKg: profile.weightKg, alturaCm: profile.heightCm }
      : null,
    totalTreinos: done.length,
    primeiroTreino: done[0] ? new Date(done[0].startedAt).toISOString().slice(0, 10) : null,
    ultimoTreino: done.length ? new Date(done[done.length - 1].startedAt).toISOString().slice(0, 10) : null,
    mediaComoSeSentiu1a5: sentimentos.length
      ? Math.round((sentimentos.reduce((a, b) => a + b, 0) / sentimentos.length) * 10) / 10
      : null,
    porExercicio,
  };
}

function foodSummary(meals: MealEntry[], foodDays: FoodDay[]) {
  const days = new Set([...meals.map((m) => m.date), ...foodDays.filter((d) => d.water > 0).map((d) => d.date)]);
  if (!days.size) return null;
  const perGroup: Record<string, number> = {};
  for (const m of meals) for (const g of m.groups) perGroup[g] = (perGroup[g] ?? 0) + 1;
  const water = foodDays.filter((d) => d.water > 0);
  return {
    diasAnotados: days.size,
    refeicoesAnotadas: meals.length,
    mediaCoposDeAguaPorDia: water.length ? Math.round((water.reduce((t, d) => t + d.water, 0) / water.length) * 10) / 10 : null,
    vezesPorGrupoAlimentar: perGroup,
  };
}

export async function buildBackup(includeMedia: boolean): Promise<BackupFile> {
  const [profile, plans, exercises, sessions, bodyLogs, meals, foodDays] = await Promise.all([
    db.profile.get("me"),
    db.plans.orderBy("order").toArray(),
    db.exercises.toArray(),
    db.sessions.toArray(),
    db.bodyLogs.orderBy("date").toArray(),
    db.meals.orderBy("date").toArray(),
    db.foodDays.orderBy("date").toArray(),
  ]);
  const file: BackupFile = {
    app: "girassol",
    formato: BACKUP_FORMAT,
    tipo: "backup",
    exportadoEm: new Date().toISOString(),
    resumo: { ...buildSummary(sessions, exercises, profile ?? null), alimentacao: foodSummary(meals, foodDays) },
    profile: profile ?? null,
    plans,
    exercises,
    sessions: sessions.filter((s) => s.status === "done").sort((a, b) => a.startedAt - b.startedAt),
    bodyLogs,
    meals,
    foodDays,
  };
  if (includeMedia) file.media = await exportMedia();
  return file;
}

/** Fotos e vídeos convertidos para texto (data URL), para irem dentro do JSON. */
export async function exportMedia(): Promise<MediaExport[]> {
  const media = await db.media.toArray();
  return Promise.all(media.map(async ({ data, ...rest }) => ({ ...rest, dataUrl: await bufferToDataUrl(data, rest.mime) })));
}

export function backupFileName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `girassol-treinos-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export async function markBackupDone() {
  await db.profile.update("me", { lastBackupAt: Date.now() });
}

// ——— Importação ———

export interface ImportPreview {
  file: BackupFile;
  isFullBackup: boolean;
  counts: { plans: number; sessions: number; bodyLogs: number; meals: number; media: number; exercises: number };
}

export function parseBackup(text: string): ImportPreview {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Esse arquivo não é um JSON válido.");
  }
  if (!raw || typeof raw !== "object") throw new Error("Arquivo vazio ou num formato que o app não conhece.");
  const file = raw as BackupFile;
  if (!Array.isArray(file.plans) && !Array.isArray(file.sessions)) {
    throw new Error("Não encontrei fichas nem treinos nesse arquivo.");
  }
  const isFullBackup = Array.isArray(file.sessions) || !!file.profile;
  return {
    file,
    isFullBackup,
    counts: {
      plans: file.plans?.length ?? 0,
      sessions: file.sessions?.length ?? 0,
      bodyLogs: file.bodyLogs?.length ?? 0,
      meals: file.meals?.length ?? 0,
      media: file.media?.length ?? 0,
      exercises: file.exercises?.filter((e) => e.custom).length ?? 0,
    },
  };
}

const COLORS: PlanColor[] = ["sol", "folha", "pessego", "ceu", "lilas"];
const MEASURES: Measure[] = ["reps", "seconds", "minutes"];
const CATEGORIES: Category[] = ["forca", "cardio", "mobilidade"];
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const muscles = (v: unknown): Muscle[] =>
  Array.isArray(v) ? (v.filter((m) => ALL_MUSCLES.includes(m as Muscle)) as Muscle[]) : [];

/** Aceita fichas escritas à mão (por alguém ou por uma IA), preenchendo o que faltar. */
type ImportItem = PlanItem & { exerciseName?: string };

function normalizePlan(p: Partial<Plan> & { items?: unknown[] }, order: number, now: number): Plan {
  const items: ImportItem[] = (p.items ?? []).map((raw) => {
    const it = raw as Partial<PlanItem> & { exerciseName?: string };
    const repsMin = num(it.repsMin, 10);
    return {
      id: str(it.id) || uid("item"),
      exerciseId: str(it.exerciseId),
      sets: Math.max(1, Math.round(num(it.sets, 3))),
      repsMin,
      repsMax: num(it.repsMax, repsMin),
      restSec: num(it.restSec, 60),
      loadKg: typeof it.loadKg === "number" ? it.loadKg : null,
      perSide: !!it.perSide,
      note: str(it.note) || undefined,
      exerciseName: str(it.exerciseName) || undefined,
    };
  });
  return {
    id: str(p.id) || uid("ficha"),
    name: str(p.name, "Ficha nova"),
    subtitle: str(p.subtitle),
    color: COLORS.includes(p.color as PlanColor) ? (p.color as PlanColor) : COLORS[order % COLORS.length],
    note: str(p.note) || undefined,
    order,
    items,
    createdAt: num(p.createdAt, now),
    updatedAt: now,
  };
}

function normalizeExercise(e: Partial<Exercise>): Exercise {
  const builtin = BUILTIN_EXERCISES.find((b) => b.id === e.id);
  const base: Exercise = builtin ?? {
    id: str(e.id) || uid("custom"),
    name: str(e.name, "Exercício"),
    muscles: [],
    secondary: [],
    equipment: "",
    category: "forca",
    measure: "reps",
    weighted: true,
    frames: [],
    steps: [],
    media: [],
    custom: true,
    updatedAt: Date.now(),
  };
  if (builtin) {
    return { ...builtin, name: str(e.name, builtin.name), media: Array.isArray(e.media) ? e.media : [], myNote: e.myNote };
  }
  return {
    ...base,
    name: str(e.name, base.name),
    muscles: muscles(e.muscles),
    secondary: muscles(e.secondary),
    equipment: str(e.equipment),
    category: CATEGORIES.includes(e.category as Category) ? (e.category as Category) : "forca",
    measure: MEASURES.includes(e.measure as Measure) ? (e.measure as Measure) : "reps",
    weighted: e.weighted ?? true,
    frames: Array.isArray(e.frames) ? e.frames.filter((f) => typeof f === "string") : [],
    steps: Array.isArray(e.steps) ? e.steps.filter((f) => typeof f === "string") : [],
    tip: str(e.tip) || undefined,
    media: Array.isArray(e.media) ? e.media : [],
    myNote: str(e.myNote) || undefined,
    custom: true,
  };
}

/**
 * Importa só as fichas (e os exercícios novos que elas usam).
 * Itens com `exerciseName` e um id desconhecido viram exercícios novos.
 */
export async function importPlans(file: BackupFile, mode: "replace" | "add") {
  const now = Date.now();
  const fileExercises = new Map((file.exercises ?? []).map((e) => [e.id, e]));
  await db.transaction("rw", db.plans, db.exercises, db.profile, async () => {
    const existingPlans = await db.plans.toArray();
    let order = mode === "replace" ? 0 : existingPlans.reduce((m, p) => Math.max(m, p.order + 1), 0);
    const plans = (file.plans ?? []).map((p) => normalizePlan(p, order++, now));

    for (const plan of plans) {
      for (const item of plan.items as ImportItem[]) {
        const exerciseName = item.exerciseName;
        delete item.exerciseName;
        let ex = item.exerciseId ? await db.exercises.get(item.exerciseId) : undefined;
        if (!ex && fileExercises.has(item.exerciseId)) {
          ex = normalizeExercise(fileExercises.get(item.exerciseId)!);
          await db.exercises.put(ex);
        }
        if (!ex && exerciseName) {
          const byName = (await db.exercises.toArray()).find(
            (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
          );
          ex = byName ?? normalizeExercise({ id: uid("custom"), name: exerciseName });
          if (!byName) await db.exercises.put(ex);
        }
        if (!ex) throw new Error(`Exercício "${item.exerciseId || "?"}" não existe no app.`);
        item.exerciseId = ex.id;
      }
    }

    if (mode === "replace") {
      await db.plans.clear();
    } else {
      // Mesmo id de uma ficha que já existe? Ganha um id novo para não apagar a antiga.
      const ids = new Set(existingPlans.map((p) => p.id));
      for (const p of plans) if (ids.has(p.id)) p.id = uid("ficha");
    }
    await db.plans.bulkPut(plans);

    if (mode === "replace") {
      // Usa a agenda do arquivo, se tiver; senão mantém só os dias que ainda apontam pra fichas que existem.
      const prof = await db.profile.get("me");
      const schedule = file.schedule ?? file.profile?.schedule ?? prof?.schedule ?? {};
      const valid = new Set(plans.map((p) => p.id));
      const clean: Profile["schedule"] = {};
      for (const [day, entry] of Object.entries(schedule)) {
        if (entry && valid.has(entry.planId)) clean[day] = entry;
      }
      if (prof) await db.profile.update("me", { schedule: clean });
    }
  });
}

/** Restaura um backup completo, substituindo tudo que está no app. */
export async function restoreBackup(file: BackupFile) {
  const media: MediaItem[] = [];
  for (const m of file.media ?? []) {
    const { dataUrl, ...rest } = m;
    media.push({ ...rest, data: await dataUrlToBuffer(dataUrl) });
  }
  const now = Date.now();
  await db.transaction("rw", [db.profile, db.plans, db.exercises, db.sessions, db.bodyLogs, db.meals, db.foodDays, db.media], async () => {
    const keepProfile = await db.profile.get("me");
    await Promise.all([
      db.plans.clear(),
      db.exercises.clear(),
      db.sessions.clear(),
      db.bodyLogs.clear(),
      db.meals.clear(),
      db.foodDays.clear(),
      file.media ? db.media.clear() : Promise.resolve(),
    ]);
    if (file.profile) {
      const p = file.profile;
      await db.profile.put({
        ...p,
        id: "me",
        name: str(p.name),
        catName: str(p.catName, "Mimi"),
        catColor: p.catColor ?? "laranja",
        schedule: p.schedule && typeof p.schedule === "object" ? p.schedule : {},
        createdAt: num(p.createdAt, now),
        seedVersion: num(p.seedVersion, 1),
      });
    }
    else if (keepProfile) await db.profile.put(keepProfile);
    await db.exercises.bulkPut((file.exercises ?? []).map(normalizeExercise));
    await db.plans.bulkPut((file.plans ?? []).map((p, i) => normalizePlan(p, i, now)));
    await db.sessions.bulkPut((file.sessions ?? []).filter((s) => s && s.id && Array.isArray(s.exercises)));
    await db.bodyLogs.bulkPut((file.bodyLogs ?? []).filter((b) => b && b.id && b.date));
    await db.meals.bulkPut(
      (file.meals ?? [])
        .filter((m) => m && m.id && m.date && m.slot)
        .map((m) => ({ ...m, text: m.text ?? "", groups: Array.isArray(m.groups) ? m.groups : [] })),
    );
    await db.foodDays.bulkPut((file.foodDays ?? []).filter((d) => d && d.date).map((d) => ({ ...d, water: Number(d.water) || 0 })));
    if (media.length) await db.media.bulkPut(media);
  });
  await syncBuiltinExercises();
}

export async function wipeEverything() {
  await db.delete();
  window.location.reload();
}
