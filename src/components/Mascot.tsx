"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Cat, type CatPose } from "./art";
import { cx } from "./ui";

const REACTIONS = [
  "Miau! 💛",
  "Prrrr… 😽",
  "Cada série conta. Uma de cada vez 🌻",
  "Postura primeiro, peso depois!",
  "Treinar é um carinho que você faz pro seu corpo 💛",
  "Bebe uma aguinha? 💧",
  "Constância vale mais que perfeição ✨",
  "*ronrona* 🐾",
  "Devagar e sempre — girassol também cresce aos pouquinhos.",
  "Tô muito orgulhoso de você!",
];

/** O gatinho com um balão de fala. Tocar nele faz carinho (e ele responde). */
export function Mascot({
  catName,
  message,
  pose = "sit",
  size = 92,
  className,
}: {
  catName: string;
  message: ReactNode;
  pose?: CatPose;
  size?: number;
  className?: string;
}) {
  const [taps, setTaps] = useState(0);
  const [reacting, setReacting] = useState(false);

  useEffect(() => {
    if (!reacting) return;
    const t = setTimeout(() => setReacting(false), 3500);
    return () => clearTimeout(t);
  }, [reacting, taps]);

  return (
    <div className={cx("flex items-end gap-1", className)}>
      <button
        type="button"
        aria-label={`Fazer carinho no ${catName}`}
        onClick={() => {
          setTaps((t) => t + 1);
          setReacting(true);
        }}
        className={cx("relative shrink-0 transition active:scale-95", reacting && "animate-pop")}
        key={reacting ? `r${taps}` : "idle"}
      >
        <Cat pose={reacting ? "happy" : pose} size={size} />
        {reacting && (
          <span className="animate-float-up pointer-events-none absolute -top-1 right-1 text-lg" aria-hidden>
            💛
          </span>
        )}
      </button>
      <div className="relative mb-5 min-w-0 flex-1 rounded-3xl rounded-bl-md border border-line bg-card px-4 py-3 shadow-soft">
        <span className="absolute -left-[7px] bottom-3 h-3.5 w-3.5 rotate-45 border-b border-l border-line bg-card" aria-hidden />
        <p className="text-xs font-extrabold text-sun-deep">{catName}</p>
        <p className="text-[15px] leading-snug text-ink" aria-live="polite">
          {reacting ? REACTIONS[(taps - 1) % REACTIONS.length] : message}
        </p>
      </div>
    </div>
  );
}
