"use client";

import { ArrowRight, Share, SquarePlus } from "lucide-react";
import { useState } from "react";
import { db } from "@/lib/db";
import { useIsIOS, useIsStandalone } from "@/lib/hooks";
import { DEFAULT_SCHEDULE } from "@/lib/seed";
import type { CatColor } from "@/lib/types";
import { CAT_PALETTES, Cat, Logo, Sunflower } from "./art";
import { Button, Card, cx, Field, inputClass, NumberInput } from "./ui";

export function InstallSteps({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={cx("space-y-2 text-[15px]", compact && "text-sm")}>
      <li className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sun font-extrabold text-on-sun">1</span>
        <span>
          No Safari, toque em <Share size={16} className="inline -mt-1 text-sky" /> <b>Compartilhar</b>
        </span>
      </li>
      <li className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sun font-extrabold text-on-sun">2</span>
        <span>
          Escolha <SquarePlus size={16} className="inline -mt-1" /> <b>Adicionar à Tela de Início</b>
        </span>
      </li>
      <li className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sun font-extrabold text-on-sun">3</span>
        <span>
          Abra o <b>Girassol</b> pelo ícone novo 🌻
        </span>
      </li>
    </ol>
  );
}

export function Onboarding() {
  const standalone = useIsStandalone();
  const ios = useIsIOS();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | null>(17);
  const [weight, setWeight] = useState<number | null>(65);
  const [height, setHeight] = useState<number | null>(173);
  const [catName, setCatName] = useState("Mimi");
  const [catColor, setCatColor] = useState<CatColor>("laranja");

  async function finish() {
    await db.profile.put({
      id: "me",
      name: name.trim(),
      age,
      weightKg: weight,
      heightCm: height,
      catName: catName.trim() || "Mimi",
      catColor,
      schedule: DEFAULT_SCHEDULE,
      createdAt: Date.now(),
      seedVersion: 1,
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10 pt-[calc(env(safe-area-inset-top)+24px)]">
      <div className="mb-6 flex justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cx("h-2 rounded-full transition-all", i === step ? "w-8 bg-sun" : "w-2 bg-line")} />
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-1 flex-col">
          <div className="relative mx-auto mb-4 flex h-48 w-64 items-end justify-center">
            <Sunflower stem size={78} className="animate-sway absolute bottom-0 left-2" />
            <Sunflower stem size={58} className="animate-sway absolute bottom-0 right-4" style={{ animationDelay: "-1.5s" }} />
            <Cat pose="sit" size={130} className="relative" />
          </div>
          <h1 className="text-center font-hand text-5xl font-bold">Oi! Bem-vinda 🌻</h1>
          <p className="mt-3 text-center text-[17px] leading-relaxed text-ink-2">
            Esse é o <b className="text-ink">Girassol</b>, seu diário de treino. Ele mostra o que fazer em cada dia, com fotos de
            cada exercício, e guarda tudo que você levantar.
          </p>

          {ios && !standalone ? (
            <Card className="mt-6 p-5">
              <p className="mb-1 font-extrabold">Antes de começar: coloque na Tela de Início</p>
              <p className="mb-4 text-sm text-ink-2">
                Assim ele abre como um app e o iPhone guarda seus treinos direitinho. (O que você salvar aqui no Safari
                não aparece no ícone — por isso é melhor fazer isso agora.)
              </p>
              <InstallSteps />
            </Card>
          ) : null}

          <div className="mt-auto pt-8">
            <Button variant="sun" size="lg" className="w-full" onClick={() => setStep(1)}>
              {ios && !standalone ? "Continuar mesmo assim" : "Vamos começar"} <ArrowRight size={20} />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <Logo size={64} className="mx-auto mb-2" />
          <h1 className="text-center font-hand text-5xl font-bold">Sobre você</h1>
          <p className="mb-6 mt-1 text-center text-ink-2">Pode mudar depois em Ajustes.</p>
          <div className="space-y-4">
            <Field label="Como você quer ser chamada?">
              {(id) => (
                <input
                  id={id}
                  className={inputClass}
                  placeholder="Seu nome"
                  value={name}
                  autoComplete="given-name"
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Idade">{(id) => <NumberInput id={id} value={age} onCommit={setAge} decimal={false} />}</Field>
              <Field label="Peso (kg)">{(id) => <NumberInput id={id} value={weight} onCommit={setWeight} />}</Field>
              <Field label="Altura (cm)">{(id) => <NumberInput id={id} value={height} onCommit={setHeight} decimal={false} />}</Field>
            </div>
          </div>
          <div className="mt-auto flex gap-3 pt-8">
            <Button size="lg" onClick={() => setStep(0)}>
              Voltar
            </Button>
            <Button variant="sun" size="lg" className="flex-1" onClick={() => setStep(2)}>
              Próximo <ArrowRight size={20} />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-center font-hand text-5xl font-bold">Seu gatinho</h1>
          <p className="mt-1 text-center text-ink-2">Ele vai te acompanhar nos treinos.</p>
          <div className="my-4 flex justify-center">
            <Cat pose="happy" size={150} color={catColor} />
          </div>
          <div className="mb-5 grid grid-cols-5 gap-2">
            {(Object.keys(CAT_PALETTES) as CatColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCatColor(c)}
                className={cx(
                  "flex flex-col items-center gap-1 rounded-2xl border p-2 text-[11px] font-bold transition",
                  c === catColor ? "border-sun bg-sun-pale" : "border-line bg-card",
                )}
              >
                <span className="h-7 w-7 rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${CAT_PALETTES[c].fur} 55%, ${CAT_PALETTES[c].ear} 55%)` }} />
                {CAT_PALETTES[c].label}
              </button>
            ))}
          </div>
          <Field label="Nome do gatinho">
            {(id) => <input id={id} className={inputClass} value={catName} onChange={(e) => setCatName(e.target.value)} />}
          </Field>

          <Card className="mt-5 p-4">
            <p className="mb-2 font-extrabold">Sua semana já está montada 🌻</p>
            <ul className="space-y-1 text-sm text-ink-2">
              <li>
                <b className="text-ink">Terça</b> — Treino A · pernas & glúteos
              </li>
              <li>
                <b className="text-ink">Quarta</b> — Treino D · leve e opcional
              </li>
              <li>
                <b className="text-ink">Quinta</b> — Treino B · costas, peito & braços
              </li>
              <li>
                <b className="text-ink">Sexta</b> — Treino C · glúteos & posterior
              </li>
            </ul>
          </Card>

          <div className="mt-auto flex gap-3 pt-8">
            <Button size="lg" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button variant="sun" size="lg" className="flex-1" onClick={finish}>
              Começar! 🌻
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
