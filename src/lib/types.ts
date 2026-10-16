export type Muscle =
  | "quadriceps"
  | "gluteos"
  | "posterior"
  | "panturrilha"
  | "adutores"
  | "abdutores"
  | "costas"
  | "lombar"
  | "trapezio"
  | "peito"
  | "ombros"
  | "biceps"
  | "triceps"
  | "antebraco"
  | "abdomen"
  | "obliquos";

/** Como a série é medida: repetições, segundos (prancha) ou minutos (esteira). */
export type Measure = "reps" | "seconds" | "minutes";

export type Category = "forca" | "cardio" | "mobilidade";

/** Foto, GIF, vídeo ou link que ela mesma adicionou a um exercício. */
export type ExerciseMediaRef =
  | { id: string; kind: "upload"; mediaId: string; mime: string }
  | { id: string; kind: "url"; url: string };

export interface Exercise {
  id: string;
  name: string;
  muscles: Muscle[];
  secondary: Muscle[];
  equipment: string;
  category: Category;
  measure: Measure;
  weighted: boolean;
  /** Imagens das posições inicial e final (exercícios que já vêm no app). */
  frames: string[];
  steps: string[];
  tip?: string;
  media: ExerciseMediaRef[];
  /** Anotação dela: "banco na posição 4", "pegada aberta"... */
  myNote?: string;
  custom: boolean;
  updatedAt: number;
}

export interface PlanItem {
  id: string;
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
  loadKg?: number | null;
  perSide?: boolean;
  note?: string;
}

export type PlanColor = "sol" | "folha" | "pessego" | "ceu" | "lilas";

export interface Plan {
  id: string;
  name: string;
  subtitle: string;
  color: PlanColor;
  items: PlanItem[];
  note?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface SetLog {
  weight: number | null;
  value: number | null;
  done: boolean;
  doneAt?: number;
}

export interface SessionExercise {
  key: string;
  exerciseId: string;
  name: string;
  muscles: Muscle[];
  secondary: Muscle[];
  category: Category;
  measure: Measure;
  weighted: boolean;
  target: { sets: number; repsMin: number; repsMax: number; restSec: number; perSide?: boolean };
  note?: string;
  sets: SetLog[];
}

export interface Session {
  id: string;
  planId: string | null;
  planName: string;
  status: "active" | "done";
  startedAt: number;
  finishedAt?: number;
  exercises: SessionExercise[];
  feeling?: number;
  note?: string;
}

export interface BodyLog {
  id: string;
  /** AAAA-MM-DD */
  date: string;
  weightKg?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  thighCm?: number | null;
  armCm?: number | null;
  note?: string;
  createdAt: number;
}

export interface MediaItem {
  id: string;
  purpose: "exercise" | "progress" | "meal";
  exerciseId?: string;
  /** AAAA-MM-DD — usado nas fotos de progresso */
  date?: string;
  mime: string;
  /** Guardado como ArrayBuffer: o Safari do iPhone lida melhor com isso do que com Blob. */
  data: ArrayBuffer;
  note?: string;
  createdAt: number;
}

export type CatColor = "laranja" | "preto" | "cinza" | "branco" | "siames";

export interface ScheduleEntry {
  planId: string;
  optional?: boolean;
}

export interface Profile {
  id: "me";
  name: string;
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  catName: string;
  catColor: CatColor;
  /** chave = dia da semana (0 = domingo … 6 = sábado) */
  schedule: Partial<Record<string, ScheduleEntry>>;
  createdAt: number;
  seedVersion: number;
  installTipDismissed?: boolean;
  lastBackupAt?: number;
  /** meta de copos de água (250 ml) por dia */
  waterGoal?: number;
}

// ——— Alimentação ———

export type FoodGroup = "proteina" | "carbo" | "fruta" | "verdura" | "leite" | "doce";

export type MealSlot = "cafe" | "lanche_manha" | "almoco" | "pre" | "lanche_tarde" | "pos" | "jantar" | "ceia";

export interface MealEntry {
  id: string;
  /** AAAA-MM-DD */
  date: string;
  slot: MealSlot;
  text: string;
  groups: FoodGroup[];
  /** HH:MM */
  time?: string;
  mediaId?: string;
  createdAt: number;
}

export interface FoodDay {
  /** AAAA-MM-DD */
  date: string;
  water: number;
  note?: string;
}
