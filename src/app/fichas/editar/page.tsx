"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Minus, Plus, Repeat, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExercisePicker } from "@/components/ExercisePicker";
import { ExerciseThumb } from "@/components/media";
import {
  Button,
  Card,
  ConfirmSheet,
  cx,
  EmptyState,
  Field,
  IconButton,
  inputClass,
  NumberInput,
  PageHeader,
  PLAN_COLORS,
  Spinner,
  Toggle,
} from "@/components/ui";
import { db, uid } from "@/lib/db";
import { WEEKDAYS_SHORT } from "@/lib/dates";
import { useExerciseMap, useProfile } from "@/lib/hooks";
import type { Exercise, Plan, PlanColor, PlanItem, Profile } from "@/lib/types";

const REST_OPTIONS = [0, 15, 30, 45, 60, 75, 90, 120, 150, 180];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function Stepper({ value, onChange, min = 1, max = 10 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex h-12 items-center justify-between rounded-2xl border border-line bg-paper px-1">
      <IconButton label="Menos" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus size={18} />
      </IconButton>
      <span className="text-lg font-extrabold">{value}</span>
      <IconButton label="Mais" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus size={18} />
      </IconButton>
    </div>
  );
}

function newItem(ex: Exercise): PlanItem {
  if (ex.measure === "minutes") return { id: uid("item"), exerciseId: ex.id, sets: 1, repsMin: 15, repsMax: 20, restSec: 0 };
  if (ex.measure === "seconds") return { id: uid("item"), exerciseId: ex.id, sets: 2, repsMin: 30, repsMax: 30, restSec: 30 };
  return { id: uid("item"), exerciseId: ex.id, sets: 3, repsMin: 10, repsMax: 12, restSec: 60, loadKg: null };
}

function ItemEditor({
  item,
  exercise,
  index,
  count,
  onChange,
  onMove,
  onRemove,
  onSwap,
}: {
  item: PlanItem;
  exercise?: Exercise;
  index: number;
  count: number;
  onChange: (patch: Partial<PlanItem>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onSwap: () => void;
}) {
  const measure = exercise?.measure ?? "reps";
  const unit = measure === "reps" ? "Repetições" : measure === "seconds" ? "Segundos" : "Minutos";
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <ExerciseThumb exercise={exercise} size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-ink-3">#{index + 1}</p>
          <p className="truncate font-extrabold">{exercise?.name ?? "Exercício removido"}</p>
        </div>
        <IconButton label="Subir" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp size={18} />
        </IconButton>
        <IconButton label="Descer" disabled={index === count - 1} onClick={() => onMove(1)}>
          <ArrowDown size={18} />
        </IconButton>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label={measure === "minutes" ? "Vezes" : "Séries"}>{() => <Stepper value={item.sets} onChange={(sets) => onChange({ sets })} />}</Field>
        <Field label="Descanso">
          {(id) => (
            <select id={id} className={inputClass} value={item.restSec} onChange={(e) => onChange({ restSec: Number(e.target.value) })}>
              {REST_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 0 ? "sem descanso" : s < 60 ? `${s} seg` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60}s` : ""}`}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label={`${unit}: de`}>
          {(id) => (
            <NumberInput
              id={id}
              decimal={false}
              value={item.repsMin}
              onCommit={(n) => onChange({ repsMin: n ?? 1, repsMax: Math.max(n ?? 1, item.repsMax) })}
            />
          )}
        </Field>
        <Field label="até">
          {(id) => (
            <NumberInput
              id={id}
              decimal={false}
              value={item.repsMax}
              onCommit={(n) => onChange({ repsMax: Math.max(n ?? item.repsMin, item.repsMin) })}
            />
          )}
        </Field>
        {exercise?.weighted && (
          <Field label="Carga inicial (kg)" hint="opcional">
            {(id) => <NumberInput id={id} value={item.loadKg ?? null} placeholder="—" onCommit={(n) => onChange({ loadKg: n })} />}
          </Field>
        )}
        <div className={cx("flex items-center", !exercise?.weighted && "col-span-2")}>
          <Toggle checked={!!item.perSide} onChange={(perSide) => onChange({ perSide })} label="Cada lado" />
        </div>
      </div>

      <Field label="Observação" className="mt-3">
        {(id) => (
          <input
            id={id}
            className={inputClass}
            value={item.note ?? ""}
            placeholder="Ex.: banco na posição 4"
            onChange={(e) => onChange({ note: e.target.value || undefined })}
          />
        )}
      </Field>

      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={onSwap}>
          <Repeat size={15} /> Trocar
        </Button>
        <Button size="sm" variant="danger" onClick={onRemove}>
          <Trash2 size={15} /> Remover
        </Button>
      </div>
    </Card>
  );
}

function Editor({ initial, isNew, profile, exercises }: { initial: Plan; isNew: boolean; profile: Profile; exercises: Map<string, Exercise> }) {
  const router = useRouter();
  const [plan, setPlan] = useState(initial);
  const [days, setDays] = useState<number[]>(() =>
    Object.entries(profile.schedule)
      .filter(([, e]) => e?.planId === initial.id)
      .map(([d]) => Number(d)),
  );
  const [picker, setPicker] = useState<{ mode: "add" } | { mode: "swap"; itemId: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<Plan>) => setPlan((x) => ({ ...x, ...p }));
  const patchItem = (id: string, p: Partial<PlanItem>) => setPlan((x) => ({ ...x, items: x.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }));

  function move(index: number, dir: -1 | 1) {
    setPlan((x) => {
      const items = [...x.items];
      const [it] = items.splice(index, 1);
      items.splice(index + dir, 0, it);
      return { ...x, items };
    });
  }

  async function save() {
    setSaving(true);
    try {
      await db.transaction("rw", db.plans, db.profile, async () => {
        const order = isNew ? (await db.plans.toArray()).reduce((m, p) => Math.max(m, p.order + 1), 0) : plan.order;
        await db.plans.put({ ...plan, name: plan.name.trim() || "Ficha nova", subtitle: plan.subtitle.trim(), order, updatedAt: Date.now() });
        const prof = await db.profile.get("me");
        if (prof) {
          const schedule = { ...prof.schedule };
          for (let d = 0; d < 7; d++) {
            const key = String(d);
            const cur = schedule[key];
            if (days.includes(d)) {
              schedule[key] = { planId: plan.id, optional: cur?.planId === plan.id ? cur.optional : false };
            } else if (cur?.planId === plan.id) {
              delete schedule[key];
            }
          }
          await db.profile.update("me", { schedule });
        }
      });
      router.push("/fichas");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    await db.transaction("rw", db.plans, db.profile, async () => {
      await db.plans.delete(plan.id);
      const prof = await db.profile.get("me");
      if (prof) {
        const schedule = { ...prof.schedule };
        for (const [d, e] of Object.entries(schedule)) if (e?.planId === plan.id) delete schedule[d];
        await db.profile.update("me", { schedule });
      }
    });
    router.push("/fichas");
  }

  const takenBy = (d: number) => {
    const e = profile.schedule[String(d)];
    return e && e.planId !== plan.id ? e.planId : null;
  };

  return (
    <div>
      <PageHeader
        title={isNew ? "Nova ficha" : "Editar ficha"}
        back={
          <IconButton label="Voltar" onClick={() => router.back()} className="-ml-2 mt-1">
            <ArrowLeft size={22} />
          </IconButton>
        }
      />

      <Card className="mb-5 space-y-4 p-4">
        <Field label="Nome">{(id) => <input id={id} className={inputClass} value={plan.name} onChange={(e) => patch({ name: e.target.value })} />}</Field>
        <Field label="Foco (subtítulo)">
          {(id) => <input id={id} className={inputClass} value={plan.subtitle} placeholder="Ex.: Pernas & glúteos" onChange={(e) => patch({ subtitle: e.target.value })} />}
        </Field>
        <Field label="Cor">
          {() => (
            <div className="flex gap-2">
              {(Object.keys(PLAN_COLORS) as PlanColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={PLAN_COLORS[c].label}
                  onClick={() => patch({ color: c })}
                  className={cx("h-10 w-10 rounded-full border-2 transition", plan.color === c ? "scale-110 border-ink" : "border-transparent")}
                  style={{ background: PLAN_COLORS[c].strong }}
                />
              ))}
            </div>
          )}
        </Field>
        <Field label="Dias da semana" hint="Tocar num dia que já tem outra ficha troca pela essa.">
          {() => (
            <div className="grid grid-cols-7 gap-1">
              {DAY_ORDER.map((d) => {
                const on = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(on ? days.filter((x) => x !== d) : [...days, d])}
                    className={cx(
                      "h-11 rounded-2xl text-xs font-extrabold transition",
                      on ? "bg-sun text-on-sun" : takenBy(d) ? "bg-card-2 text-ink-3 line-through decoration-ink-3/40" : "bg-card-2 text-ink-2",
                    )}
                  >
                    {WEEKDAYS_SHORT[d]}
                  </button>
                );
              })}
            </div>
          )}
        </Field>
        <Field label="Observação da ficha">
          {(id) => (
            <textarea
              id={id}
              rows={3}
              className={cx(inputClass, "h-auto py-3")}
              value={plan.note ?? ""}
              placeholder="Ex.: aquecer 5 min na bicicleta"
              onChange={(e) => patch({ note: e.target.value || undefined })}
            />
          )}
        </Field>
      </Card>

      <h2 className="mb-2 text-lg font-extrabold">Exercícios ({plan.items.length})</h2>
      <div className="space-y-3">
        {plan.items.map((it, i) => (
          <ItemEditor
            key={it.id}
            item={it}
            exercise={exercises.get(it.exerciseId)}
            index={i}
            count={plan.items.length}
            onChange={(p) => patchItem(it.id, p)}
            onMove={(dir) => move(i, dir)}
            onRemove={() => patch({ items: plan.items.filter((x) => x.id !== it.id) })}
            onSwap={() => setPicker({ mode: "swap", itemId: it.id })}
          />
        ))}
      </div>
      <Button className="mt-3 w-full border-dashed" variant="outline" size="lg" onClick={() => setPicker({ mode: "add" })}>
        <Plus size={18} /> Adicionar exercício
      </Button>

      {!isNew && (
        <Button variant="danger" className="mt-8 w-full" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={16} /> Excluir ficha
        </Button>
      )}

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-4 pt-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button size="lg" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button size="lg" variant="sun" className="flex-1" disabled={saving} onClick={save}>
            Salvar ficha
          </Button>
        </div>
      </div>

      <ExercisePicker
        open={!!picker}
        title={picker?.mode === "swap" ? "Trocar por…" : "Adicionar exercício"}
        onClose={() => setPicker(null)}
        onPick={(ex) => {
          if (picker?.mode === "swap") {
            const fresh = newItem(ex);
            patchItem(picker.itemId, {
              exerciseId: ex.id,
              ...(exercises.get(plan.items.find((i) => i.id === picker.itemId)?.exerciseId ?? "")?.measure !== ex.measure
                ? { repsMin: fresh.repsMin, repsMax: fresh.repsMax, sets: fresh.sets, restSec: fresh.restSec }
                : {}),
              loadKg: null,
            });
          } else {
            patch({ items: [...plan.items, newItem(ex)] });
          }
          setPicker(null);
        }}
      />

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir ficha?"
        message="Os treinos que você já fez continuam no histórico."
        confirmLabel="Excluir"
        danger
        onConfirm={remove}
      />
    </div>
  );
}

function EditorLoader() {
  const params = useSearchParams();
  const id = params.get("id") ?? "nova";
  const isNew = id === "nova";
  const profile = useProfile();
  const exercises = useExerciseMap();
  const stored = useLiveQuery(async () => (isNew ? null : ((await db.plans.get(id)) ?? null)), [id, isNew]);
  const [fresh] = useState<Plan>(() => ({
    id: uid("ficha"),
    name: "",
    subtitle: "",
    color: "sol",
    items: [],
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  if (!profile || !exercises || stored === undefined) return <Spinner />;
  if (!isNew && !stored) return <EmptyState title="Ficha não encontrada" />;
  const initial = isNew ? fresh : stored!;
  return <Editor key={initial.id} initial={initial} isNew={isNew} profile={profile} exercises={exercises} />;
}

export default function EditarFichaPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <EditorLoader />
    </Suspense>
  );
}
