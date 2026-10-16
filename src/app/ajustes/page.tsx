"use client";

import { ClipboardCopy, Download, FileUp, Heart, Share2, Trash2, Upload } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { CAT_PALETTES, Cat } from "@/components/art";
import { InstallSteps } from "@/components/Onboarding";
import { Button, Card, ConfirmSheet, cx, Field, inputClass, NumberInput, PageHeader, SectionTitle, Segmented, Sheet, Spinner, Toggle } from "@/components/ui";
import {
  backupFileName,
  buildBackup,
  importPlans,
  markBackupDone,
  parseBackup,
  restoreBackup,
  wipeEverything,
  type ImportPreview,
} from "@/lib/backup";
import { db } from "@/lib/db";
import { relativeDay, WEEKDAYS } from "@/lib/dates";
import { useIsStandalone, usePlans, useProfile } from "@/lib/hooks";
import type { CatColor, Plan, Profile } from "@/lib/types";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ——— Tema ———
type Theme = "auto" | "light" | "dark";
const THEME_KEY = "girassol-tema";
const themeListeners = new Set<() => void>();
function readTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}
function setTheme(t: Theme) {
  try {
    if (t === "auto") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, t);
  } catch {
    /* modo privado */
  }
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  themeListeners.forEach((l) => l());
}
function useTheme() {
  return useSyncExternalStore(
    (cb) => {
      themeListeners.add(cb);
      return () => themeListeners.delete(cb);
    },
    readTheme,
    () => "auto" as Theme,
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);
  const [catName, setCatName] = useState(profile.catName);
  const update = (p: Partial<Profile>) => db.profile.update("me", p);
  return (
    <Card className="space-y-4 p-4">
      <Field label="Seu nome">
        {(id) => <input id={id} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => update({ name: name.trim() })} />}
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Idade">{(id) => <NumberInput id={id} decimal={false} value={profile.age} onCommit={(age) => update({ age })} />}</Field>
        <Field label="Peso (kg)">{(id) => <NumberInput id={id} value={profile.weightKg} onCommit={(weightKg) => update({ weightKg })} />}</Field>
        <Field label="Altura (cm)">{(id) => <NumberInput id={id} decimal={false} value={profile.heightCm} onCommit={(heightCm) => update({ heightCm })} />}</Field>
      </div>
      <div className="flex items-center gap-3">
        <Cat pose="sit" size={72} className="shrink-0" />
        <Field label="Nome do gatinho" className="flex-1">
          {(id) => (
            <input id={id} className={inputClass} value={catName} onChange={(e) => setCatName(e.target.value)} onBlur={() => update({ catName: catName.trim() || "Mimi" })} />
          )}
        </Field>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(CAT_PALETTES) as CatColor[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => update({ catColor: c })}
            className={cx(
              "flex flex-col items-center gap-1 rounded-2xl border p-2 text-[11px] font-bold",
              c === profile.catColor ? "border-sun bg-sun-pale" : "border-line",
            )}
          >
            <span className="h-6 w-6 rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${CAT_PALETTES[c].fur} 55%, ${CAT_PALETTES[c].ear} 55%)` }} />
            {CAT_PALETTES[c].label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function ScheduleCard({ profile, plans }: { profile: Profile; plans: Plan[] }) {
  async function setDay(day: number, planId: string) {
    const schedule = { ...profile.schedule };
    if (!planId) delete schedule[String(day)];
    else schedule[String(day)] = { planId, optional: schedule[String(day)]?.optional };
    await db.profile.update("me", { schedule });
  }
  async function setOptional(day: number, optional: boolean) {
    const entry = profile.schedule[String(day)];
    if (!entry) return;
    await db.profile.update("me", { schedule: { ...profile.schedule, [String(day)]: { ...entry, optional } } });
  }
  return (
    <Card className="divide-y divide-line">
      {DAY_ORDER.map((d) => {
        const entry = profile.schedule[String(d)];
        return (
          <div key={d} className="p-3">
            <div className="flex items-center gap-3">
              <span className="w-20 shrink-0 font-bold">{WEEKDAYS[d]}</span>
              <select aria-label={`Ficha de ${WEEKDAYS[d]}`} className={cx(inputClass, "h-11")} value={entry?.planId ?? ""} onChange={(e) => setDay(d, e.target.value)}>
                <option value="">Descanso 😴</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.subtitle ? ` — ${p.subtitle}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {entry && (
              <div className="mt-1 pl-[5.75rem]">
                <Toggle checked={!!entry.optional} onChange={(v) => setOptional(d, v)} label={<span className="text-sm text-ink-2">Dia opcional / leve</span>} />
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

function BackupCard({ profile }: { profile: Profile }) {
  const [includeMedia, setIncludeMedia] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const canShareFiles = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return !!navigator.canShare?.({ files: [new File(["{}"], "t.json", { type: "application/json" })] });
      } catch {
        return false;
      }
    },
    () => false,
  );

  async function makeFile() {
    const data = await buildBackup(includeMedia);
    const text = JSON.stringify(data, null, 2);
    return { text, file: new File([text], backupFileName(), { type: "application/json" }) };
  }

  async function share() {
    setBusy(true);
    setMsg(null);
    try {
      const { file } = await makeFile();
      await navigator.share({ files: [file], title: "Backup do Girassol" });
      await markBackupDone();
      setMsg("Pronto! 🌻");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setMsg("Não deu pra compartilhar. Tente “Baixar arquivo”.");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    setMsg(null);
    try {
      const { file } = await makeFile();
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      await markBackupDone();
      setMsg("Arquivo salvo (no iPhone fica em Arquivos › Downloads).");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    setBusy(true);
    setMsg(null);
    try {
      const text = JSON.stringify(await buildBackup(false), null, 2);
      await navigator.clipboard.writeText(text);
      await markBackupDone();
      setMsg("Copiado! Agora é só colar onde quiser.");
    } catch {
      setMsg("Não deu pra copiar neste aparelho.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <p className="font-extrabold">Exportar meus dados (JSON)</p>
      <p className="mt-1 text-sm text-ink-2">
        Tudo fica guardado só no celular. Esse arquivo é sua cópia de segurança — e é com ele que dá pra montar a próxima
        ficha (ele tem um resumo de cada exercício, cargas e treinos).
      </p>
      <p className="mt-2 text-xs text-ink-3">
        Último backup: {profile.lastBackupAt ? relativeDay(profile.lastBackupAt) : "nunca"}
      </p>
      <div className="mt-3">
        <Toggle checked={includeMedia} onChange={setIncludeMedia} label={<span className="text-sm">Incluir fotos e vídeos (arquivo fica maior)</span>} />
      </div>
      <div className="mt-3 grid gap-2">
        {canShareFiles && (
          <Button variant="sun" disabled={busy} onClick={share}>
            <Share2 size={18} /> Compartilhar / salvar em Arquivos
          </Button>
        )}
        <Button variant={canShareFiles ? "soft" : "sun"} disabled={busy} onClick={download}>
          <Download size={18} /> Baixar arquivo
        </Button>
        <Button variant="ghost" disabled={busy} onClick={copy}>
          <ClipboardCopy size={18} /> Copiar como texto (sem fotos)
        </Button>
      </div>
      {msg && <p className="mt-2 text-center text-sm font-bold text-ink-2">{msg}</p>}
    </Card>
  );
}

function ImportCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paste, setPaste] = useState(false);
  const [text, setText] = useState("");
  const [confirm, setConfirm] = useState<"restore" | "replace" | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function read(raw: string) {
    setError(null);
    setDone(null);
    try {
      setPreview(parseBackup(raw));
      setPaste(false);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Arquivo inválido.");
    }
  }

  async function run(kind: "restore" | "replace" | "add") {
    if (!preview) return;
    setError(null);
    try {
      if (kind === "restore") await restoreBackup(preview.file);
      else await importPlans(preview.file, kind);
      setDone(kind === "restore" ? "Backup restaurado! 🌻" : "Fichas importadas! 🌻");
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu pra importar.");
    } finally {
      setConfirm(null);
    }
  }

  const c = preview?.counts;

  return (
    <Card className="p-4">
      <p className="font-extrabold">Importar (ficha nova ou backup)</p>
      <p className="mt-1 text-sm text-ink-2">Recebeu uma ficha nova em JSON, ou quer recuperar um backup? Escolha o arquivo aqui.</p>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json,text/plain"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) read(await f.text());
          e.target.value = "";
        }}
      />
      <div className="mt-3 grid gap-2">
        <Button variant="soft" onClick={() => fileRef.current?.click()}>
          <FileUp size={18} /> Escolher arquivo .json
        </Button>
        <Button variant="ghost" onClick={() => setPaste(true)}>
          <Upload size={18} /> Colar texto
        </Button>
      </div>
      {error && <p className="mt-3 rounded-2xl bg-danger/10 p-3 text-sm font-bold text-danger">{error}</p>}
      {done && <p className="mt-3 rounded-2xl bg-leaf-soft p-3 text-center text-sm font-bold">{done}</p>}

      <Sheet open={paste} onClose={() => setPaste(false)} title="Colar JSON">
        <textarea className={cx(inputClass, "h-56 py-3 font-mono text-xs")} value={text} onChange={(e) => setText(e.target.value)} placeholder='{ "app": "girassol", ... }' />
        <Button variant="sun" className="mt-3 w-full" disabled={!text.trim()} onClick={() => read(text)}>
          Ler
        </Button>
      </Sheet>

      <Sheet open={!!preview && !confirm} onClose={() => setPreview(null)} title="O que tem no arquivo">
        {c && (
          <>
            <ul className="mb-4 space-y-1 text-[15px]">
              <li>🌻 {plural(c.plans, "ficha", "fichas")}</li>
              {c.sessions > 0 && <li>🏋️ {plural(c.sessions, "treino feito", "treinos feitos")}</li>}
              {c.bodyLogs > 0 && <li>📏 {plural(c.bodyLogs, "registro de corpo", "registros de corpo")}</li>}
              {c.media > 0 && <li>📸 {plural(c.media, "foto/vídeo", "fotos/vídeos")}</li>}
              {c.exercises > 0 && <li>✨ {plural(c.exercises, "exercício criado", "exercícios criados")}</li>}
            </ul>
            <div className="space-y-2">
              {preview?.isFullBackup && (
                <Button variant="sun" className="w-full" onClick={() => setConfirm("restore")}>
                  Restaurar backup completo
                </Button>
              )}
              {c.plans > 0 && (
                <>
                  <Button variant={preview?.isFullBackup ? "soft" : "sun"} className="w-full" onClick={() => setConfirm("replace")}>
                    Trocar minhas fichas por essas
                  </Button>
                  <Button className="w-full" onClick={() => run("add")}>
                    Adicionar junto com as minhas
                  </Button>
                </>
              )}
              <p className="pt-1 text-center text-xs text-ink-3">Importar fichas não apaga seus treinos já feitos.</p>
            </div>
          </>
        )}
      </Sheet>
      <ConfirmSheet
        open={confirm === "restore"}
        onClose={() => setConfirm(null)}
        title="Restaurar backup?"
        message="Tudo que está no app agora (fichas, treinos, medidas) vai ser substituído pelo que está no arquivo."
        confirmLabel="Restaurar"
        danger
        onConfirm={() => run("restore")}
      />
      <ConfirmSheet
        open={confirm === "replace"}
        onClose={() => setConfirm(null)}
        title="Trocar as fichas?"
        message="Suas fichas atuais saem e entram as do arquivo (e os dias da semana, se o arquivo tiver). O histórico de treinos continua."
        confirmLabel="Trocar fichas"
        onConfirm={() => run("replace")}
      />
    </Card>
  );
}

export default function AjustesPage() {
  const profile = useProfile();
  const plans = usePlans();
  const theme = useTheme();
  const standalone = useIsStandalone();
  const [wipe, setWipe] = useState(false);
  if (!profile || !plans) return <Spinner />;

  return (
    <div>
      <PageHeader title="Ajustes" />

      <section className="mb-6">
        <SectionTitle>Você e seu gatinho</SectionTitle>
        <ProfileCard profile={profile} />
      </section>

      <section className="mb-6">
        <SectionTitle>Sua semana</SectionTitle>
        <ScheduleCard profile={profile} plans={plans} />
      </section>

      <section className="mb-6">
        <SectionTitle>Aparência</SectionTitle>
        <Segmented
          value={theme}
          onChange={setTheme}
          options={[
            { value: "auto", label: "Automático" },
            { value: "light", label: "Claro" },
            { value: "dark", label: "Escuro" },
          ]}
        />
      </section>

      <section id="backup" className="mb-6 scroll-mt-4 space-y-3">
        <SectionTitle>Seus dados</SectionTitle>
        <BackupCard profile={profile} />
        <ImportCard />
      </section>

      {!standalone && (
        <section className="mb-6">
          <SectionTitle>Instalar no iPhone</SectionTitle>
          <Card className="p-4">
            <InstallSteps />
            <p className="mt-3 text-xs text-ink-3">
              Atenção: o app da Tela de Início e o Safari guardam dados separados. Se já registrou treinos aqui no Safari, exporte
              antes e importe no app.
            </p>
          </Card>
        </section>
      )}

      <section className="mb-6">
        <SectionTitle>Sobre</SectionTitle>
        <Card className="space-y-2 p-4 text-sm text-ink-2">
          <p className="flex items-center gap-2 font-bold text-ink">
            <Heart size={16} className="text-peach" fill="currentColor" /> Feito com carinho, girassóis e gatinhos.
          </p>
          <p>
            Fotos dos exercícios: <a className="underline" href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">free-exercise-db</a> (domínio público).
          </p>
          <p>
            Desenho do corpo: <a className="underline" href="https://github.com/soroojshehryar/react-muscle-highlighter" target="_blank" rel="noreferrer">react-muscle-highlighter</a> (MIT).
          </p>
          <p className="text-xs text-ink-3">
            O app não substitui um profissional. Na dúvida sobre um exercício, ou se sentir dor, fale com o professor da academia.
          </p>
        </Card>
      </section>

      <Button variant="danger" className="w-full" onClick={() => setWipe(true)}>
        <Trash2 size={16} /> Apagar todos os dados
      </Button>
      <ConfirmSheet
        open={wipe}
        onClose={() => setWipe(false)}
        title="Apagar tudo?"
        message="Fichas, treinos, fotos e medidas vão sumir deste celular. Faça um backup antes se quiser guardar."
        confirmLabel="Apagar tudo"
        danger
        onConfirm={wipeEverything}
      />
    </div>
  );
}
