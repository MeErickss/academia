import type { Plan, PlanItem, Profile } from "./types";

/**
 * Ficha inicial, montada para:
 * 17 anos, ~65 kg, ~1,73 m, começando agora na musculação.
 * Treinos: terça (A), quinta (B), sexta (C) e quarta opcional e leve (D).
 *
 * Ideia geral:
 * - 6 a 7 exercícios por treino, 2 a 3 séries, 8 a 15 repetições.
 * - Carga que deixe 2–3 repetições "sobrando" (sem ir à falha no começo).
 * - Quando fizer todas as séries no número máximo de repetições com boa
 *   postura, sobe um pouquinho a carga (o app avisa).
 * - Terça e sexta são de perna/glúteo, com 3 dias de intervalo entre elas;
 *   quinta é de parte de cima, então quinta → sexta não repete músculo.
 */

let n = 0;
const item = (
  exerciseId: string,
  sets: number,
  repsMin: number,
  repsMax: number,
  restSec: number,
  extra: Partial<PlanItem> = {},
): PlanItem => ({
  id: `item-${++n}`,
  exerciseId,
  sets,
  repsMin,
  repsMax,
  restSec,
  loadKg: null,
  ...extra,
});

export function defaultPlans(now = Date.now()): Plan[] {
  n = 0;
  return [
    {
      id: "treino-a",
      name: "Treino A",
      subtitle: "Pernas & glúteos",
      color: "sol",
      order: 0,
      createdAt: now,
      updatedAt: now,
      note: "Aquecimento: 5 min de bicicleta ou esteira + 1 série bem leve do agachamento. Descanse o tempo indicado entre as séries.",
      items: [
        item("goblet-squat", 3, 10, 12, 90, { note: "Comece com um halter leve (4–8 kg) e capriche na postura." }),
        item("leg-press", 3, 10, 12, 90),
        item("barbell-hip-thrust", 3, 10, 12, 90, {
          note: "Se a academia tiver máquina de elevação pélvica, pode usar. Na barra, use a espuma.",
        }),
        item("leg-extensions", 3, 12, 15, 60),
        item("thigh-abductor", 3, 15, 20, 60),
        item("plank", 3, 20, 30, 45),
      ],
    },
    {
      id: "treino-b",
      name: "Treino B",
      subtitle: "Costas, peito & braços",
      color: "ceu",
      order: 1,
      createdAt: now,
      updatedAt: now,
      note: "Aquecimento: 5 min de elíptico ou bicicleta + 1 série leve da puxada. Movimentos controlados: uns 2 segundos para voltar.",
      items: [
        item("wide-grip-lat-pulldown", 3, 10, 12, 75),
        item("seated-cable-rows", 3, 10, 12, 75),
        item("leverage-chest-press", 3, 10, 12, 75),
        item("dumbbell-shoulder-press", 3, 10, 12, 75, { note: "Halteres leves no começo (2–4 kg)." }),
        item("side-lateral-raise", 3, 12, 15, 60),
        item("dumbbell-alternate-bicep-curl", 2, 10, 12, 60),
        item("triceps-pushdown-rope-attachment", 2, 10, 12, 60),
      ],
    },
    {
      id: "treino-c",
      name: "Treino C",
      subtitle: "Glúteos & posterior",
      color: "pessego",
      order: 2,
      createdAt: now,
      updatedAt: now,
      note: "Aquecimento: 5 min de bicicleta + 10 pontes de glúteo no chão. No stiff, costas sempre retas!",
      items: [
        item("stiff-legged-dumbbell-deadlift", 3, 10, 12, 90),
        item("split-squat-with-dumbbells", 3, 8, 10, 75, {
          perSide: true,
          note: "Nas primeiras vezes pode fazer sem peso, só pegando o equilíbrio.",
        }),
        item("lying-leg-curls", 3, 10, 12, 60),
        item("one-legged-cable-kickback", 3, 12, 12, 45, { perSide: true }),
        item("standing-calf-raises", 3, 12, 15, 45),
        item("dead-bug", 3, 8, 10, 45, { perSide: true }),
      ],
    },
    {
      id: "treino-d",
      name: "Treino D",
      subtitle: "Leve: cardio, abdômen & alongamento",
      color: "folha",
      order: 3,
      createdAt: now,
      updatedAt: now,
      note: "Treino leve e opcional (quarta). A ideia é sair melhor do que entrou, não cansada.",
      items: [
        item("bicycling-stationary", 1, 15, 20, 0, { note: "Ou esteira/elíptico — o que estiver livre." }),
        item("butt-lift-bridge", 2, 15, 15, 45),
        item("cat-stretch", 2, 8, 10, 30),
        item("side-bridge", 2, 15, 20, 30, { perSide: true }),
        item("reverse-crunch", 2, 10, 12, 45),
        item("kneeling-hip-flexor", 2, 30, 30, 15, { perSide: true }),
        item("hamstring-stretch", 2, 30, 30, 15, { perSide: true }),
      ],
    },
  ];
}

export const DEFAULT_SCHEDULE: Profile["schedule"] = {
  "2": { planId: "treino-a" },
  "3": { planId: "treino-d", optional: true },
  "4": { planId: "treino-b" },
  "5": { planId: "treino-c" },
};
