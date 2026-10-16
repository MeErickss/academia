"use client";

import { CloudDownload, Play, Settings, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Cat, Sunflower, SunflowerGoals } from "@/components/art";
import { InstallSteps } from "@/components/Onboarding";
import { estimateMinutes, MuscleChips, planMuscles, PlanPreviewSheet, useStartWorkout } from "@/components/plans";
import { Card, Chip, cx, PLAN_COLORS, SectionTitle, Spinner, washStyle } from "@/components/ui";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { dayGoals, DEFAULT_WATER_GOAL } from "@/lib/food";
import { addDays, dayKey, formatDate, greeting, startOfWeek, WEEKDAYS, WEEKDAYS_LETTER } from "@/lib/dates";
import { useActiveSession, useDoneSessions, useExerciseMap, useIsIOS, useIsStandalone, usePlans, useProfile } from "@/lib/hooks";
import { sessionsInWeek, weekStreak } from "@/lib/stats";
import type { Plan, Profile } from "@/lib/types";

const PHRASES = [
  "Cada série conta. Uma de cada vez 🌻",
  "Devagar e sempre — girassol também cresce aos pouquinhos.",
  "Postura primeiro, peso depois. Você tá indo muito bem!",
  "Treinar é um carinho que você faz pro seu corpo 💛",
  "O gatinho acredita em você. E eu também!",
  "Beba água, respire fundo e bora!",
  "Constância vale mais que perfeição ✨",
];

/** Resuminho da alimentação de hoje, com atalho pra página Comida. */
function FoodSummary({ profile }: { profile: Profile }) {
  const today = dayKey();
  const meals = useLiveQuery(() => db.meals.where("date").equals(today).toArray(), [today]);
  const day = useLiveQuery(async () => (await db.foodDays.get(today)) ?? null, [today]);
  if (!meals || day === undefined) return null;
  const goal = profile.waterGoal ?? DEFAULT_WATER_GOAL;
  const goals = dayGoals(meals, day?.water ?? 0, goal);
  const done = goals.filter((g) => g.done).length;
  return (
    <Link href="/comida" className="mb-5 flex items-center gap-3 rounded-3xl border border-line bg-card p-3 shadow-soft active:scale-[0.99]">
      <SunflowerGoals total={goals.length} done={done} size={58} />
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">Comida de hoje</span>
        <span className="block text-sm text-ink-2">
          {meals.length ? `${meals.length} ${meals.length === 1 ? "refeição" : "refeições"}` : "nada anotado ainda"} · 💧 {day?.water ?? 0}/{goal} copos
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-sun-pale px-3 py-1.5 text-sm font-extrabold text-ink">Anotar</span>
    </Link>
  );
}

function shortPlanLabel(plan: Plan) {
  const m = plan.name.match(/treino\s+(\S{1,2})$/i);
  return m ? m[1].toUpperCase() : plan.name.slice(0, 2);
}

function nextScheduled(profile: Profile, plans: Plan[], from: Date) {
  for (let i = 1; i <= 7; i++) {
    const d = addDays(from, i);
    const entry = profile.schedule[String(d.getDay())];
    const plan = entry && plans.find((p) => p.id === entry.planId);
    if (plan && !entry.optional) return { date: d, plan, inDays: i };
  }
  return null;
}

export default function HomePage() {
  const profile = useProfile();
  const plans = usePlans();
  const exercises = useExerciseMap();
  const sessions = useDoneSessions();
  const active = useActiveSession();
  const standalone = useIsStandalone();
  const ios = useIsIOS();
  const { busy, start } = useStartWorkout();
  const [preview, setPreview] = useState<Plan | null>(null);

  if (!profile || !plans || !exercises || !sessions) return <Spinner />;

  const now = new Date();
  const todayKey = dayKey(now);
  const weekStart = startOfWeek(now);
  const todayEntry = profile.schedule[String(now.getDay())];
  const todayPlan = todayEntry ? plans.find((p) => p.id === todayEntry.planId) : undefined;
  const doneToday = sessions.filter((s) => dayKey(s.startedAt) === todayKey);
  const next = nextScheduled(profile, plans, now);
  const weekSessions = sessionsInWeek(sessions, weekStart);
  const plannedThisWeek = Object.values(profile.schedule).filter((e) => e && !e.optional).length;
  const streak = weekStreak(sessions, now);
  const phrase = PHRASES[(now.getDate() + now.getMonth()) % PHRASES.length];
  const otherPlans = plans.filter((p) => p.id !== todayPlan?.id);
  const needsBackup =
    sessions.length >= 3 && (!profile.lastBackupAt || now.getTime() - profile.lastBackupAt > 14 * 86400000);

  return (
    <div>
      {/* Cabeçalho */}
      <header className="relative mb-4 flex items-start justify-between pt-2">
        <div>
          <p className="text-sm font-bold text-ink-3">
            {WEEKDAYS[now.getDay()]}, {formatDate(now)}
          </p>
          <h1 className="mt-1 font-hand text-[44px] font-bold leading-[0.95]">
            {greeting(now)}
            {profile.name ? "," : "!"}
            {profile.name && <span className="block text-sun-deep">{profile.name}!</span>}
          </h1>
          <p className="mt-2 max-w-[15rem] text-sm text-ink-2">{phrase}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <Link href="/ajustes" aria-label="Ajustes" className="-mr-1 flex h-10 w-10 items-center justify-center rounded-full text-ink-2 active:bg-card-2">
            <Settings size={22} />
          </Link>
          <Sunflower stem size={70} className="animate-sway -mr-1 -mt-1" />
        </div>
      </header>

      {/* Dica: instalar na Tela de Início */}
      {ios && !standalone && !profile.installTipDismissed && (
        <Card className="relative mb-4 p-4">
          <button
            type="button"
            aria-label="Fechar dica"
            onClick={() => db.profile.update("me", { installTipDismissed: true })}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-ink-3"
          >
            <X size={16} />
          </button>
          <p className="mb-1 pr-6 font-extrabold">Coloque o Girassol na Tela de Início</p>
          <p className="mb-3 text-sm text-ink-2">Ele vira um app e o iPhone guarda seus treinos com mais segurança.</p>
          <InstallSteps compact />
        </Card>
      )}

      {/* Semana */}
      <Card className="mb-4 px-2 py-3">
        <div className="grid grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(weekStart, i);
            const key = dayKey(d);
            const trained = sessions.some((s) => dayKey(s.startedAt) === key);
            const entry = profile.schedule[String(d.getDay())];
            const plan = entry && plans.find((p) => p.id === entry.planId);
            const isToday = key === todayKey;
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <span className={cx("text-[11px] font-bold", isToday ? "text-sun-deep" : "text-ink-3")}>{WEEKDAYS_LETTER[d.getDay()]}</span>
                <span
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold",
                    isToday && !trained && "ring-2 ring-sun",
                    trained ? "" : d < now && !isToday ? "text-ink-3" : "text-ink",
                  )}
                >
                  {trained ? <Sunflower size={34} /> : d.getDate()}
                </span>
                <span className="h-4 text-[10px] font-extrabold" style={{ color: plan ? PLAN_COLORS[plan.color].strong : undefined }}>
                  {plan ? `${shortPlanLabel(plan)}${entry?.optional ? "*" : ""}` : ""}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-center text-xs text-ink-3">
          {weekSessions.length === 0
            ? "Nenhum treino essa semana ainda."
            : `${weekSessions.length} ${weekSessions.length === 1 ? "treino" : "treinos"} essa semana${plannedThisWeek ? ` (meta: ${plannedThisWeek})` : ""} 🌻`}
        </p>
      </Card>

      {/* Treino de hoje */}
      {active ? (
        <Card className="mb-4 overflow-hidden p-5" style={washStyle("sol")}>
          <p className="text-sm font-bold text-sun-deep">Treino em andamento</p>
          <p className="mt-1 text-xl font-extrabold">{active.planName}</p>
          <Link href="/treino" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-sun font-extrabold text-on-sun shadow-soft">
            <Play size={18} fill="currentColor" /> Continuar treino
          </Link>
        </Card>
      ) : doneToday.length > 0 ? (
        <Card className="mb-4 flex items-center gap-4 overflow-hidden p-5" style={washStyle("folha")}>
          <Cat pose="happy" size={92} className="shrink-0" />
          <div>
            <p className="font-hand text-3xl font-bold leading-none">Treino feito!</p>
            <p className="mt-1 text-sm text-ink-2">
              Hoje você fez <b>{doneToday[0].planName}</b>. Agora é descansar, comer bem e dormir. {profile.catName} tá orgulhoso 💛
            </p>
          </div>
        </Card>
      ) : todayPlan ? (
        <Card className="mb-4 overflow-hidden p-5" style={washStyle(todayPlan.color)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-bold text-sun-deep">Seu treino de hoje</span>
                {todayEntry?.optional && <Chip tone="leaf">opcional e leve</Chip>}
              </div>
              <p className="text-2xl font-extrabold leading-tight">{todayPlan.name}</p>
              <p className="font-bold text-ink-2">{todayPlan.subtitle}</p>
              <p className="mt-1 text-sm text-ink-3">
                {todayPlan.items.length} exercícios · ~{estimateMinutes(todayPlan, exercises)} min
              </p>
            </div>
            <button
              type="button"
              aria-label="Começar treino"
              disabled={busy}
              onClick={() => start(todayPlan)}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sun text-on-sun shadow-soft active:scale-95"
            >
              <Play size={28} fill="currentColor" className="ml-1" />
            </button>
          </div>
          <div className="mt-3">
            <MuscleChips muscles={planMuscles(todayPlan, exercises)} tone={PLAN_COLORS[todayPlan.color].tone} />
          </div>
          <button type="button" onClick={() => setPreview(todayPlan)} className="mt-3 text-sm font-bold text-ink-2 underline decoration-sun decoration-2 underline-offset-4">
            Ver exercícios
          </button>
        </Card>
      ) : (
        <Card className="mb-4 flex items-center gap-3 overflow-hidden p-5" style={washStyle("ceu")}>
          <Cat pose="sleep" size={104} className="shrink-0" />
          <div>
            <p className="font-hand text-3xl font-bold leading-none">Hoje é descanso</p>
            <p className="mt-1 text-sm text-ink-2">
              Músculo cresce no descanso!
              {next && (
                <>
                  {" "}
                  Próximo: <b>{next.inDays === 1 ? "amanhã" : WEEKDAYS[next.date.getDay()].toLowerCase()}</b>, {next.plan.name}.
                </>
              )}
            </p>
          </div>
        </Card>
      )}

      {/* Outras fichas */}
      {otherPlans.length > 0 && (
        <section className="mb-5">
          <SectionTitle>{todayPlan || doneToday.length ? "Outras fichas" : "Quer treinar mesmo assim?"}</SectionTitle>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {otherPlans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreview(p)}
                className="w-44 shrink-0 rounded-3xl border border-line bg-card p-4 text-left shadow-soft active:scale-[0.98]"
                style={washStyle(p.color)}
              >
                <p className="font-extrabold">{p.name}</p>
                <p className="line-clamp-2 min-h-[2.5rem] text-sm text-ink-2">{p.subtitle}</p>
                <p className="mt-1 text-xs text-ink-3">{p.items.length} exercícios</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <FoodSummary profile={profile} />

      {/* Números */}
      <section className="mb-5 grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-extrabold">{weekSessions.length}</p>
          <p className="text-xs text-ink-3">essa semana</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-extrabold">{streak}</p>
          <p className="text-xs text-ink-3">{streak === 1 ? "semana seguida" : "semanas seguidas"}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-extrabold">{sessions.length}</p>
          <p className="text-xs text-ink-3">treinos no total</p>
        </Card>
      </section>

      {needsBackup && (
        <Card className="mb-5 flex items-center gap-3 p-4">
          <CloudDownload className="shrink-0 text-sun-deep" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Que tal salvar uma cópia?</p>
            <p className="text-sm text-ink-2">Seus treinos ficam só no celular. Exporte de vez em quando.</p>
          </div>
          <Link href="/ajustes#backup" className="flex h-9 shrink-0 items-center rounded-full bg-sun px-4 text-sm font-bold text-on-sun shadow-soft">
            Salvar
          </Link>
        </Card>
      )}

      <PlanPreviewSheet plan={preview} exercises={exercises} profile={profile} onClose={() => setPreview(null)} />
    </div>
  );
}
