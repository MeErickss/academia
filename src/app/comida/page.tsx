"use client";

import { Camera, ChevronDown, ChevronLeft, ChevronRight, Lightbulb, Minus, Plus, Trash2, X } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { Sunflower, SunflowerGoals, WaterCup } from "@/components/art";
import { Button, Card, Chip, ConfirmSheet, cx, Field, IconButton, inputClass, PageHeader, SectionTitle, Select, Sheet, Spinner, washStyle } from "@/components/ui";
import { db, uid } from "@/lib/db";
import { addDays, dayKey, formatDate, parseDayKey, startOfWeek, WEEKDAYS, WEEKDAYS_LETTER } from "@/lib/dates";
import {
  dayGoals,
  DEFAULT_WATER_GOAL,
  FOOD_TIPS,
  GROUP_INFO,
  GROUPS,
  MOMENTS,
  QUICK_ITEMS,
  SLOT_INFO,
  SLOTS,
  slotForTime,
  SUGGESTIONS,
  TRAINING_ROLE,
  type QuickItem,
  type Suggestion,
  type SuggestionMoment,
} from "@/lib/food";
import { useDoneSessions, useProfile } from "@/lib/hooks";
import { saveMediaFile, useMediaUrl } from "@/lib/media";
import type { FoodGroup, MealEntry, MealSlot, Profile, Session } from "@/lib/types";

function isTrainingDay(date: string, profile: Profile, sessions: Session[]) {
  const entry = profile.schedule[String(parseDayKey(date).getDay())];
  return (!!entry && !entry.optional) || sessions.some((s) => dayKey(s.startedAt) === date);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function momentToSlot(m: SuggestionMoment): MealSlot {
  return MOMENTS.find((x) => x.id === m)!.slot;
}

function slotToMoment(s: MealSlot): SuggestionMoment {
  if (s === "lanche_tarde" || s === "lanche_manha" || s === "pre") return "pos_almoco";
  if (s === "jantar" || s === "pos") return "janta";
  if (s === "ceia") return "depois";
  return "almoco";
}

// ——— Painel de refeição ———

type Draft = Partial<MealEntry> & { slot: MealSlot };

function MealPhoto({ mediaId, className }: { mediaId: string; className?: string }) {
  const { url } = useMediaUrl(mediaId);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="Foto da refeição" className={cx("object-cover", className)} /> : <div className={cx("bg-card-2", className)} />;
}

function MealSheet({ draft, date, onClose }: { draft: Draft; date: string; onClose: () => void }) {
  const [slot, setSlot] = useState<MealSlot>(draft.slot);
  const [text, setText] = useState(draft.text ?? "");
  const [groups, setGroups] = useState<FoodGroup[]>(draft.groups ?? []);
  const [time, setTime] = useState(draft.time ?? (date === dayKey() ? nowTime() : ""));
  const [mediaId, setMediaId] = useState<string | undefined>(draft.mediaId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = !!draft.id;

  async function save() {
    if (!text.trim() && !groups.length && !mediaId) {
      setError("Escreva o que comeu, marque um grupo ou adicione uma foto.");
      return;
    }
    setBusy(true);
    try {
      // Se ela reescreveu um atalho ("2 ovos cozidos"), vira uma refeição comum.
      const keepQuick = draft.quick && text.trim() === (draft.text ?? "") && slot === draft.slot;
      const entry: MealEntry = {
        id: draft.id ?? uid("refeicao"),
        date,
        slot,
        text: text.trim(),
        groups,
        time: time || undefined,
        mediaId,
        quick: keepQuick ? draft.quick : undefined,
        qty: keepQuick ? draft.qty : undefined,
        createdAt: draft.createdAt ?? Date.now(),
      };
      await db.meals.put(entry);
      // Trocou ou tirou a foto? Apaga a antiga.
      if (draft.mediaId && draft.mediaId !== mediaId) await db.media.delete(draft.mediaId);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (draft.id) await db.meals.delete(draft.id);
    if (draft.mediaId) await db.media.delete(draft.mediaId);
    if (mediaId && mediaId !== draft.mediaId) await db.media.delete(mediaId);
    onClose();
  }

  async function addPhoto(f: File | undefined) {
    if (!f) return;
    setError(null);
    try {
      const item = await saveMediaFile(f, { purpose: "meal", date });
      // foto nova substitui a que acabou de ser escolhida (mas ainda não salva)
      if (mediaId && mediaId !== draft.mediaId) await db.media.delete(mediaId);
      setMediaId(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para salvar a foto.");
    }
  }

  const slots = SLOTS;

  return (
    <>
      <Sheet
        open={!confirm}
        onClose={() => {
          if (mediaId && mediaId !== draft.mediaId) db.media.delete(mediaId);
          onClose();
        }}
        title={editing ? "Editar refeição" : "O que você comeu?"}
        tall
        footer={
          <div className="flex gap-3">
            {editing && (
              <Button variant="danger" size="lg" onClick={() => setConfirm(true)} aria-label="Apagar refeição">
                <Trash2 size={18} />
              </Button>
            )}
            <Button variant="sun" size="lg" className="flex-1" disabled={busy} onClick={save}>
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Refeição">
            {() => (
              <div className="flex flex-wrap gap-1.5">
                {slots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlot(s.id)}
                    className={cx("h-9 rounded-full px-3 text-sm font-bold transition", s.id === slot ? "bg-sun text-on-sun" : "bg-card-2 text-ink-2")}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label="O que tinha no prato">
            {(id) => (
              <textarea
                id={id}
                rows={3}
                className={cx(inputClass, "h-auto py-3")}
                placeholder="Ex.: arroz, feijão, frango e salada"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}
          </Field>
          <Field label="Tinha…" hint="Marque o que lembrar — não precisa ser exato.">
            {() => (
              <div className="flex flex-wrap gap-1.5">
                {GROUPS.map((g) => {
                  const on = groups.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setGroups(on ? groups.filter((x) => x !== g.id) : [...groups, g.id])}
                      className={cx(
                        "h-10 rounded-full border px-3 text-sm font-bold transition",
                        on ? "border-sun bg-sun-pale text-ink" : "border-line bg-paper text-ink-2",
                      )}
                    >
                      {g.emoji} {g.label}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Horário">{(id) => <input id={id} type="time" className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} />}</Field>
            <Field label="Foto (opcional)">
              {() => (
                <>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} />
                  {mediaId ? (
                    <div className="relative h-12">
                      <MealPhoto mediaId={mediaId} className="h-12 w-full rounded-2xl" />
                      <button
                        type="button"
                        aria-label="Tirar foto"
                        onClick={() => {
                          if (mediaId !== draft.mediaId) db.media.delete(mediaId);
                          setMediaId(undefined);
                        }}
                        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <Button className="h-12 w-full" onClick={() => fileRef.current?.click()}>
                      <Camera size={18} /> Foto
                    </Button>
                  )}
                </>
              )}
            </Field>
          </div>
          {error && <p className="rounded-2xl bg-danger/10 p-3 text-sm font-bold text-danger">{error}</p>}
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Apagar refeição?"
        confirmLabel="Apagar"
        danger
        onConfirm={remove}
      />
    </>
  );
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="animate-pop pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-40 flex justify-center px-4">
      <span className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper shadow-soft">{text} 🌻</span>
    </div>
  );
}

// ——— Página ———

function WeekStrip({ date, onPick, meals, days, profile, sessions }: { date: string; onPick: (d: string) => void; meals: MealEntry[]; days: Map<string, number>; profile: Profile; sessions: Session[] }) {
  const start = startOfWeek(parseDayKey(date));
  const today = dayKey();
  const goal = profile.waterGoal ?? DEFAULT_WATER_GOAL;
  return (
    <Card className="mb-4 px-1 py-2">
      <div className="flex items-center">
        <IconButton label="Semana anterior" onClick={() => onPick(dayKey(addDays(start, -7)))}>
          <ChevronLeft size={18} />
        </IconButton>
        <div className="grid flex-1 grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(start, i);
            const k = dayKey(d);
            const future = k > today;
            const dayMeals = meals.filter((m) => m.date === k);
            const goals = dayGoals(dayMeals, days.get(k) ?? 0, goal);
            const done = goals.filter((g) => g.done).length;
            const logged = dayMeals.length > 0 || (days.get(k) ?? 0) > 0;
            return (
              <button
                key={k}
                type="button"
                disabled={future}
                onClick={() => onPick(k)}
                className={cx("flex flex-col items-center gap-0.5 rounded-2xl py-1 disabled:opacity-35", k === date && "bg-sun-pale")}
              >
                <span className={cx("text-[11px] font-bold", k === today ? "text-sun-deep" : "text-ink-3")}>{WEEKDAYS_LETTER[d.getDay()]}</span>
                <span className="text-sm font-extrabold">{d.getDate()}</span>
                <span className="flex h-5 items-center">
                  {logged ? (
                    <Sunflower size={Math.round(10 + 10 * (done / goals.length))} style={{ opacity: 0.45 + 0.55 * (done / goals.length) }} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-line" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <IconButton label="Próxima semana" disabled={dayKey(addDays(start, 7)) > today} onClick={() => onPick(dayKey(addDays(start, 7)))}>
          <ChevronRight size={18} />
        </IconButton>
      </div>
    </Card>
  );
}

function SuggestionsCard({ trainingDay, onPick }: { trainingDay: boolean; onPick: (s: Suggestion, m: SuggestionMoment) => void }) {
  const [moment, setMoment] = useState<SuggestionMoment>(() => slotToMoment(slotForTime()));
  const info = MOMENTS.find((m) => m.id === moment)!;
  const moments = MOMENTS;
  return (
    <Card className="overflow-hidden">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto p-3 pb-2">
        {moments.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMoment(m.id)}
            className={cx("h-9 shrink-0 rounded-full px-3.5 text-sm font-bold", m.id === moment ? "bg-sun text-on-sun" : "bg-card-2 text-ink-2")}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className={cx("px-4 pb-2 text-sm", trainingDay && info.trainingHint ? "font-bold text-leaf" : "text-ink-2")}>
        {trainingDay && info.trainingHint ? info.trainingHint : info.hint}
      </p>
      <ul className="divide-y divide-line">
        {SUGGESTIONS[moment].map((s) => (
          <li key={s.text}>
            <button type="button" onClick={() => onPick(s, moment)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-card-2">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sun-pale text-2xl">{s.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug">{s.text}</span>
                <span className="block text-xs text-ink-3">{s.groups.map((g) => GROUP_INFO[g].emoji).join(" ")}</span>
              </span>
              <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs font-extrabold text-ink-2">Comi!</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TipsCard() {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden" style={washStyle("folha")}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <Lightbulb className="shrink-0 text-leaf" />
        <span className="flex-1">
          <span className="block font-extrabold">Dicas de alimentação</span>
          <span className="block text-sm text-ink-2">pra ter energia no treino e crescer bem</span>
        </span>
        <ChevronDown className={cx("text-ink-3 transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="space-y-2.5 px-4 pb-4">
          {FOOD_TIPS.map((t) => (
            <li key={t} className="flex gap-2 text-sm text-ink-2">
              <span className="text-sun-deep">🌻</span>
              {t}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function ComidaPage() {
  const profile = useProfile();
  const sessions = useDoneSessions();
  const [date, setDate] = useState(() => dayKey());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const weekStart = dayKey(startOfWeek(parseDayKey(date)));
  const weekEnd = dayKey(addDays(startOfWeek(parseDayKey(date)), 6));
  const weekMeals = useLiveQuery(() => db.meals.where("date").between(weekStart, weekEnd, true, true).toArray(), [weekStart, weekEnd]);
  const weekDays = useLiveQuery(() => db.foodDays.where("date").between(weekStart, weekEnd, true, true).toArray(), [weekStart, weekEnd]);

  if (!profile || !sessions || !weekMeals || !weekDays) return <Spinner />;

  const waterGoal = profile.waterGoal ?? DEFAULT_WATER_GOAL;
  const waterByDay = new Map(weekDays.map((d) => [d.date, d.water]));
  const water = waterByDay.get(date) ?? 0;
  const meals = weekMeals.filter((m) => m.date === date).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99") || a.createdAt - b.createdAt);
  const trainingDay = isTrainingDay(date, profile, sessions);
  const goals = dayGoals(meals, water, waterGoal);
  const done = goals.filter((g) => g.done).length;
  const isToday = date === dayKey();
  const d = parseDayKey(date);

  async function setWater(n: number) {
    const value = Math.max(0, Math.min(30, n));
    await db.transaction("rw", db.foodDays, async () => {
      const cur = await db.foodDays.get(date);
      await db.foodDays.put({ ...(cur ?? { date }), water: value });
    });
  }

  const visibleSlots = SLOTS.filter((s) => s.main || meals.some((m) => m.slot === s.id));

  async function quickAdd(q: QuickItem) {
    const slot = slotForTime();
    await db.transaction("rw", db.meals, async () => {
      const same = (await db.meals.where("date").equals(date).toArray()).find((m) => m.slot === slot && m.quick === q.id);
      if (same) {
        const qty = (same.qty ?? 1) + 1;
        await db.meals.update(same.id, { qty, text: q.many(qty) });
      } else {
        await db.meals.add({ id: uid("refeicao"), date, slot, text: q.one, groups: q.groups, time: nowTime(), quick: q.id, qty: 1, createdAt: Date.now() });
      }
    });
    setToast(`${q.emoji} anotado em ${SLOT_INFO[slot].label}`);
  }

  return (
    <div>
      <PageHeader title="Comida" subtitle="Energia pro treino e pra crescer 💛" cat="happy" />

      <WeekStrip date={date} onPick={setDate} meals={weekMeals} days={waterByDay} profile={profile} sessions={sessions} />

      <p className="mb-3 text-center text-sm font-bold text-ink-2">
        {isToday ? "Hoje" : `${WEEKDAYS[d.getDay()]}, ${formatDate(d)}`}
        {trainingDay ? " · dia de treino 🏋️" : ""}
      </p>

      {/* Girassol do dia */}
      <Card className="mb-4 flex items-center gap-3 p-4" style={washStyle("sol")}>
        <SunflowerGoals total={goals.length} done={done} size={116} />
        <ul className="min-w-0 flex-1 space-y-1">
          {goals.map((g) => (
            <li key={g.id} className={cx("flex items-center justify-between gap-2 text-sm", g.done ? "font-bold text-ink" : "text-ink-3")}>
              <span className="truncate">
                {g.done ? "🌻" : "·"} {g.label}
              </span>
              <span className="shrink-0 text-xs">{g.detail}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Água */}
      <Card className="mb-5 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="font-extrabold">Água 💧</p>
            <p className="text-sm text-ink-2">
              {water} de {waterGoal} copos ({(water * 0.25).toLocaleString("pt-BR")} L)
            </p>
          </div>
          <div className="flex items-center gap-1">
            <IconButton label="Menos um copo" className="bg-card-2" disabled={water === 0} onClick={() => setWater(water - 1)}>
              <Minus size={18} />
            </IconButton>
            <IconButton label="Mais um copo" className="bg-sky-soft text-sky" onClick={() => setWater(water + 1)}>
              <Plus size={18} />
            </IconButton>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-y-2">
          {Array.from({ length: Math.max(waterGoal, water) }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} copos`}
              onClick={() => setWater(i < water ? i : i + 1)}
              className="flex w-[11.5%] justify-center active:scale-90"
            >
              <WaterCup filled={i < water} size={28} />
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-ink-3">
          meta
          <Select
            compact
            ariaLabel="Meta de água"
            title="Meta de água por dia"
            value={waterGoal}
            onChange={(v) => db.profile.update("me", { waterGoal: v })}
            options={[6, 7, 8, 9, 10, 12].map((n) => ({ value: n, label: `${n} copos`, hint: `${(n * 0.25).toLocaleString("pt-BR")} litros` }))}
          />
        </div>
      </Card>

      {/* Atalhos */}
      {isToday && (
        <Card className="mb-5 p-3">
          <p className="mb-2 px-1 text-sm font-bold text-ink-2">Anotar rápido (vai pra refeição do horário)</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ITEMS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => quickAdd(q)}
                className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-paper py-2.5 text-xs font-bold active:scale-95 active:bg-sun-pale"
              >
                <span className="text-2xl">{q.emoji}</span>
                {q.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Refeições */}
      <SectionTitle>Refeições</SectionTitle>
      <Card className="mb-5 divide-y divide-line">
        {visibleSlots.map((s) => {
          const list = meals.filter((m) => m.slot === s.id);
          return (
            <div key={s.id} className="p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{s.emoji}</span>
                <span className={cx("flex-1 font-extrabold", !list.length && "font-bold text-ink-2")}>
                  {s.label}
                  {trainingDay && TRAINING_ROLE[s.id] && (
                    <Chip tone="leaf" className="ml-2 align-middle">
                      {TRAINING_ROLE[s.id]}
                    </Chip>
                  )}
                </span>
                <IconButton label={`Adicionar em ${s.label}`} className="bg-sun-pale text-sun-deep" onClick={() => setDraft({ slot: s.id })}>
                  <Plus size={18} />
                </IconButton>
              </div>
              {list.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {list.map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => setDraft(m)} className="flex w-full items-center gap-3 rounded-2xl bg-paper p-2 text-left active:bg-card-2">
                        {m.mediaId && <MealPhoto mediaId={m.mediaId} className="h-12 w-12 shrink-0 rounded-xl" />}
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] leading-snug">{m.text || "Sem descrição"}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-ink-3">
                            {m.time && <span className="font-bold">{m.time}</span>}
                            {m.groups.map((g) => (
                              <Chip key={g} tone="plain" className="px-1.5 py-0 text-[11px]">
                                {GROUP_INFO[g].emoji} {GROUP_INFO[g].label}
                              </Chip>
                            ))}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </Card>

      <button
        type="button"
        onClick={() => setDraft({ slot: slotForTime() })}
        className="-mt-3 mb-5 block w-full text-center text-sm font-bold text-ink-2 underline decoration-sun decoration-2 underline-offset-4"
      >
        Comeu em outro horário?
      </button>

      <SectionTitle>Ideias do que comer</SectionTitle>
      <div className="mb-5">
        <SuggestionsCard
          trainingDay={trainingDay}
          onPick={(s, m) => setDraft({ slot: momentToSlot(m), text: s.text, groups: s.groups })}
        />
      </div>

      <TipsCard />

      {draft && <MealSheet key={draft.id ?? `${draft.slot}-${draft.text ?? ""}`} draft={draft} date={date} onClose={() => setDraft(null)} />}
      {toast && <Toast key={toast} text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
