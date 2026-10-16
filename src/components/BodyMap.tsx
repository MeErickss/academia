"use client";

import Body, { type ExtendedBodyPart, type Slug } from "react-muscle-highlighter";
import { MUSCLE_SLUGS } from "@/lib/muscles";
import type { Muscle } from "@/lib/types";
import { cx } from "./ui";

/**
 * Desenho do corpo (feminino) com os músculos coloridos.
 * Usa o react-muscle-highlighter (github.com/soroojshehryar/react-muscle-highlighter, MIT).
 */
export function BodyFigure({
  side,
  parts,
  className,
}: {
  side: "front" | "back";
  parts: ExtendedBodyPart[];
  className?: string;
}) {
  // O pacote já vem com tudo cinza-escuro; pintamos a base nas cores do app.
  const custom = new Map(parts.map((p) => [p.slug, p]));
  const data: ExtendedBodyPart[] = ALL_SLUGS.map(
    (slug) => custom.get(slug) ?? { slug, styles: { fill: NOT_MUSCLE.includes(slug) ? "var(--body-skin)" : "var(--body-muscle)" } },
  );
  return (
    <div className={cx("body-figure [&_svg]:h-auto [&_svg]:w-full", className)}>
      <Body
        data={data}
        side={side}
        gender="female"
        border="var(--ink-3)"
        defaultFill="var(--body-muscle)"
        defaultStroke="var(--card)"
        defaultStrokeWidth={1}
      />
    </div>
  );
}

const ALL_SLUGS: Slug[] = [
  "abs", "adductors", "ankles", "biceps", "calves", "chest", "deltoids", "feet", "forearm", "gluteal", "hamstring",
  "hands", "hair", "head", "knees", "lower-back", "neck", "obliques", "quadriceps", "tibialis", "trapezius", "triceps", "upper-back",
];
const NOT_MUSCLE: Slug[] = ["ankles", "feet", "hands", "hair", "head", "knees", "neck"];

const BACK_MUSCLES: Muscle[] = ["gluteos", "abdutores", "posterior", "panturrilha", "costas", "lombar", "trapezio", "triceps"];

/** Mostra quais músculos um exercício trabalha (principal forte, auxiliar clarinho). */
export function ExerciseMuscles({ muscles, secondary, className }: { muscles: Muscle[]; secondary: Muscle[]; className?: string }) {
  const color = new Map<Slug, string>();
  for (const m of secondary) for (const s of MUSCLE_SLUGS[m]) color.set(s, "#f8d77e");
  for (const m of muscles) for (const s of MUSCLE_SLUGS[m]) color.set(s, "#e9a10f");
  const parts: ExtendedBodyPart[] = [...color].map(([slug, c]) => ({ slug, styles: { fill: c } }));
  const showFront = [...muscles, ...secondary].some((m) => !BACK_MUSCLES.includes(m)) || !muscles.length;
  const showBack = [...muscles, ...secondary].some((m) => BACK_MUSCLES.includes(m));
  return (
    <div className={cx("flex items-start justify-center gap-4", className)}>
      {showFront && <BodyFigure side="front" parts={parts} className="w-[42%] max-w-[150px]" />}
      {showBack && <BodyFigure side="back" parts={parts} className="w-[42%] max-w-[150px]" />}
    </div>
  );
}
