"use client";

import { ChevronDown, Copy, MoreHorizontal, Pencil, Play, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Paw } from "@/components/art";
import { ExerciseThumb } from "@/components/media";
import { MuscleChips, planDays, useStartWorkout } from "@/components/plans";
import { Button, Card, Chip, ConfirmSheet, cx, EmptyState, PageHeader, PLAN_COLORS, Sheet, Spinner, washStyle } from "@/components/ui";
import { db, uid } from "@/lib/db";
import { WEEKDAYS_SHORT } from "@/lib/dates";
import { useExerciseMap, usePlans, useProfile } from "@/lib/hooks";
import { defaultPlans } from "@/lib/seed";
import { fmt, targetLabel } from "@/lib/stats";
import type { Plan } from "@/lib/types";

const GUIDE = [
  ["Aqueça", "5 minutinhos de bicicleta ou esteira e uma série leve do primeiro exercício."],
  ["Carga certa", "Escolha um peso em que as últimas 2 ou 3 repetições fiquem difíceis, mas sem perder a postura."],
  ["Descanse", "Entre as séries, descanse o tempo da ficha (o app conta pra você)."],
  ["Subindo o peso", "Fez todas as séries no número máximo de repetições? Na próxima, aumente um pouquinho (1–2 kg). O app avisa 🌻"],
  ["Respiração", "Solte o ar na parte difícil do movimento. Nunca prenda a respiração."],
  ["Dor x esforço", "Queimação no músculo é normal. Dor pontuda, na articulação ou que não passa: pare e fale com o professor."],
  ["Peça ajuda", "Nas primeiras semanas, peça pro professor da academia olhar sua execução. Ninguém nasce sabendo!"],
];

function GuideCard() {
  const [open, setOpen] = useState(false);
  return (
    <Card className="mb-5 overflow-hidden" style={washStyle("folha")}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <Paw size={26} className="shrink-0 text-sun-deep" />
        <span className="flex-1">
          <span className="block font-extrabold">Como usar sua ficha</span>
          <span className="block text-sm text-ink-2">7 dicas rápidas pra quem está começando</span>
        </span>
        <ChevronDown className={cx("text-ink-3 transition", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="space-y-3 px-4 pb-4">
          {GUIDE.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sun text-xs font-extrabold text-on-sun">{i + 1}</span>
              <p className="text-sm text-ink-2">
                <b className="text-ink">{t}:</b> {d}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function FichasPage() {
  const router = useRouter();
  const plans = usePlans();
  const exercises = useExerciseMap();
  const profile = useProfile();
  const { busy, start } = useStartWorkout();
  const [menu, setMenu] = useState<Plan | null>(null);
  const [toDelete, setToDelete] = useState<Plan | null>(null);

  if (!plans || !exercises || !profile) return <Spinner />;

  async function duplicate(p: Plan) {
    const copy: Plan = {
      ...p,
      id: uid("ficha"),
      name: `${p.name} (cópia)`,
      order: plans!.reduce((m, x) => Math.max(m, x.order + 1), 0),
      items: p.items.map((i) => ({ ...i, id: uid("item") })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.plans.add(copy);
    setMenu(null);
  }

  async function remove(p: Plan) {
    await db.transaction("rw", db.plans, db.profile, async () => {
      await db.plans.delete(p.id);
      const prof = await db.profile.get("me");
      if (prof) {
        const schedule = { ...prof.schedule };
        for (const [d, e] of Object.entries(schedule)) if (e?.planId === p.id) delete schedule[d];
        await db.profile.update("me", { schedule });
      }
    });
    setToDelete(null);
  }

  async function restoreDefaults() {
    const now = Date.now();
    const existing = new Set(plans!.map((p) => p.id));
    await db.plans.bulkPut(defaultPlans(now).filter((p) => !existing.has(p.id)));
  }

  return (
    <div>
      <PageHeader
        title="Fichas"
        subtitle="Seus treinos montados"
        action={
          <Button variant="sun" onClick={() => router.push("/fichas/editar?id=nova")}>
            <Plus size={18} /> Nova
          </Button>
        }
      />

      <GuideCard />

      {plans.length === 0 && (
        <EmptyState title="Nenhuma ficha ainda">
          <p>Crie uma ficha nova ou recupere as que vieram no app.</p>
          <Button className="mt-4" onClick={restoreDefaults}>
            Recuperar fichas sugeridas
          </Button>
        </EmptyState>
      )}

      <div className="space-y-5">
        {plans.map((p) => {
          const color = PLAN_COLORS[p.color] ?? PLAN_COLORS.sol;
          const days = planDays(p, profile);
          const muscles = [...new Set(p.items.flatMap((i) => exercises.get(i.exerciseId)?.muscles ?? []))].slice(0, 5);
          return (
            <Card key={p.id} className="overflow-hidden">
              <div className="p-4 pb-3" style={washStyle(p.color)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold leading-tight">{p.name}</h2>
                    {p.subtitle && <p className="font-bold text-ink-2">{p.subtitle}</p>}
                  </div>
                  <button
                    type="button"
                    aria-label="Mais opções"
                    onClick={() => setMenu(p)}
                    className="-mr-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full text-ink-2 active:bg-card-2"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {days.map((d) => (
                    <Chip key={d.day} tone={color.tone}>
                      {WEEKDAYS_SHORT[d.day]}
                      {d.optional ? " · opcional" : ""}
                    </Chip>
                  ))}
                  {!days.length && <Chip tone="plain">sem dia fixo</Chip>}
                </div>
                {muscles.length > 0 && (
                  <div className="mt-2">
                    <MuscleChips muscles={muscles} tone="plain" />
                  </div>
                )}
              </div>

              <ul className="divide-y divide-line px-4">
                {p.items.map((it) => {
                  const ex = exercises.get(it.exerciseId);
                  return (
                    <li key={it.id}>
                      <Link href={`/exercicio?id=${encodeURIComponent(it.exerciseId)}`} className="flex items-center gap-3 py-2.5 active:opacity-70">
                        <ExerciseThumb exercise={ex} size={52} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{ex?.name ?? "Exercício removido"}</p>
                          <p className="text-sm text-ink-2">
                            {ex ? targetLabel(it, ex.measure) : ""}
                            {it.loadKg ? ` · ${fmt(it.loadKg)} kg` : ""}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {p.note && <p className="mx-4 mb-1 mt-2 rounded-2xl bg-sun-pale p-3 text-sm text-ink-2">🌻 {p.note}</p>}

              <div className="flex gap-2 p-4">
                <Button variant="sun" className="flex-1" disabled={busy || !p.items.length} onClick={() => start(p)}>
                  <Play size={16} fill="currentColor" /> Começar
                </Button>
                <Button onClick={() => router.push(`/fichas/editar?id=${encodeURIComponent(p.id)}`)}>
                  <Pencil size={16} /> Editar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name}>
        <div className="space-y-2">
          <Button className="w-full justify-start" onClick={() => menu && router.push(`/fichas/editar?id=${encodeURIComponent(menu.id)}`)}>
            <Pencil size={18} /> Editar ficha
          </Button>
          <Button className="w-full justify-start" onClick={() => menu && duplicate(menu)}>
            <Copy size={18} /> Duplicar
          </Button>
          <Button
            variant="danger"
            className="w-full justify-start"
            onClick={() => {
              setToDelete(menu);
              setMenu(null);
            }}
          >
            <Trash2 size={18} /> Excluir ficha
          </Button>
        </div>
      </Sheet>

      <ConfirmSheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Excluir ficha?"
        message={
          <>
            A ficha <b>{toDelete?.name}</b> vai sumir. Os treinos que você já fez com ela continuam no histórico.
          </>
        }
        confirmLabel="Excluir"
        danger
        onConfirm={() => (toDelete ? remove(toDelete) : undefined)}
      />
    </div>
  );
}
