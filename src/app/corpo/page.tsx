"use client";

import { Camera, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { Cat } from "@/components/art";
import { LineChart } from "@/components/LineChart";
import { Button, Card, ConfirmSheet, cx, Field, inputClass, NumberInput, PageHeader, Segmented, Sheet, Spinner } from "@/components/ui";
import { db } from "@/lib/db";
import { dayKey, formatDate, parseDayKey } from "@/lib/dates";
import { saveMediaFile, useMediaUrl } from "@/lib/media";
import { fmt } from "@/lib/stats";
import type { BodyLog, MediaItem } from "@/lib/types";

type Tab = "peso" | "medidas" | "fotos";

const MEASURES: { key: keyof Pick<BodyLog, "waistCm" | "hipCm" | "thighCm" | "armCm">; label: string }[] = [
  { key: "waistCm", label: "Cintura" },
  { key: "hipCm", label: "Quadril" },
  { key: "thighCm", label: "Coxa" },
  { key: "armCm", label: "Braço" },
];

async function upsertLog(date: string, patch: Partial<BodyLog>) {
  const id = `corpo-${date}`;
  await db.transaction("rw", db.bodyLogs, async () => {
    const cur = await db.bodyLogs.get(id);
    await db.bodyLogs.put({ ...(cur ?? { id, date, createdAt: Date.now() }), ...patch });
  });
}

function WeightTab({ logs }: { logs: BodyLog[] }) {
  const [date, setDate] = useState(dayKey());
  const [weight, setWeight] = useState<number | null>(null);
  const withWeight = logs.filter((l) => l.weightKg != null);
  const latest = withWeight[withWeight.length - 1];
  const first = withWeight[0];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-ink-3">Último registro</p>
            <p className="text-3xl font-extrabold">{latest ? `${fmt(latest.weightKg)} kg` : "—"}</p>
            {latest && <p className="text-xs text-ink-3">{formatDate(latest.date, true)}</p>}
          </div>
          {first && latest && first !== latest && (
            <p className="text-right text-sm text-ink-2">
              desde {formatDate(first.date)}:
              <br />
              <b>
                {latest.weightKg! - first.weightKg! >= 0 ? "+" : ""}
                {fmt(latest.weightKg! - first.weightKg!)} kg
              </b>
            </p>
          )}
        </div>
        <div className="mt-3">
          <LineChart points={withWeight.map((l) => ({ x: parseDayKey(l.date).getTime(), y: l.weightKg! }))} unit="kg" color="var(--leaf)" />
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-3 font-extrabold">Registrar peso</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dia">{(id) => <input id={id} type="date" className={inputClass} value={date} max={dayKey()} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Field label="Peso (kg)">{(id) => <NumberInput id={id} live value={weight} placeholder="65,0" onCommit={setWeight} />}</Field>
        </div>
        <Button
          variant="sun"
          className="mt-3 w-full"
          disabled={!weight || !date}
          onClick={async () => {
            await upsertLog(date, { weightKg: weight });
            await db.profile.update("me", { weightKg: weight });
            setWeight(null);
          }}
        >
          Salvar
        </Button>
        <p className="mt-2 text-xs text-ink-3">Dica: se for pesar, faça sempre do mesmo jeito (de manhã, antes de comer).</p>
      </Card>

      {withWeight.length > 0 && (
        <Card className="divide-y divide-line">
          {[...withWeight].reverse().map((l) => (
            <div key={l.id} className="flex items-center justify-between p-3">
              <span className="text-sm text-ink-2">{formatDate(l.date, true)}</span>
              <span className="flex items-center gap-2 font-bold">
                {fmt(l.weightKg)} kg
                <button type="button" aria-label="Apagar" onClick={() => upsertLog(l.date, { weightKg: null })} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 active:bg-card-2">
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function MeasuresTab({ logs }: { logs: BodyLog[] }) {
  const [date, setDate] = useState(dayKey());
  const [vals, setVals] = useState<Partial<Record<(typeof MEASURES)[number]["key"], number | null>>>({});
  const withMeasures = logs.filter((l) => MEASURES.some((m) => l[m.key] != null));
  const first = withMeasures[0];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-1 font-extrabold">Registrar medidas (cm)</p>
        <p className="mb-3 text-xs text-ink-3">Com fita métrica, sem apertar. Preencha só as que quiser.</p>
        <Field label="Dia" className="mb-3">
          {(id) => <input id={id} type="date" className={inputClass} value={date} max={dayKey()} onChange={(e) => setDate(e.target.value)} />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {MEASURES.map((m) => (
            <Field key={m.key} label={m.label}>
              {(id) => <NumberInput id={id} live value={vals[m.key] ?? null} placeholder="—" onCommit={(n) => setVals((v) => ({ ...v, [m.key]: n }))} />}
            </Field>
          ))}
        </div>
        <Button
          variant="sun"
          className="mt-3 w-full"
          disabled={!Object.values(vals).some((v) => v != null)}
          onClick={async () => {
            const patch: Partial<BodyLog> = {};
            for (const m of MEASURES) if (vals[m.key] != null) patch[m.key] = vals[m.key];
            await upsertLog(date, patch);
            setVals({});
          }}
        >
          Salvar medidas
        </Button>
      </Card>

      {withMeasures.length > 0 && (
        <Card className="overflow-x-auto p-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="p-2 font-bold">Dia</th>
                {MEASURES.map((m) => (
                  <th key={m.key} className="p-2 text-right font-bold">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...withMeasures].reverse().map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap p-2 text-ink-2">{formatDate(l.date)}</td>
                  {MEASURES.map((m) => {
                    const v = l[m.key];
                    const f = first?.[m.key];
                    const diff = v != null && f != null && l !== first ? v - f : null;
                    return (
                      <td key={m.key} className="p-2 text-right font-bold">
                        {v != null ? fmt(v) : "–"}
                        {diff ? <span className="block text-[10px] font-normal text-ink-3">{diff > 0 ? "+" : ""}{fmt(diff)}</span> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function PhotoThumb({ item, onClick, className }: { item: MediaItem; onClick?: () => void; className?: string }) {
  const { url } = useMediaUrl(item.id);
  return (
    <button type="button" onClick={onClick} className={cx("relative overflow-hidden rounded-2xl bg-card-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt={`Foto de ${item.date}`} className="h-full w-full object-cover" />}
      <span className="absolute bottom-1 left-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-bold text-white">{item.date ? formatDate(item.date) : ""}</span>
    </button>
  );
}

function PhotosTab() {
  const photos = useLiveQuery(() => db.media.where("purpose").equals("progress").sortBy("date"), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(dayKey());
  const [view, setView] = useState<MediaItem | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { url: viewUrl } = useMediaUrl(view?.id);
  if (!photos) return <Spinner />;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-1 font-extrabold">Fotos de progresso</p>
        <p className="mb-3 text-xs text-ink-3">Ficam só no seu celular. Mesma pose, mesmo lugar e mesma luz ajudam a comparar.</p>
        <div className="flex gap-3">
          <input type="date" aria-label="Dia da foto" className={cx(inputClass, "flex-1")} value={date} max={dayKey()} onChange={(e) => setDate(e.target.value)} />
          <Button variant="sun" className="h-12" onClick={() => fileRef.current?.click()}>
            <Camera size={18} /> Foto
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setError(null);
            try {
              await saveMediaFile(f, { purpose: "progress", date });
            } catch (err) {
              setError(err instanceof Error ? err.message : "Não deu para salvar a foto.");
            }
            e.target.value = "";
          }}
        />
        {error && <p className="mt-2 text-sm font-bold text-danger">{error}</p>}
      </Card>

      {photos.length >= 2 && (
        <Card className="p-3">
          <p className="mb-2 px-1 font-extrabold">Antes e agora</p>
          <div className="grid grid-cols-2 gap-2">
            <PhotoThumb item={photos[0]} onClick={() => setView(photos[0])} className="aspect-[3/4]" />
            <PhotoThumb item={photos[photos.length - 1]} onClick={() => setView(photos[photos.length - 1])} className="aspect-[3/4]" />
          </div>
        </Card>
      )}

      {photos.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <Cat pose="peek" size={120} />
          <p className="mt-2 text-sm text-ink-2">Nenhuma foto ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[...photos].reverse().map((p) => (
            <PhotoThumb key={p.id} item={p} onClick={() => setView(p)} className="aspect-[3/4]" />
          ))}
        </div>
      )}

      <Sheet open={!!view && !confirm} onClose={() => setView(null)} title={view?.date ? formatDate(view.date, true) : "Foto"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {viewUrl && <img src={viewUrl} alt="" className="w-full rounded-2xl" />}
        <Button variant="danger" className="mt-4 w-full" onClick={() => setConfirm(true)}>
          <Trash2 size={16} /> Apagar foto
        </Button>
      </Sheet>
      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Apagar foto?"
        confirmLabel="Apagar"
        danger
        onConfirm={async () => {
          if (view) await db.media.delete(view.id);
          setConfirm(false);
          setView(null);
        }}
      />
    </div>
  );
}

export default function CorpoPage() {
  const logs = useLiveQuery(() => db.bodyLogs.orderBy("date").toArray(), []);
  const [tab, setTab] = useState<Tab>("peso");
  if (!logs) return <Spinner />;
  return (
    <div>
      <PageHeader title="Corpo" subtitle="Acompanhe do seu jeito" cat="peek" />
      <p className="mb-4 rounded-2xl bg-leaf-soft p-3 text-sm text-ink-2">
        💛 Seu corpo está ficando mais forte a cada treino. Use isso pra acompanhar, nunca pra se cobrar — força, energia e
        disposição contam muito mais que a balança.
      </p>
      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: "peso", label: "Peso" },
          { value: "medidas", label: "Medidas" },
          { value: "fotos", label: "Fotos" },
        ]}
      />
      {tab === "peso" && <WeightTab logs={logs} />}
      {tab === "medidas" && <MeasuresTab logs={logs} />}
      {tab === "fotos" && <PhotosTab />}
    </div>
  );
}
