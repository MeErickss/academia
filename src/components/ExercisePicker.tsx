"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { CATEGORY_LABEL } from "@/lib/catalog";
import { db, uid } from "@/lib/db";
import { useExercises } from "@/lib/hooks";
import { ALL_MUSCLES, MUSCLE_LABEL } from "@/lib/muscles";
import type { Category, Exercise, Measure, Muscle } from "@/lib/types";
import { ExerciseThumb } from "./media";
import { Button, Chip, cx, Field, inputClass, Segmented, Sheet, Toggle } from "./ui";

const GROUPS: { id: string; label: string; test: (e: Exercise) => boolean }[] = [
  { id: "todos", label: "Todos", test: () => true },
  { id: "pernas", label: "Pernas e glúteos", test: (e) => e.category === "forca" && e.muscles.some((m) => ["quadriceps", "gluteos", "posterior", "panturrilha", "adutores", "abdutores"].includes(m)) },
  { id: "costas", label: "Costas", test: (e) => e.muscles.some((m) => ["costas", "lombar", "trapezio"].includes(m)) },
  { id: "peito", label: "Peito", test: (e) => e.muscles.includes("peito") },
  { id: "ombros", label: "Ombros", test: (e) => e.muscles.includes("ombros") },
  { id: "bracos", label: "Braços", test: (e) => e.muscles.some((m) => ["biceps", "triceps", "antebraco"].includes(m)) },
  { id: "abdomen", label: "Abdômen", test: (e) => e.muscles.some((m) => ["abdomen", "obliquos"].includes(m)) },
  { id: "cardio", label: "Cardio", test: (e) => e.category === "cardio" },
  { id: "mobilidade", label: "Alongamento", test: (e) => e.category === "mobilidade" },
  { id: "meus", label: "Criados por mim", test: (e) => e.custom },
];

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ExercisePicker({ open, onClose, onPick, title = "Escolher exercício" }: { open: boolean; onClose: () => void; onPick: (e: Exercise) => void; title?: string }) {
  const exercises = useExercises();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("todos");
  const [creating, setCreating] = useState(false);

  const g = GROUPS.find((x) => x.id === group) ?? GROUPS[0];
  const list = (exercises ?? [])
    .filter((e) => g.test(e))
    .filter((e) => !q || normalize(`${e.name} ${e.equipment} ${e.muscles.map((m) => MUSCLE_LABEL[m]).join(" ")}`).includes(normalize(q)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <>
      <Sheet open={open && !creating} onClose={onClose} title={title} tall>
        <div className="sticky top-0 z-10 -mx-5 bg-card px-5 pb-2">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
            <input className={cx(inputClass, "pl-11")} placeholder="Buscar exercício ou músculo" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="no-scrollbar -mx-5 mt-2 flex gap-1.5 overflow-x-auto px-5">
            {GROUPS.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setGroup(x.id)}
                className={cx("h-8 shrink-0 rounded-full px-3 text-xs font-bold", x.id === group ? "bg-sun text-on-sun" : "bg-card-2 text-ink-2")}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-1 space-y-1">
          {list.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => onPick(e)} className="flex w-full items-center gap-3 rounded-2xl p-1.5 text-left active:bg-card-2">
                <ExerciseThumb exercise={e} size={56} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{e.name}</span>
                  <span className="block truncate text-sm text-ink-2">
                    {e.category === "forca" ? e.muscles.map((m) => MUSCLE_LABEL[m]).join(", ") || e.equipment : CATEGORY_LABEL[e.category]}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!list.length && <p className="py-6 text-center text-sm text-ink-3">Nada encontrado. Que tal criar?</p>}
        </ul>
        <Button className="mt-3 w-full" onClick={() => setCreating(true)}>
          <Plus size={18} /> Criar exercício novo
        </Button>
      </Sheet>
      {open && creating && (
        <ExerciseFormSheet
          open
          initialName={q}
          onClose={() => setCreating(false)}
          onSaved={(e) => {
            setCreating(false);
            onPick(e);
          }}
        />
      )}
    </>
  );
}

/** Criar ou editar um exercício feito por ela. */
export function ExerciseFormSheet({
  open,
  onClose,
  onSaved,
  initialName = "",
  exercise,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (e: Exercise) => void;
  initialName?: string;
  exercise?: Exercise;
}) {
  const [name, setName] = useState(exercise?.name ?? initialName);
  const [muscles, setMuscles] = useState<Muscle[]>(exercise?.muscles ?? []);
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "");
  const [category, setCategory] = useState<Category>(exercise?.category ?? "forca");
  const [measure, setMeasure] = useState<Measure>(exercise?.measure ?? "reps");
  const [weighted, setWeighted] = useState(exercise?.weighted ?? true);
  const builtin = exercise && !exercise.custom;

  async function save() {
    const base: Exercise = exercise ?? {
      id: uid("custom"),
      name: "",
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
    const next: Exercise = builtin
      ? { ...base, name: name.trim() || base.name, weighted, updatedAt: Date.now() }
      : {
          ...base,
          name: name.trim() || "Exercício novo",
          muscles,
          equipment: equipment.trim(),
          category,
          measure: category === "cardio" && measure === "reps" ? "minutes" : measure,
          weighted: category === "forca" ? weighted : false,
          updatedAt: Date.now(),
        };
    await db.exercises.put(next);
    onSaved(next);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={exercise ? "Editar exercício" : "Exercício novo"}
      tall={!builtin}
      footer={
        <Button variant="sun" size="lg" className="w-full" onClick={save}>
          Salvar
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="Nome">
          {(id) => <input id={id} className={inputClass} value={name} placeholder="Ex.: Glúteo na máquina" onChange={(e) => setName(e.target.value)} />}
        </Field>
        {builtin ? (
          <Toggle checked={weighted} onChange={setWeighted} label="Usa carga (kg)" />
        ) : (
          <>
            <Field label="Tipo">
              {() => (
                <Segmented
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: "forca", label: "Musculação" },
                    { value: "cardio", label: "Cardio" },
                    { value: "mobilidade", label: "Alongar" },
                  ]}
                />
              )}
            </Field>
            <Field label="Contar por">
              {() => (
                <Segmented
                  value={measure}
                  onChange={setMeasure}
                  options={[
                    { value: "reps", label: "Repetições" },
                    { value: "seconds", label: "Segundos" },
                    { value: "minutes", label: "Minutos" },
                  ]}
                />
              )}
            </Field>
            {category === "forca" && <Toggle checked={weighted} onChange={setWeighted} label="Usa carga (kg)" />}
            <Field label="Aparelho / material">
              {(id) => <input id={id} className={inputClass} value={equipment} placeholder="Ex.: Máquina, halteres, polia…" onChange={(e) => setEquipment(e.target.value)} />}
            </Field>
            {category === "forca" && (
              <Field label="Músculos trabalhados">
                {() => (
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_MUSCLES.map((m) => {
                      const on = muscles.includes(m);
                      return (
                        <button key={m} type="button" onClick={() => setMuscles(on ? muscles.filter((x) => x !== m) : [...muscles, m])}>
                          <Chip tone={on ? "sun" : "plain"} className={cx("h-8 px-3 text-sm", on && "ring-2 ring-sun")}>
                            {MUSCLE_LABEL[m]}
                          </Chip>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Field>
            )}
            <p className="text-sm text-ink-3">Depois de salvar, abra o exercício para adicionar foto, GIF ou vídeo.</p>
          </>
        )}
      </div>
    </Sheet>
  );
}
