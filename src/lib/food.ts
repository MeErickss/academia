import type { FoodGroup, MealEntry, MealSlot } from "./types";

/**
 * Alimentação pensada para uma adolescente que treina:
 * nada de contar calorias nem "comida proibida" — o foco é hábito
 * (comer bem distribuído, proteína, fruta, verdura, água e não treinar em jejum).
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

export const SLOTS: { id: MealSlot; label: string; emoji: string; training?: boolean }[] = [
  { id: "cafe", label: "Café da manhã", emoji: "☕" },
  { id: "lanche_manha", label: "Lanche da manhã", emoji: "🍎" },
  { id: "almoco", label: "Almoço", emoji: "🍛" },
  { id: "pre", label: "Antes do treino", emoji: "⚡", training: true },
  { id: "lanche_tarde", label: "Lanche da tarde", emoji: "🥪" },
  { id: "pos", label: "Depois do treino", emoji: "💪", training: true },
  { id: "jantar", label: "Jantar", emoji: "🍲" },
  { id: "ceia", label: "Ceia", emoji: "🌙" },
];

export const SLOT_INFO = Object.fromEntries(SLOTS.map((s) => [s.id, s])) as Record<MealSlot, (typeof SLOTS)[number]>;

/** Refeição mais provável pelo horário (para já vir escolhida). */
export function slotForTime(d = new Date(), trainingDay = false): MealSlot {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < 10) return "cafe";
  if (h < 11.5) return "lanche_manha";
  if (h < 14.5) return "almoco";
  if (h < 18.5) return trainingDay ? "pre" : "lanche_tarde";
  if (h < 22) return "jantar";
  return "ceia";
}

export interface Suggestion {
  text: string;
  emoji: string;
  groups: FoodGroup[];
}

export type SuggestionMoment = "cafe" | "lanche" | "refeicao" | "pre" | "pos" | "ceia";

export const MOMENTS: { id: SuggestionMoment; label: string; slot: MealSlot; hint: string }[] = [
  { id: "cafe", label: "Café", slot: "cafe", hint: "Comece o dia com energia — de preferência com uma proteína." },
  { id: "lanche", label: "Lanche", slot: "lanche_tarde", hint: "Lanche bom segura a fome até a próxima refeição." },
  { id: "refeicao", label: "Almoço/jantar", slot: "almoco", hint: "Metade do prato de salada e legumes, ¼ de proteína e ¼ de carboidrato." },
  { id: "pre", label: "Pré-treino", slot: "pre", hint: "1 a 2 horas antes. Algo leve com carboidrato — treinar em jejum pode dar tontura." },
  { id: "pos", label: "Pós-treino", slot: "pos", hint: "Até umas 2 horas depois. Proteína + carboidrato ajudam o músculo a se recuperar." },
  { id: "ceia", label: "Ceia", slot: "ceia", hint: "Se der fome antes de dormir, algo leve." },
];

export const SUGGESTIONS: Record<SuggestionMoment, Suggestion[]> = {
  cafe: [
    { text: "Pão francês com ovo mexido e uma fruta", emoji: "🍳", groups: ["carbo", "proteina", "fruta"] },
    { text: "Iogurte com granola e banana", emoji: "🥣", groups: ["leite", "carbo", "fruta"] },
    { text: "Tapioca com queijo e mamão", emoji: "🫓", groups: ["carbo", "leite", "fruta"] },
    { text: "Vitamina de banana com aveia", emoji: "🥤", groups: ["leite", "fruta", "carbo"] },
    { text: "Cuscuz com ovo", emoji: "🌽", groups: ["carbo", "proteina"] },
    { text: "Pão integral com pasta de amendoim e morango", emoji: "🥜", groups: ["carbo", "proteina", "fruta"] },
  ],
  lanche: [
    { text: "Fruta + punhado de castanhas", emoji: "🍌", groups: ["fruta"] },
    { text: "Iogurte com mel", emoji: "🍯", groups: ["leite"] },
    { text: "Sanduíche de queijo branco e tomate", emoji: "🥪", groups: ["carbo", "leite", "verdura"] },
    { text: "Ovo cozido + fruta", emoji: "🥚", groups: ["proteina", "fruta"] },
    { text: "Pipoca feita em casa", emoji: "🍿", groups: ["carbo"] },
    { text: "Biscoito de arroz com pasta de amendoim", emoji: "🍘", groups: ["carbo", "proteina"] },
  ],
  refeicao: [
    { text: "Arroz, feijão, frango grelhado e salada", emoji: "🍛", groups: ["carbo", "proteina", "verdura"] },
    { text: "Macarrão com carne moída e legumes", emoji: "🍝", groups: ["carbo", "proteina", "verdura"] },
    { text: "Omelete com legumes e arroz", emoji: "🍳", groups: ["proteina", "verdura", "carbo"] },
    { text: "Peixe, batata e brócolis", emoji: "🐟", groups: ["proteina", "carbo", "verdura"] },
    { text: "Wrap de frango com alface e tomate", emoji: "🌯", groups: ["proteina", "carbo", "verdura"] },
    { text: "Strogonoff de frango, arroz e salada", emoji: "🍲", groups: ["proteina", "carbo", "verdura"] },
  ],
  pre: [
    { text: "Banana com aveia e mel", emoji: "🍌", groups: ["fruta", "carbo"] },
    { text: "Pão com queijo e um suco", emoji: "🥪", groups: ["carbo", "leite"] },
    { text: "Tapioca com banana", emoji: "🫓", groups: ["carbo", "fruta"] },
    { text: "Iogurte com fruta", emoji: "🍓", groups: ["leite", "fruta"] },
  ],
  pos: [
    { text: "Arroz, feijão, proteína e salada", emoji: "🍛", groups: ["carbo", "proteina", "verdura"] },
    { text: "Vitamina de banana com leite e aveia", emoji: "🥤", groups: ["leite", "fruta", "carbo"] },
    { text: "Sanduíche de frango", emoji: "🥪", groups: ["proteina", "carbo"] },
    { text: "Ovos mexidos com pão", emoji: "🍳", groups: ["proteina", "carbo"] },
  ],
  ceia: [
    { text: "Copo de leite morno ou iogurte", emoji: "🥛", groups: ["leite"] },
    { text: "Uma fruta", emoji: "🍎", groups: ["fruta"] },
    { text: "Torrada com queijo", emoji: "🧀", groups: ["carbo", "leite"] },
  ],
};

export const FOOD_TIPS = [
  "Monte o prato: metade salada e legumes, ¼ proteína (frango, carne, ovo, peixe, feijão) e ¼ carboidrato (arroz, batata, macarrão).",
  "Proteína nas refeições principais ajuda o músculo a se recuperar do treino.",
  "Nos dias de treino, coma algo 1–2 horas antes. Treinar em jejum pode dar tontura e fraqueza.",
  "Carboidrato não é vilão: é a energia do treino 💛",
  "Leve a garrafinha de água pro treino e pra escola.",
  "Docinho também faz parte da vida. Equilíbrio vale mais que perfeição.",
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

export function dayGoals(meals: MealEntry[], water: number, waterGoal: number, trainingDay: boolean): DayGoal[] {
  const count = (g: FoodGroup) => meals.filter((m) => m.groups.includes(g)).length;
  const has = (s: MealSlot) => meals.some((m) => m.slot === s);
  const goals: DayGoal[] = [
    { id: "agua", label: "Água", done: water >= waterGoal, detail: `${water}/${waterGoal} copos` },
    { id: "cafe", label: "Café da manhã", done: has("cafe"), detail: has("cafe") ? "feito" : "ainda não" },
    { id: "proteina", label: "Proteína", done: count("proteina") >= 3, detail: `${count("proteina")}/3` },
    { id: "fruta", label: "Frutas", done: count("fruta") >= 2, detail: `${count("fruta")}/2` },
    { id: "verdura", label: "Verduras e legumes", done: count("verdura") >= 2, detail: `${count("verdura")}/2` },
    { id: "leite", label: "Leite/iogurte/queijo", done: count("leite") >= 1, detail: `${count("leite")}/1` },
  ];
  if (trainingDay) {
    goals.push({ id: "pre", label: "Pré-treino", done: has("pre"), detail: has("pre") ? "feito" : "ainda não" });
    goals.push({ id: "pos", label: "Pós-treino", done: has("pos"), detail: has("pos") ? "feito" : "ainda não" });
  }
  return goals;
}

export const DEFAULT_WATER_GOAL = 8;
