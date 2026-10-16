"use client";

import { createContext, useContext, type CSSProperties } from "react";
import type { CatColor } from "@/lib/types";

/* ————————————————————————————————————————————————
   Ilustrações em SVG: girassóis, gatinhos e aquarela.
   ———————————————————————————————————————————————— */

/** Filtros de "aquarela" usados por todas as ilustrações. Fica uma vez só no layout. */
export function WatercolorDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
      <defs>
        <filter id="wc" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="wc-blob" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="60" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="10" />
        </filter>
        <linearGradient id="petal-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f4a514" />
          <stop offset="0.55" stopColor="#ffcf3f" />
          <stop offset="1" stopColor="#ffe48a" />
        </linearGradient>
        <radialGradient id="wash-sun">
          <stop offset="0" stopColor="#ffd75e" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffd75e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wash-leaf">
          <stop offset="0" stopColor="#9cc77a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#9cc77a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wash-peach">
          <stop offset="0" stopColor="#f6a885" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f6a885" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wash-sky">
          <stop offset="0" stopColor="#8ec3df" stopOpacity="0.6" />
          <stop offset="1" stopColor="#8ec3df" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** Manchas de aquarela no fundo da tela. */
export function WatercolorBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ opacity: "var(--wash-opacity)" }}>
      <svg viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <g filter="url(#wc-blob)">
          <ellipse cx="360" cy="40" rx="190" ry="140" fill="url(#wash-sun)" />
          <ellipse cx="10" cy="430" rx="150" ry="190" fill="url(#wash-leaf)" />
          <ellipse cx="380" cy="700" rx="170" ry="150" fill="url(#wash-peach)" />
          <ellipse cx="60" cy="860" rx="150" ry="110" fill="url(#wash-sky)" />
        </g>
      </svg>
    </div>
  );
}

// ——— Girassol ———

const PETAL = "M50 50 C 42.5 40 43 18 50 5 C 57 18 57.5 40 50 50 Z";
const SEEDS = Array.from({ length: 46 }, (_, i) => {
  const r = 1.45 * Math.sqrt(i);
  const t = i * 2.39996;
  return { x: 50 + r * Math.cos(t), y: 50 + r * Math.sin(t), big: i % 3 === 0 };
});

function SunflowerHead({ face = false, petals = 14 }: { face?: boolean; petals?: number }) {
  const step = 360 / petals;
  return (
    <>
      <circle cx="50" cy="50" r="40" fill="url(#wash-sun)" opacity="0.6" />
      <g filter="url(#wc)">
        {Array.from({ length: petals }, (_, i) => (
          <path key={`b${i}`} d={PETAL} fill="#e2960e" transform={`rotate(${i * step + step / 2} 50 50)`} />
        ))}
        {Array.from({ length: petals }, (_, i) => (
          <path key={`f${i}`} d={PETAL} fill="url(#petal-grad)" transform={`rotate(${i * step} 50 50) scale(1 0.94) translate(0 3)`} />
        ))}
      </g>
      {face ? (
        <g>
          <path d="M37 41 L36 27 L47 36 Z" fill="#6b4423" />
          <path d="M63 41 L64 27 L53 36 Z" fill="#6b4423" />
          <circle cx="50" cy="51" r="16" fill="#6b4423" />
          <circle cx="50" cy="52" r="12.5" fill="#55341a" />
          <path d="M43.5 49 Q46 46.5 48.5 49" stroke="#ffe7a8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M51.5 49 Q54 46.5 56.5 49" stroke="#ffe7a8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M48.6 53 L51.4 53 L50 54.8 Z" fill="#f4a7a0" />
          <path d="M47.5 56.5 Q49 58 50 56.7 Q51 58 52.5 56.5" stroke="#ffe7a8" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          <path d="M41 54 L34 53 M41 56 L34 58 M59 54 L66 53 M59 56 L66 58" stroke="#ffe7a8" strokeWidth="0.9" opacity="0.8" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <circle cx="50" cy="50" r="15.5" fill="#6b4423" />
          <circle cx="50" cy="50" r="11.5" fill="#4f2f17" />
          {SEEDS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.big ? 0.95 : 0.7} fill="#a8733d" opacity="0.85" />
          ))}
        </g>
      )}
    </>
  );
}

export function Sunflower({
  size = 64,
  className,
  stem = false,
  face = false,
  style,
}: {
  size?: number;
  className?: string;
  stem?: boolean;
  face?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox={stem ? "0 0 100 150" : "0 0 100 100"}
      width={size}
      height={stem ? size * 1.5 : size}
      className={className}
      style={style}
      aria-hidden
    >
      {stem && (
        <g filter="url(#wc)">
          <path d="M50 62 C 47 92 54 120 50 148" stroke="#6f9a4d" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M51 114 C 62 99 80 98 90 104 C 79 117 62 119 51 114 Z" fill="#7fae5a" />
          <path d="M50 98 C 38 85 20 86 12 92 C 23 105 40 105 50 98 Z" fill="#6f9a4d" />
          <path d="M53 112 C 64 106 76 104 86 104" stroke="#557a38" strokeWidth="1" fill="none" opacity=".6" />
        </g>
      )}
      <SunflowerHead face={face} />
    </svg>
  );
}

/** Logo: girassol com carinha de gato no miolo. */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return <Sunflower size={size} face className={className} />;
}

// ——— Gatinhos ———

export interface CatPalette {
  label: string;
  fur: string;
  stripe: string;
  belly: string;
  ear: string;
  tail: string;
  paw: string;
  eye: string;
  mask: string;
  /** cor dos risquinhos do rosto (boca, olhos fechados, bigodes) */
  line: string;
}

export const CAT_PALETTES: Record<CatColor, CatPalette> = {
  laranja: { label: "Laranjinha", fur: "#f3a35b", stripe: "#d5782c", belly: "#fde6c8", ear: "#f3a35b", tail: "#f3a35b", paw: "#fde6c8", eye: "#3b2f22", mask: "transparent", line: "#3b2f22" },
  preto: { label: "Pretinho", fur: "#3f3736", stripe: "transparent", belly: "#4f4645", ear: "#3f3736", tail: "#3f3736", paw: "#4f4645", eye: "#f2cf45", mask: "transparent", line: "#f3e3c8" },
  cinza: { label: "Cinza", fur: "#aaadb3", stripe: "#878a91", belly: "#ebecef", ear: "#aaadb3", tail: "#aaadb3", paw: "#ebecef", eye: "#3b2f22", mask: "transparent", line: "#3b2f22" },
  branco: { label: "Branquinho", fur: "#fffaf2", stripe: "transparent", belly: "#ffffff", ear: "#fffaf2", tail: "#fffaf2", paw: "#ffffff", eye: "#3b2f22", mask: "transparent", line: "#3b2f22" },
  siames: { label: "Siamês", fur: "#f1e2c8", stripe: "transparent", belly: "#fbf3e4", ear: "#6b4f3f", tail: "#6b4f3f", paw: "#6b4f3f", eye: "#4b8fb8", mask: "#6b4f3f", line: "#3b2f22" },
};

const CatColorContext = createContext<CatColor>("laranja");
export const CatColorProvider = CatColorContext.Provider;

function catVars(color: CatColor): CSSProperties {
  const p = CAT_PALETTES[color] ?? CAT_PALETTES.laranja;
  return {
    "--cf": p.fur,
    "--cs": p.stripe,
    "--cb": p.belly,
    "--ce": p.ear,
    "--ct": p.tail,
    "--cp": p.paw,
    "--cy": p.eye,
    "--cm": p.mask,
    "--cl": p.line,
  } as CSSProperties;
}

const INK = "#3b2f22";
const PINK = "#f2a19a";
const OUT = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Face({ cx, cy, eyes }: { cx: number; cy: number; eyes: "open" | "happy" | "sleep" }) {
  const t = (x: number, y: number) => `${cx + x} ${cy + y}`;
  return (
    <g>
      <ellipse cx={cx} cy={cy + 6} rx="9" ry="7" fill="var(--cm)" opacity="0.5" />
      <ellipse cx={cx - 15} cy={cy + 7} rx="4" ry="2.4" fill={PINK} opacity="0.55" />
      <ellipse cx={cx + 15} cy={cy + 7} rx="4" ry="2.4" fill={PINK} opacity="0.55" />
      {eyes === "open" && (
        <>
          <ellipse cx={cx - 10} cy={cy} rx="3.2" ry="4" fill="var(--cy)" />
          <ellipse cx={cx + 10} cy={cy} rx="3.2" ry="4" fill="var(--cy)" />
          <circle cx={cx - 9} cy={cy - 1.4} r="1.1" fill="#fff" />
          <circle cx={cx + 11} cy={cy - 1.4} r="1.1" fill="#fff" />
        </>
      )}
      {eyes === "happy" && (
        <path d={`M${t(-14, 1)} Q${t(-10, -3.5)} ${t(-6, 1)} M${t(6, 1)} Q${t(10, -3.5)} ${t(14, 1)}`} stroke="var(--cl)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
      {eyes === "sleep" && (
        <path d={`M${t(-14, 0)} Q${t(-10, 3)} ${t(-6, 0)} M${t(6, 0)} Q${t(10, 3)} ${t(14, 0)}`} stroke="var(--cl)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}
      <path d={`M${t(-2.5, 6)} L${t(2.5, 6)} L${t(0, 9)} Z`} fill="#e9857f" />
      <path d={`M${t(-4, 11)} Q${t(-2, 13.5)} ${t(0, 11.3)} Q${t(2, 13.5)} ${t(4, 11)}`} stroke="var(--cl)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path
        d={`M${t(-18, 5)} L${t(-30, 3)} M${t(-18, 9)} L${t(-30, 11)} M${t(18, 5)} L${t(30, 3)} M${t(18, 9)} L${t(30, 11)}`}
        stroke="var(--cl)"
        strokeWidth="1.1"
        opacity="0.6"
        strokeLinecap="round"
      />
    </g>
  );
}

function Head({ cx, cy, rx = 26, ry = 21 }: { cx: number; cy: number; rx?: number; ry?: number }) {
  const earL = `M${cx - 23} ${cy - 8} L${cx - 21} ${cy - 30} L${cx - 5} ${cy - 18} Z`;
  const earR = `M${cx + 23} ${cy - 8} L${cx + 21} ${cy - 30} L${cx + 5} ${cy - 18} Z`;
  return (
    <g>
      <g filter="url(#wc)">
        <path d={earL} fill="var(--ce)" />
        <path d={earR} fill="var(--ce)" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="var(--cf)" />
      </g>
      <path d={`M${cx - 19} ${cy - 13} L${cx - 18} ${cy - 25} L${cx - 9} ${cy - 18} Z`} fill={PINK} opacity="0.8" />
      <path d={`M${cx + 19} ${cy - 13} L${cx + 18} ${cy - 25} L${cx + 9} ${cy - 18} Z`} fill={PINK} opacity="0.8" />
      <path
        d={`M${cx - 6} ${cy - 19} l1.5 5 M${cx} ${cy - 20.5} v6 M${cx + 6} ${cy - 19} l-1.5 5`}
        stroke="var(--cs)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d={earL} fill="none" {...OUT} />
      <path d={earR} fill="none" {...OUT} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" {...OUT} />
    </g>
  );
}

export type CatPose = "sit" | "happy" | "sleep" | "peek";

export function Cat({
  pose = "sit",
  size = 96,
  className,
  color,
  style,
}: {
  pose?: CatPose;
  size?: number;
  className?: string;
  color?: CatColor;
  style?: CSSProperties;
}) {
  const ctx = useContext(CatColorContext);
  const vars = { ...catVars(color ?? ctx), ...style };

  if (pose === "peek") {
    return (
      <svg viewBox="0 0 120 66" width={size} height={size * 0.55} className={className} style={vars} aria-hidden>
        <Head cx={60} cy={38} />
        <Face cx={60} cy={36} eyes="open" />
        <ellipse cx="40" cy="61" rx="9" ry="5.5" fill="var(--cp)" {...OUT} />
        <ellipse cx="80" cy="61" rx="9" ry="5.5" fill="var(--cp)" {...OUT} />
      </svg>
    );
  }

  if (pose === "sleep") {
    return (
      <svg viewBox="0 0 120 92" width={size} height={size * 0.77} className={className} style={vars} aria-hidden>
        <text x="66" y="22" className="zzz font-hand" fontSize="16" fill="var(--ink-3)">
          z
        </text>
        <text x="78" y="14" className="zzz font-hand" fontSize="12" fill="var(--ink-3)" style={{ animationDelay: "0.8s" }}>
          z
        </text>
        <g filter="url(#wc)">
          <ellipse cx="66" cy="66" rx="40" ry="22" fill="var(--cf)" />
        </g>
        <path d="M68 49 c 2 4 2 8 0 11 M78 50 c 2 4 2 8 0 11 M88 53 c 2 3 2 7 0 10" stroke="var(--cs)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <ellipse cx="66" cy="66" rx="40" ry="22" fill="none" {...OUT} />
        <path d="M104 72 C 108 88 80 92 56 86" stroke={INK} strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M104 72 C 108 88 80 92 56 86" stroke="var(--ct)" strokeWidth="7" fill="none" strokeLinecap="round" />
        <Head cx={36} cy={62} rx={21} ry={17} />
        <Face cx={36} cy={62} eyes="sleep" />
        <ellipse cx="50" cy="82" rx="8" ry="4.5" fill="var(--cp)" {...OUT} />
      </svg>
    );
  }

  const happy = pose === "happy";
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} style={vars} aria-hidden>
      <g className="cat-tail">
        <path d="M84 102 C 104 102 110 86 100 72" stroke={INK} strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M84 102 C 104 102 110 86 100 72" stroke="var(--ct)" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
      <g filter="url(#wc)">
        <path d="M38 106 C 30 104 30 86 36 76 C 41 66 50 60 60 60 C 70 60 79 66 84 76 C 90 86 90 104 82 106 Z" fill="var(--cf)" />
      </g>
      <path d="M50 104 C 46 92 50 77 60 75 C 70 77 74 92 70 104 Z" fill="var(--cb)" opacity="0.9" />
      <path d="M38 106 C 30 104 30 86 36 76 C 41 66 50 60 60 60 C 70 60 79 66 84 76 C 90 86 90 104 82 106 Z" fill="none" {...OUT} />
      {happy ? (
        <>
          <path d="M44 76 C 36 68 32 60 29 50" stroke={INK} strokeWidth="10.5" fill="none" strokeLinecap="round" />
          <path d="M44 76 C 36 68 32 60 29 50" stroke="var(--cf)" strokeWidth="6.5" fill="none" strokeLinecap="round" />
          <path d="M76 76 C 84 68 88 60 91 50" stroke={INK} strokeWidth="10.5" fill="none" strokeLinecap="round" />
          <path d="M76 76 C 84 68 88 60 91 50" stroke="var(--cf)" strokeWidth="6.5" fill="none" strokeLinecap="round" />
          <circle cx="29" cy="48" r="5.2" fill="var(--cp)" {...OUT} />
          <circle cx="91" cy="48" r="5.2" fill="var(--cp)" {...OUT} />
          <g transform="translate(78 14) scale(0.27)">
            <SunflowerHead />
          </g>
        </>
      ) : null}
      <ellipse cx="50" cy="105" rx="7.5" ry="4.6" fill="var(--cp)" {...OUT} />
      <ellipse cx="70" cy="105" rx="7.5" ry="4.6" fill="var(--cp)" {...OUT} />
      <Head cx={60} cy={44} />
      <Face cx={60} cy={44} eyes={happy ? "happy" : "open"} />
    </svg>
  );
}

/** Carinha pequena (para a barra de progresso, avatar…). */
export function CatFace({ size = 28, className, color }: { size?: number; className?: string; color?: CatColor }) {
  const ctx = useContext(CatColorContext);
  return (
    <svg viewBox="22 10 76 58" width={size} height={size * 0.76} className={className} style={catVars(color ?? ctx)} aria-hidden>
      <Head cx={60} cy={44} />
      <Face cx={60} cy={44} eyes="happy" />
    </svg>
  );
}

export function Paw({ size = 20, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style} aria-hidden fill="currentColor">
      <ellipse cx="12" cy="15.5" rx="5.6" ry="4.6" />
      <ellipse cx="5.6" cy="9.6" rx="2.3" ry="2.7" transform="rotate(-18 5.6 9.6)" />
      <ellipse cx="9.8" cy="5.9" rx="2.3" ry="2.8" transform="rotate(-6 9.8 5.9)" />
      <ellipse cx="14.2" cy="5.9" rx="2.3" ry="2.8" transform="rotate(6 14.2 5.9)" />
      <ellipse cx="18.4" cy="9.6" rx="2.3" ry="2.7" transform="rotate(18 18.4 9.6)" />
    </svg>
  );
}

/** Pincelada de aquarela para sublinhar títulos. */
export function Brush({ className, color = "var(--sun)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 200 18" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        filter="url(#wc)"
        d="M4 11 C 40 4 80 6 120 7 C 150 8 175 6 196 9 C 190 14 150 15 110 14 C 70 13 30 16 6 15 Z"
        fill={color}
        opacity="0.55"
      />
    </svg>
  );
}

/** Pétalas caindo (comemoração). Valores "aleatórios" fixos para não mudar a cada render. */
export function PetalRain({ count = 26 }: { count?: number }) {
  const rnd = (i: number, k: number) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const left = rnd(i, 1) * 100;
        const delay = rnd(i, 2) * 2.5;
        const dur = 3.5 + rnd(i, 3) * 3;
        const size = 12 + rnd(i, 4) * 14;
        const style = {
          left: `${left}%`,
          top: 0,
          animation: `petal-fall ${dur}s ${delay}s ease-in forwards`,
          "--drift": `${(rnd(i, 5) - 0.5) * 160}px`,
          "--spin": `${(rnd(i, 6) - 0.5) * 900}deg`,
          opacity: 0,
        } as CSSProperties;
        return (
          <svg key={i} viewBox="40 0 20 52" width={size * 0.4} height={size} className="absolute" style={style}>
            <path d={PETAL} fill={i % 4 === 0 ? "#f4a514" : "url(#petal-grad)"} />
          </svg>
        );
      })}
    </div>
  );
}
