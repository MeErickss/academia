"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WEEKDAYS } from "@/lib/dates";
import { MUSCLE_LABEL } from "@/lib/muscles";
import { targetLabel } from "@/lib/stats";
import type { Exercise, Muscle, Plan, Profile } from "@/lib/types";
import { startWorkout } from "@/lib/workout";
import { ExerciseThumb } from "./media";
import { Button, Chip, PLAN_COLORS, Sheet } from "./ui";

export function estimateMinutes(plan: Plan, exercises: Map<string, Exercise>) {
  let sec = 5 * 60;
  for (const it of plan.items) {
    const ex = exercises.get(it.exerciseId);
    const sides = it.perSide ? 2 : 1;
    if (ex?.measure === "minutes") sec += it.repsMax * 60;
    else if (ex?.measure === "seconds") sec += it.sets * (it.repsMax * sides + it.restSec + 10);
    else sec += it.sets * (40 * sides + it.restSec) + 30;
  }
  return Math.max(10, Math.round(sec / 60 / 5) * 5);
}

export function planMuscles(plan: Plan, exercises: Map<string, Exercise>, max = 4): Muscle[] {
  const count = new Map<Muscle, number>();
  for (const it of plan.items) {
    const ex = exercises.get(it.exerciseId);
    if (!ex || ex.category !== "forca") continue;
    for (const m of ex.muscles) count.set(m, (count.get(m) ?? 0) + it.sets);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([m]) => m);
}

export function planDays(plan: Plan, profile: Profile) {
  return Object.entries(profile.schedule)
    .filter(([, e]) => e?.planId === plan.id)
    .map(([d, e]) => ({ day: Number(d), optional: !!e?.optional }))
    .sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));
}

export function useStartWorkout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return {
    busy,
    start: async (plan: Plan) => {
      setBusy(true);
      try {
        await startWorkout(plan);
        router.push("/treino");
      } finally {
        setBusy(false);
      }
    },
  };
}

/** Prévia da ficha antes de começar. */
export function PlanPreviewSheet({
  plan,
  exercises,
  profile,
  onClose,
}: {
  plan: Plan | null;
  exercises: Map<string, Exercise>;
  profile: Profile;
  onClose: () => void;
}) {
  const { busy, start } = useStartWorkout();
  if (!plan) return null;
  const color = PLAN_COLORS[plan.color] ?? PLAN_COLORS.sol;
  const days = planDays(plan, profile);
  return (
    <Sheet
      open={!!plan}
      onClose={onClose}
      title={
        <span>
          {plan.name}
          {plan.subtitle && <span className="block text-sm font-bold text-ink-2">{plan.subtitle}</span>}
        </span>
      }
      footer={
        <Button variant="sun" size="lg" className="w-full" disabled={busy} onClick={() => start(plan)}>
          <Play size={20} fill="currentColor" /> Começar treino
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip tone={color.tone}>~{estimateMinutes(plan, exercises)} min</Chip>
        <Chip tone={color.tone}>{plan.items.length} exercícios</Chip>
        {days.map((d) => (
          <Chip key={d.day} tone="plain">
            {WEEKDAYS[d.day]}
            {d.optional ? " (opcional)" : ""}
          </Chip>
        ))}
      </div>
      {plan.note && <p className="mb-3 rounded-2xl bg-sun-pale p-3 text-sm text-ink-2">{plan.note}</p>}
      <ul className="space-y-2">
        {plan.items.map((it) => {
          const ex = exercises.get(it.exerciseId);
          return (
            <li key={it.id}>
              <Link href={`/exercicio?id=${encodeURIComponent(it.exerciseId)}`} className="flex items-center gap-3 rounded-2xl p-1 active:bg-card-2">
                <ExerciseThumb exercise={ex} size={52} />
                <div className="min-w-0">
                  <p className="truncate font-bold">{ex?.name ?? "Exercício removido"}</p>
                  <p className="text-sm text-ink-2">{ex ? targetLabel(it, ex.measure) : ""}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

export function MuscleChips({ muscles, tone = "sun" }: { muscles: Muscle[]; tone?: "sun" | "leaf" | "peach" | "sky" | "lilac" | "plain" }) {
  return (
    <div className="flex flex-wrap gap-1">
      {muscles.map((m) => (
        <Chip key={m} tone={tone}>
          {MUSCLE_LABEL[m]}
        </Chip>
      ))}
    </div>
  );
}
