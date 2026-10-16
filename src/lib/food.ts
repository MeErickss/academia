import type { FoodGroup, MealEntry, MealSlot } from "./types";

/**
 * Alimentação pensada para a rotina dela: dia corrido, no máximo
 * 4 refeições (almoço, pós-almoço, janta e às vezes algo depois da janta)
 * e comida simples, sem nada complicado. Nada de contar calorias nem
 * "comida proibida" — o foco é hábito.
 */

export const GROUPS: { id: FoodGroup; label: string; emoji: string }[] = [
  { id: "proteina", label: "Proteína", emoji: "🍗" },
  { id: "carbo", label: "Carboidrato", emoji: "🍚" },
  { id: "fruta", label: "Fruta", emoji: "🍓" },
  { id: "verdura", label: "Verdura/legume", emoji: "🥦" },
  { id: "leite", label: "Leite/iogurte/queijo", emoji: "🥛" },
  { id: "doce", label: "Docinho", emoji: "🍫" },
];

export const GROUP_INFO = Object.fromEntries(GROUPS.map((g) => [g.id, g])) as Record<FoodGroup, (typeof GROUPS)[number]>;

/**
 * As 4 refeições do dia dela vêm primeiro; as outras ficam escondidas
 * em "outro horário" (e aparecem só se ela usar).
 */
export const SLOTS: { id: MealSlot; label: string; emoji: string; main?: boolean }[] = [
  { id: "almoco", label: "Almoço", emoji: "🍛", main: true },
  { id: "lanche_tarde", label: "Pós-almoço", emoji: "🍌", main: true },
  { id: "jantar", label: "Janta", emoji: "🍲", main: true },
  { id: "ceia", label: "Depois da janta", emoji: "🌙", main: true },
  { id: "cafe", label: "Café da manhã", emoji: "☕" },
  { id: "lanche_manha", label: "Lanche da manhã", emoji: "🍎" },
  { id: "pre", label: "Antes do treino", emoji: "⚡" },
  { id: "pos", label: "Depois do treino", emoji: "💪" },
];

export const SLOT_INFO = Object.fromEntries(SLOTS.map((s) => [s.id, s])) as Record<MealSlot, (typeof SLOTS)[number]>;

/** Refeição mais provável pelo horário (para já vir escolhida). */
export function slotForTime(d = new Date()): MealSlot {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < 10.5) return "cafe";
  if (h < 15) return "almoco";
  if (h < 18.5) return "lanche_tarde";
  if (h < 21.5) return "jantar";
  return "ceia";
}

/** Nos dias de treino, o pós-almoço vira pré-treino e a janta vira pós-treino. */
export const TRAINING_ROLE: Partial<Record<MealSlot, string>> = {
  lanche_tarde: "pré-treino",
  jantar: "pós-treino",
};

export interface Suggestion {
  text: string;
  emoji: string;
  groups: FoodGroup[];
}

export type SuggestionMoment = "almoco" | "pos_almoco" | "janta" | "depois";

export const MOMENTS: { id: SuggestionMoment; label: string; slot: MealSlot; hint: string; trainingHint?: string }[] = [
  {
    id: "almoco",
    label: "Almoço",
    slot: "almoco",
    hint: "Prato simples já resolve: arroz, feijão, uma proteína (ovo vale!) e algo verde.",
  },
  {
    id: "pos_almoco",
    label: "Pós-almoço",
    slot: "lanche_tarde",
    hint: "Lanche rápido, fácil de levar na bolsa.",
    trainingHint: "Hoje tem treino: esse lanche é o seu pré-treino. Não vá treinar de estômago vazio!",
  },
  {
    id: "janta",
    label: "Janta",
    slot: "jantar",
    hint: "Pode ser bem simples — o importante é ter uma proteína.",
    trainingHint: "Hoje tem treino: a janta é o seu pós-treino. Capricha na proteína (ovo, frango, carne).",
  },
  {
    id: "depois",
    label: "Depois da janta",
    slot: "ceia",
    hint: "Só se der fome — algo leve.",
  },
];

export const SUGGESTIONS: Record<SuggestionMoment, Suggestion[]> = {
  almoco: [
    { text: "Arroz, feijão, uma carne e salada", emoji: "🍛", groups: ["carbo", "proteina", "verdura"] },
    { text: "Arroz, feijão e 2 ovos cozidos com tomate", emoji: "🥚", groups: ["carbo", "proteina", "verdura"] },
    { text: "Macarrão com frango desfiado", emoji: "🍝", groups: ["carbo", "proteina"] },
    { text: "Marmita: arroz, frango e legumes", emoji: "🍱", groups: ["carbo", "proteina", "verdura"] },
    { text: "Sanduíche de frango ou atum (dia sem tempo)", emoji: "🥪", groups: ["carbo", "proteina"] },
  ],
  pos_almoco: [
    { text: "2 ovos cozidos e uma fruta", emoji: "🥚", groups: ["proteina", "fruta"] },
    { text: "Banana com aveia", emoji: "🍌", groups: ["fruta", "carbo"] },
    { text: "Iogurte com fruta", emoji: "🍓", groups: ["leite", "fruta"] },
    { text: "Pão com queijo", emoji: "🧀", groups: ["carbo", "leite"] },
    { text: "Fruta e um punhado de amendoim ou castanha", emoji: "🥜", groups: ["fruta"] },
    { text: "Biscoito de arroz com pasta de amendoim", emoji: "🍘", groups: ["carbo", "proteina"] },
  ],
  janta: [
    { text: "Arroz, feijão, ovo cozido e salada", emoji: "🥚", groups: ["carbo", "proteina", "verdura"] },
    { text: "Ovos mexidos com pão ou tapioca", emoji: "🍳", groups: ["proteina", "carbo"] },
    { text: "O que sobrou do almoço (vale muito!)", emoji: "🍲", groups: ["carbo", "proteina"] },
    { text: "Cuscuz com ovo", emoji: "🌽", groups: ["carbo", "proteina"] },
    { text: "Sanduíche de frango com alface e tomate", emoji: "🥪", groups: ["proteina", "carbo", "verdura"] },
  ],
  depois: [
    { text: "Iogurte", emoji: "🥛", groups: ["leite"] },
    { text: "Uma fruta", emoji: "🍎", groups: ["fruta"] },
    { text: "Copo de leite", emoji: "🥛", groups: ["leite"] },
    { text: "Ovo cozido", emoji: "🥚", groups: ["proteina"] },
  ],
};

/** Atalhos de um toque para o que ela come sempre. */
export interface QuickItem {
  id: string;
  emoji: string;
  label: string;
  one: string;
  many: (n: number) => string;
  groups: FoodGroup[];
}

export const QUICK_ITEMS: QuickItem[] = [
  { id: "ovo", emoji: "🥚", label: "Ovo cozido", one: "Ovo cozido", many: (n) => `${n} ovos cozidos`, groups: ["proteina"] },
  { id: "fruta", emoji: "🍌", label: "Fruta", one: "Uma fruta", many: (n) => `${n} frutas`, groups: ["fruta"] },
  { id: "iogurte", emoji: "🥛", label: "Iogurte/leite", one: "Iogurte ou leite", many: (n) => `${n}× iogurte ou leite`, groups: ["leite"] },
  { id: "salada", emoji: "🥗", label: "Salada", one: "Salada", many: (n) => `Salada (${n}×)`, groups: ["verdura"] },
];

export const FOOD_TIPS = [
  "Ovo cozido é um ótimo aliado: proteína barata, prática e fácil de levar. Pode comer todo dia 🥚",
  "Cozinhe vários ovos de uma vez: com casca, eles duram até 1 semana na geladeira.",
  "Com poucas refeições no dia, capriche nelas: uma proteína no almoço e outra na janta.",
  "Fruta é o lanche mais fácil de levar na bolsa.",
  "Nos dias de treino, coma alguma coisa umas 1–2 horas antes. Treinar com fome pode dar tontura.",
  "Carboidrato não é vilão: é a energia do treino 💛",
  "Leve a garrafinha de água pra todo lado.",
  "Docinho também faz parte. Equilíbrio vale mais que perfeição.",
  "Com 17 anos o corpo ainda está crescendo — comer bem é tão importante quanto treinar.",
  "Quer um plano certinho pra você? Uma nutricionista pode montar.",
];

// ——— Metas do dia (as pétalas do girassol) ———

export interface DayGoal {
  id: string;
  label: string;
  done: boolean;
  detail: string;
}

/** Metas possíveis num dia corrido. Conta refeições (horários), não quantidade de comida. */
export function dayGoals(meals: MealEntry[], water: number, waterGoal: number): DayGoal[] {
  const slotsWith = (g?: FoodGroup) => new Set(meals.filter((m) => !g || m.groups.includes(g)).map((m) => m.slot)).size;
  const meals3 = slotsWith();
  const protein = slotsWith("proteina");
  const fruit = slotsWith("fruta");
  const veg = slotsWith("verdura");
  return [
    { id: "agua", label: "Água", done: water >= waterGoal, detail: `${water}/${waterGoal} copos` },
    { id: "refeicoes", label: "Comeu 3 vezes", done: meals3 >= 3, detail: `${meals3}/3` },
    { id: "proteina", label: "Proteína", done: protein >= 2, detail: `${protein}/2` },
    { id: "fruta", label: "Fruta", done: fruit >= 1, detail: fruit ? "feito" : "ainda não" },
    { id: "verdura", label: "Verdura ou legume", done: veg >= 1, detail: veg ? "feito" : "ainda não" },
  ];
}

export const DEFAULT_WATER_GOAL = 8;
