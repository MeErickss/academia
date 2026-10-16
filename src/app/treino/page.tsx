"use client";

import { Check, ChevronDown, Flag, Info, Minus, MoreHorizontal, Plus, Repeat, Trash2, X, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Cat, CatFace, Paw, Sunflower } from "@/components/art";
import { ExercisePicker } from "@/components/ExercisePicker";
import { ExerciseThumb, MediaGallery } from "@/components/media";
import { MuscleChips } from "@/components/plans";
import { Button, Card, ConfirmSheet, cx, EmptyState, IconButton, NumberInput, Sheet, Spinner } from "@/components/ui";
import { formatClock } from "@/lib/dates";
import { useActiveSession, useDoneSessions, useExerciseMap, useNow, useProfile } from "@/lib/hooks";
import { chime, unlockAudio } from "@/lib/sound";
import { doneSets, lastPerformance, lastSummary, MEASURE_UNIT, readyToIncrease, sessionProgress, targetLabel } from "@/lib/stats";
import type { Exercise, Session, SessionExercise, SetLog } from "@/lib/types";
import {
  addExerciseToSession,
  discardWorkout,
  finishWorkout,
  mutateSession,
  replaceExerciseInSession,
} from "@/lib/workout";

interface Rest {
  endsAt: number;
  total: number;
}

// ——— Cronômetro do treino ———
function Elapsed({ since }: { since: number }) {
  const now = useNow(1000);
  return <span className="tabular-nums">{formatClock((now - since) / 1000)}</span>;
}

// ——— Manter a tela acesa durante o treino ———
function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const acquire = async () => {
      try {
        if (nav.wakeLock && document.visibilityState === "visible") lock = await nav.wakeLock.request("screen");
      } catch {
        /* sem suporte */
      }
    };
    acquire();
    const onVis = () => document.visibilityState === "visible" && acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);
}

// ——— Descanso ———
function RestTimer({ rest, onChange }: { rest: Rest; onChange: (r: Rest | null) => void }) {
  const now = useNow(250);
  const left = Math.max(0, (rest.endsAt - now) / 1000);
  const finished = left <= 0;

  useEffect(() => {
    if (!finished) return;
    chime();
    const t = setTimeout(() => onChange(null), 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const pct = finished ? 1 : 1 - left / rest.total;
  const R = 22;
  const C = 2 * Math.PI * R;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-30 px-4">
      <div className="animate-pop pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-3xl border border-line bg-card p-3 shadow-soft">
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
            <circle cx="28" cy="28" r={R} fill="none" stroke="var(--sun-pale)" strokeWidth="6" />
            <circle cx="28" cy="28" r={R} fill="none" stroke="var(--sun)" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
          </svg>
          <Sunflower size={30} className={cx("absolute left-3 top-3", finished && "animate-pop")} />
        </div>
        {finished ? (
          <div className="flex-1">
            <p className="font-hand text-2xl font-bold leading-none">Bora!</p>
            <p className="text-sm text-ink-2">Próxima série 🌻</p>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-3">Descanso</p>
            <p className="text-2xl font-extrabold tabular-nums">{formatClock(left)}</p>
          </div>
        )}
        {!finished && (
          <>
            <IconButton label="Menos 15 segundos" className="bg-card-2" onClick={() => onChange({ ...rest, endsAt: rest.endsAt - 15000 })}>
              <Minus size={18} />
            </IconButton>
            <IconButton label="Mais 15 segundos" className="bg-card-2" onClick={() => onChange({ ...rest, endsAt: rest.endsAt + 15000, total: rest.total + 15 })}>
              <Plus size={18} />
            </IconButton>
          </>
        )}
        <IconButton label="Fechar descanso" onClick={() => onChange(null)}>
          <X size={18} />
        </IconButton>
      </div>
    </div>
  );
}

// ——— Linha de série ———
function SetRow({
  set,
  index,
  ex,
  onPatch,
  onToggle,
}: {
  set: SetLog;
  index: number;
  ex: SessionExercise;
  onPatch: (p: Partial<SetLog>) => void;
  onToggle: () => void;
}) {
  const inputCls = "h-12 w-full rounded-2xl border border-line bg-paper pr-10 pl-3 text-center text-lg font-extrabold outline-none focus:border-sun focus:ring-2 focus:ring-sun/30";
  return (
    <div className={cx("flex items-center gap-2 rounded-2xl p-1 transition", set.done && "bg-sun-pale")}>
      <span
        className={cx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
          set.done ? "text-sun-deep" : "bg-card-2 text-ink-2",
        )}
      >
        {set.done ? <Paw size={22} /> : index + 1}
      </span>
      {ex.weighted && (
        <div className="relative min-w-0 flex-1">
          <NumberInput className={inputCls} value={set.weight} placeholder="–" ariaLabel={`Carga da série ${index + 1}`} onCommit={(weight) => onPatch({ weight })} />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-3">kg</span>
        </div>
      )}
      <div className="relative min-w-0 flex-1">
        <NumberInput
          className={inputCls}
          decimal={false}
          value={set.value}
          placeholder="–"
          ariaLabel={`${MEASURE_UNIT[ex.measure]} da série ${index + 1}`}
          onCommit={(value) => onPatch({ value })}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-3">{MEASURE_UNIT[ex.measure]}</span>
      </div>
      <button
        type="button"
        aria-label={set.done ? `Desmarcar série ${index + 1}` : `Concluir série ${index + 1}`}
        aria-pressed={set.done}
        onClick={onToggle}
        className={cx(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition active:scale-90",
          set.done ? "border-sun bg-sun text-on-sun" : "border-line bg-card text-ink-3",
        )}
      >
        <Check size={22} strokeWidth={3} />
      </button>
    </div>
  );
}

// ——— Cartão de exercício ———
function ExerciseCard({
  ex,
  exercise,
  expanded,
  history,
  sessionId,
  onExpand,
  onMenu,
  onHowTo,
  onSetDone,
}: {
  ex: SessionExercise;
  exercise?: Exercise;
  expanded: boolean;
  history: Session[];
  sessionId: string;
  onExpand: () => void;
  onMenu: () => void;
  onHowTo: () => void;
  onSetDone: (ex: SessionExercise) => void;
}) {
  const done = doneSets(ex).length;
  const complete = done === ex.sets.length && ex.sets.length > 0;
  const last = lastPerformance(ex.exerciseId, history, sessionId);
  const increase = readyToIncrease(last, { sets: ex.target.sets, repsMax: ex.target.repsMax }, ex);

  const patchSet = (i: number, p: Partial<SetLog>) =>
    mutateSession(sessionId, (s) => {
      const e = s.exercises.find((x) => x.key === ex.key);
      if (e?.sets[i]) Object.assign(e.sets[i], p);
    });

  const toggle = (i: number) => {
    unlockAudio();
    const willBeDone = !ex.sets[i].done;
    mutateSession(sessionId, (s) => {
      const e = s.exercises.find((x) => x.key === ex.key);
      if (!e?.sets[i]) return;
      e.sets[i].done = !e.sets[i].done;
      e.sets[i].doneAt = e.sets[i].done ? Date.now() : undefined;
      // Preenche a próxima série com o mesmo peso, se ela ainda estiver vazia.
      const next = e.sets[i + 1];
      if (e.sets[i].done && next && !next.done && next.weight == null) next.weight = e.sets[i].weight;
    });
    if (willBeDone) onSetDone(ex);
  };

  if (!expanded) {
    return (
      <button type="button" onClick={onExpand} className={cx("flex w-full items-center gap-3 rounded-3xl border border-line bg-card p-3 text-left shadow-soft", complete && "opacity-70")}>
        <div className="relative">
          <ExerciseThumb exercise={exercise} size={56} />
          {complete && (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-sun text-on-sun">
              <Paw size={14} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cx("truncate font-extrabold", complete && "line-through decoration-sun decoration-2")}>{ex.name}</p>
          <p className="text-sm text-ink-2">
            {done}/{ex.sets.length} séries · {targetLabel(ex.target, ex.measure)}
          </p>
          {ex.muscles.length > 0 && (
            <div className="mt-1">
              <MuscleChips muscles={ex.muscles.slice(0, 2)} />
            </div>
          )}
        </div>
        <ChevronDown size={20} className="shrink-0 text-ink-3" />
      </button>
    );
  }

  return (
    <Card className="p-4 ring-2 ring-sun/60">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onHowTo} aria-label="Ver como fazer" className="relative shrink-0">
          <ExerciseThumb exercise={exercise} size={72} />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper">
            <Info size={14} />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold leading-tight">{ex.name}</p>
          <p className="text-sm text-ink-2">{targetLabel(ex.target, ex.measure)}</p>
          {last ? (
            <p className="text-sm font-bold text-sun-deep">última vez: {lastSummary(last, ex.measure, ex.weighted)}</p>
          ) : ex.category === "forca" ? (
            <p className="text-sm font-bold text-leaf">primeira vez — comece leve 🌱</p>
          ) : null}
        </div>
        <IconButton label="Opções do exercício" onClick={onMenu} className="-mr-2 -mt-1">
          <MoreHorizontal size={20} />
        </IconButton>
      </div>

      {increase && (
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-sun-pale p-2.5 text-sm font-bold">
          <Sunflower size={22} /> Você mandou bem da última vez! Tente subir um pouquinho a carga.
        </p>
      )}
      {ex.note && <p className="mt-3 rounded-2xl bg-card-2 p-2.5 text-sm text-ink-2">📝 {ex.note}</p>}
      {exercise?.myNote && <p className="mt-2 rounded-2xl bg-card-2 p-2.5 text-sm text-ink-2">🐾 {exercise.myNote}</p>}

      <div className="mt-3 space-y-1.5">
        {ex.sets.map((set, i) => (
          <SetRow key={i} set={set} index={i} ex={ex} onPatch={(p) => patchSet(i, p)} onToggle={() => toggle(i)} />
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            mutateSession(sessionId, (s) => {
              const e = s.exercises.find((x) => x.key === ex.key);
              if (!e) return;
              const lastSet = e.sets[e.sets.length - 1];
              e.sets.push({ weight: lastSet?.weight ?? null, value: lastSet?.value ?? e.target.repsMax, done: false });
            })
          }
        >
          <Plus size={16} /> Mais uma série
        </Button>
        {ex.sets.length > 1 && !ex.sets[ex.sets.length - 1].done && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              mutateSession(sessionId, (s) => {
                const e = s.exercises.find((x) => x.key === ex.key);
                if (e && e.sets.length > 1 && !e.sets[e.sets.length - 1].done) e.sets.pop();
              })
            }
          >
            <Minus size={16} /> Tirar série
          </Button>
        )}
      </div>
    </Card>
  );
}

// ——— Página ———
function Workout({ session }: { session: Session }) {
  const router = useRouter();
  const exercises = useExerciseMap();
  const history = useDoneSessions();
  const profile = useProfile();
  const [chosen, setChosen] = useState<string | null>(null);
  const [rest, setRest] = useState<Rest | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [howToId, setHowToId] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ mode: "add" } | { mode: "swap"; key: string } | null>(null);
  const [confirm, setConfirm] = useState<"finish" | "discard" | "empty" | null>(null);
  const [leaving, setLeaving] = useState(false);
  useWakeLock();

  if (!exercises || !history || leaving) return <Spinner />;

  const { done, total } = sessionProgress(session);
  const pct = total ? done / total : 0;
  const firstOpen = session.exercises.find((e) => e.sets.some((s) => !s.done))?.key ?? null;
  const expandedKey = chosen && session.exercises.some((e) => e.key === chosen) ? chosen : firstOpen;
  const menuEx = session.exercises.find((e) => e.key === menuKey);
  const howTo = howToId ? exercises.get(howToId) : undefined;

  function onSetDone(ex: SessionExercise) {
    const remaining = ex.sets.filter((s) => !s.done).length - 1;
    if (ex.target.restSec > 0) setRest({ endsAt: Date.now() + ex.target.restSec * 1000, total: ex.target.restSec });
    // Terminou o exercício? Vai pro próximo automaticamente.
    if (remaining <= 0) setChosen(null);
  }

  async function finish() {
    setLeaving(true);
    await finishWorkout(session.id);
    router.replace(`/treino/resumo?id=${encodeURIComponent(session.id)}`);
  }

  async function discard() {
    setLeaving(true);
    await discardWorkout(session.id);
    router.replace("/");
  }

  function move(key: string, dir: -1 | 1) {
    mutateSession(session.id, (s) => {
      const i = s.exercises.findIndex((e) => e.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.exercises.length) return;
      const [it] = s.exercises.splice(i, 1);
      s.exercises.splice(j, 0, it);
    });
    setMenuKey(null);
  }

  const current = session.exercises.find((e) => e.key === expandedKey);

  return (
    <div>
      {/* Cabeçalho fixo com progresso */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-line bg-paper/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+8px)] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold">{session.planName}</p>
            <p className="text-xs text-ink-3">
              <Elapsed since={session.startedAt} /> · {current ? `agora: ${current.name}` : done === total && total > 0 ? "tudo feito! 🌻" : ""}
            </p>
          </div>
          <IconButton label="Minimizar treino" onClick={() => router.push("/")}>
            <ChevronDown size={22} />
          </IconButton>
        </div>
        <div className="relative mt-3 h-3 rounded-full bg-sun-pale">
          <div className="h-3 rounded-full bg-sun transition-all duration-500" style={{ width: `${pct * 100}%` }} />
          <div className="absolute -top-3 transition-all duration-500" style={{ left: `calc(${pct * 100}% - 15px)` }}>
            <CatFace size={30} />
          </div>
        </div>
        <p className="mt-1 text-right text-xs font-bold text-ink-3">
          {done}/{total} séries
        </p>
      </div>

      <div className="space-y-3">
        {session.exercises.map((ex) => (
          <ExerciseCard
            key={ex.key}
            ex={ex}
            exercise={exercises.get(ex.exerciseId)}
            expanded={ex.key === expandedKey}
            history={history}
            sessionId={session.id}
            onExpand={() => setChosen(ex.key)}
            onMenu={() => setMenuKey(ex.key)}
            onHowTo={() => setHowToId(ex.exerciseId)}
            onSetDone={onSetDone}
          />
        ))}
      </div>

      <Button variant="outline" className="mt-3 w-full border-dashed" onClick={() => setPicker({ mode: "add" })}>
        <Plus size={18} /> Adicionar exercício
      </Button>

      {done === total && total > 0 && (
        <div className="mt-6 flex flex-col items-center text-center">
          <Cat pose="happy" size={110} className="animate-pop" />
          <p className="font-hand text-3xl font-bold">Tudo feito, {profile?.name || "campeã"}!</p>
          <p className="text-sm text-ink-2">Toque em Finalizar treino pra salvar 🌻</p>
        </div>
      )}

      {rest && <RestTimer key={rest.endsAt - rest.total * 1000} rest={rest} onChange={setRest} />}

      {/* Barra de baixo */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-4 pt-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button size="lg" onClick={() => setConfirm("discard")}>
            <X size={18} /> Descartar
          </Button>
          <Button
            size="lg"
            variant="sun"
            className="flex-1"
            onClick={() => {
              if (done === 0) setConfirm("empty");
              else if (done < total) setConfirm("finish");
              else finish();
            }}
          >
            <Flag size={18} /> Finalizar treino
          </Button>
        </div>
      </div>

      {/* Menu do exercício */}
      <Sheet open={!!menuEx} onClose={() => setMenuKey(null)} title={menuEx?.name}>
        {menuEx && (
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              onClick={() => {
                setHowToId(menuEx.exerciseId);
                setMenuKey(null);
              }}
            >
              <Info size={18} /> Como fazer
            </Button>
            <Button
              className="w-full justify-start"
              onClick={() => {
                setPicker({ mode: "swap", key: menuEx.key });
                setMenuKey(null);
              }}
            >
              <Repeat size={18} /> Trocar por outro (máquina ocupada)
            </Button>
            <Button className="w-full justify-start" onClick={() => move(menuEx.key, -1)}>
              <ArrowUp size={18} /> Mover para cima
            </Button>
            <Button className="w-full justify-start" onClick={() => move(menuEx.key, 1)}>
              <ArrowDown size={18} /> Mover para baixo
            </Button>
            <Button
              variant="danger"
              className="w-full justify-start"
              onClick={() => {
                mutateSession(session.id, (s) => {
                  s.exercises = s.exercises.filter((e) => e.key !== menuEx.key);
                });
                setMenuKey(null);
              }}
            >
              <Trash2 size={18} /> Tirar do treino de hoje
            </Button>
          </div>
        )}
      </Sheet>

      {/* Como fazer */}
      <Sheet open={!!howTo} onClose={() => setHowToId(null)} title={howTo?.name} tall>
        {howTo && (
          <div>
            <MediaGallery exercise={howTo} />
            {howTo.steps.length > 0 && (
              <ol className="mt-4 space-y-2">
                {howTo.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sun-soft text-xs font-extrabold">{i + 1}</span>
                    <p className="text-[15px] text-ink-2">{s}</p>
                  </li>
                ))}
              </ol>
            )}
            {howTo.tip && <p className="mt-3 rounded-2xl bg-sun-pale p-3 text-sm text-ink-2">🐾 {howTo.tip}</p>}
            <Link href={`/exercicio?id=${encodeURIComponent(howTo.id)}`} className="mt-4 block text-center text-sm font-bold text-ink-2 underline decoration-sun decoration-2 underline-offset-4">
              Abrir página do exercício (adicionar foto/vídeo)
            </Link>
          </div>
        )}
      </Sheet>

      <ExercisePicker
        open={!!picker}
        title={picker?.mode === "swap" ? "Trocar por…" : "Adicionar exercício"}
        onClose={() => setPicker(null)}
        onPick={async (ex) => {
          if (picker?.mode === "swap") await replaceExerciseInSession(session.id, picker.key, ex);
          else await addExerciseToSession(session.id, ex);
          setPicker(null);
        }}
      />

      <ConfirmSheet
        open={confirm === "finish"}
        onClose={() => setConfirm(null)}
        title="Finalizar treino?"
        message={`Ainda faltam ${total - done} séries. Só as séries marcadas vão pro histórico — tudo bem, dia corrido acontece!`}
        confirmLabel="Finalizar"
        onConfirm={finish}
      />
      <ConfirmSheet
        open={confirm === "empty"}
        onClose={() => setConfirm(null)}
        title="Nenhuma série marcada"
        message="Toque no ✓ de cada série que você fizer. Quer descartar esse treino?"
        confirmLabel="Descartar"
        danger
        onConfirm={discard}
      />
      <ConfirmSheet
        open={confirm === "discard"}
        onClose={() => setConfirm(null)}
        title="Descartar treino?"
        message="Tudo que você marcou nesse treino vai ser apagado."
        confirmLabel="Descartar"
        danger
        onConfirm={discard}
      />
    </div>
  );
}

export default function TreinoPage() {
  const session = useActiveSession();
  if (session === undefined) return <Spinner />;
  if (!session) {
    return (
      <div className="pt-10">
        <EmptyState title="Nenhum treino em andamento">
          <p>Escolha uma ficha para começar.</p>
          <Link href="/" className="mt-4 inline-flex h-11 items-center rounded-full bg-sun px-5 font-bold text-on-sun">
            Ir para o início
          </Link>
        </EmptyState>
      </div>
    );
  }
  return <Workout session={session} />;
}
