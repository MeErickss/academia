"use client";

import { useId } from "react";
import { formatShortDate } from "@/lib/dates";
import { fmt } from "@/lib/stats";

export interface ChartPoint {
  x: number;
  y: number;
}

/** Gráfico de linha simples, no estilo "pincelada". */
export function LineChart({
  points,
  unit = "",
  color = "var(--sun-deep)",
  height = 150,
  emptyText = "Ainda não tem dados suficientes.",
}: {
  points: ChartPoint[];
  unit?: string;
  color?: string;
  height?: number;
  emptyText?: string;
}) {
  const gid = useId().replace(/:/g, "");
  if (points.length < 2) {
    return <p className="py-6 text-center text-sm text-ink-3">{points.length === 1 ? `Primeiro registro: ${fmt(points[0].y)} ${unit}. Continue registrando!` : emptyText}</p>;
  }
  const W = 340;
  const H = height;
  const pad = { l: 8, r: 8, t: 22, b: 22 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const spanY = maxY - minY;
  minY -= spanY * 0.15;
  maxY += spanY * 0.15;
  const sx = (x: number) => pad.l + ((x - minX) / (maxX - minX || 1)) * (W - pad.l - pad.r);
  const sy = (y: number) => pad.t + (1 - (y - minY) / (maxY - minY)) * (H - pad.t - pad.b);
  const pts = points.map((p) => [sx(p.x), sy(p.y)] as const);

  // curva suave (Catmull-Rom → Bézier)
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  const area = `${d} L${pts[pts.length - 1][0]},${H - pad.b} L${pts[0][0]},${H - pad.b} Z`;
  const maxI = ys.indexOf(Math.max(...ys));
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Gráfico: de ${fmt(ys[0])} para ${fmt(ys[ys.length - 1])} ${unit}`}>
      <defs>
        <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#area-${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" filter="url(#wc)" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4.5 : 2.6} fill={i === pts.length - 1 ? color : "var(--card)"} stroke={color} strokeWidth="2" />
      ))}
      <text x={pts[maxI][0]} y={pts[maxI][1] - 9} textAnchor={maxI === 0 ? "start" : maxI === pts.length - 1 ? "end" : "middle"} fontSize="11" fontWeight="800" fill="var(--ink-2)">
        {fmt(ys[maxI])} {unit}
      </text>
      {maxI !== pts.length - 1 && (
        <text x={last[0]} y={last[1] - 9} textAnchor="end" fontSize="11" fontWeight="800" fill="var(--ink)">
          {fmt(ys[ys.length - 1])} {unit}
        </text>
      )}
      <text x={pad.l} y={H - 5} fontSize="10" fill="var(--ink-3)">
        {formatShortDate(minX)}
      </text>
      <text x={W - pad.r} y={H - 5} textAnchor="end" fontSize="10" fill="var(--ink-3)">
        {formatShortDate(maxX)}
      </text>
    </svg>
  );
}
