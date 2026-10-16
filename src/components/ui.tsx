"use client";

import { Check, ChevronDown, X } from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Brush, Cat, type CatPose } from "./art";
import type { PlanColor } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "sun" | "soft" | "ghost" | "danger" | "outline";

const VARIANTS: Record<Variant, string> = {
  sun: "bg-sun text-on-sun shadow-soft active:brightness-95",
  soft: "bg-card-2 text-ink border border-line active:bg-sun-pale",
  outline: "border border-line text-ink active:bg-card-2",
  ghost: "text-ink-2 active:bg-card-2",
  danger: "bg-danger/10 text-danger active:bg-danger/20",
};

export function Button({
  variant = "soft",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 rounded-full font-bold transition disabled:opacity-40",
        size === "sm" && "h-9 px-3.5 text-sm",
        size === "md" && "h-11 px-5 text-[15px]",
        size === "lg" && "h-14 px-6 text-base",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cx(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-2 transition active:bg-card-2 disabled:opacity-30",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  style,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cx("rounded-3xl border border-line bg-card shadow-soft", onClick && "cursor-pointer", className)}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("mb-2 flex items-end justify-between gap-3", className)}>
      <h2 className="relative text-lg font-extrabold">
        <span className="relative z-10">{children}</span>
        <Brush className="absolute -bottom-1 left-0 z-0 h-3 w-full" />
      </h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, back }: { title: string; subtitle?: ReactNode; action?: ReactNode; back?: ReactNode }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3 pt-2">
      <div className="flex min-w-0 items-start gap-1">
        {back}
        <div className="min-w-0">
          <h1 className="font-hand text-[40px] font-bold leading-none text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

export function Chip({ children, className, tone = "sun" }: { children: ReactNode; className?: string; tone?: "sun" | "leaf" | "peach" | "sky" | "lilac" | "plain" }) {
  const tones = {
    sun: "bg-sun-pale text-ink-2",
    leaf: "bg-leaf-soft text-ink-2",
    peach: "bg-peach-soft text-ink-2",
    sky: "bg-sky-soft text-ink-2",
    lilac: "bg-lilac-soft text-ink-2",
    plain: "bg-card-2 text-ink-2",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}

export const PLAN_COLORS: Record<PlanColor, { label: string; strong: string; soft: string; tone: "sun" | "leaf" | "peach" | "sky" | "lilac" }> = {
  sol: { label: "Girassol", strong: "var(--sun)", soft: "var(--sun-pale)", tone: "sun" },
  folha: { label: "Folha", strong: "var(--leaf)", soft: "var(--leaf-soft)", tone: "leaf" },
  pessego: { label: "Pêssego", strong: "var(--peach)", soft: "var(--peach-soft)", tone: "peach" },
  ceu: { label: "Céu", strong: "var(--sky)", soft: "var(--sky-soft)", tone: "sky" },
  lilas: { label: "Lilás", strong: "var(--lilac)", soft: "var(--lilac-soft)", tone: "lilac" },
};

/** Fundo de "aquarela" na cor da ficha. */
export function washStyle(color: PlanColor): CSSProperties {
  const c = PLAN_COLORS[color] ?? PLAN_COLORS.sol;
  return {
    backgroundImage: `radial-gradient(120% 90% at 100% 0%, ${c.soft} 0%, transparent 60%), radial-gradient(80% 70% at 0% 100%, ${c.soft} 0%, transparent 70%)`,
  };
}

export function useLockBody(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Painel que sobe de baixo (padrão de app no iPhone). */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  tall,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tall?: boolean;
}) {
  useLockBody(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-[#2a1d0e]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cx(
          "animate-sheet-up relative flex w-full max-w-lg flex-col rounded-t-[28px] border border-line bg-card shadow-soft",
          tall ? "h-[92dvh]" : "max-h-[90dvh]",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-3">
          <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-line" />
          <div className="min-w-0 pt-2 text-lg font-extrabold">{title}</div>
          <IconButton label="Fechar" onClick={onClose} className="mt-1">
            <X size={20} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && <div className="pb-safe border-t border-line px-5 pt-3">{footer}</div>}
        {!footer && <div className="pb-safe" />}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmSheet({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  onConfirm,
  danger,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  danger?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {message && <div className="mb-5 text-[15px] leading-relaxed text-ink-2">{message}</div>}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={onClose}>
          Voltar
        </Button>
        <Button
          className="flex-1"
          variant={danger ? "danger" : "sun"}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-3">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-paper px-4 text-ink outline-none transition placeholder:text-ink-3 focus:border-sun focus:ring-2 focus:ring-sun/30";

export function parseNum(v: string): number | null {
  const s = v.replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function numToInput(n: number | null | undefined) {
  return n === null || n === undefined ? "" : String(n).replace(".", ",");
}

/** Campo numérico que aceita vírgula (teclado do iPhone em português). */
export function NumberInput({
  value,
  onCommit,
  decimal = true,
  className,
  placeholder,
  id,
  ariaLabel,
  live = false,
}: {
  value: number | null | undefined;
  onCommit: (n: number | null) => void;
  decimal?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
  /** Avisa a cada tecla (formulários), em vez de só ao sair do campo. */
  live?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      id={id}
      aria-label={ariaLabel}
      inputMode={decimal ? "decimal" : "numeric"}
      enterKeyHint="done"
      className={className ?? inputClass}
      placeholder={placeholder}
      value={draft ?? numToInput(value)}
      onFocus={(e) => {
        setDraft(numToInput(value));
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => {
        const v = e.target.value.replace(/[^\d.,]/g, "");
        setDraft(v);
        if (live) onCommit(parseNum(v));
      }}
      onBlur={() => {
        if (draft !== null) {
          const n = parseNum(draft);
          if (n !== (value ?? null)) onCommit(n);
        }
        setDraft(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("flex rounded-full border border-line bg-card-2 p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            "h-9 flex-1 rounded-full px-3 text-sm font-bold transition",
            o.value === value ? "bg-sun text-on-sun shadow-soft" : "text-ink-2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <span className="text-[15px]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-sun" : "bg-line")}
      >
        <span className={cx("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </label>
  );
}

export function EmptyState({ pose = "sleep", title, children }: { pose?: CatPose; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <Cat pose={pose} size={120} />
      <p className="mt-3 text-lg font-extrabold">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-2">{children}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-sun-soft border-t-sun" />
    </div>
  );
}

export interface SelectOption<T extends string | number> {
  value: T;
  /** Texto curto, mostrado no campo fechado */
  label: string;
  /** Linha extra, mostrada só na lista */
  hint?: ReactNode;
}

/**
 * Seletor no estilo do app. O <select> nativo abre a lista do sistema
 * (azul no Windows, roleta no iPhone) e quase não aceita estilo.
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  id,
  ariaLabel,
  title,
  className,
  compact = false,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  id?: string;
  ariaLabel?: string;
  title?: ReactNode;
  className?: string;
  /** versão pequena, em forma de pílula */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cx(
          compact ? "h-8 rounded-full border border-line bg-paper px-3 text-xs font-bold text-ink outline-none" : inputClass,
          "flex min-w-0 items-center justify-between gap-2 text-left",
          open && "border-sun ring-2 ring-sun/30",
          className,
        )}
      >
        <span className="min-w-0 truncate">{current?.label ?? "Escolher"}</span>
        <ChevronDown size={compact ? 14 : 18} className={cx("shrink-0 text-ink-3 transition", open && "rotate-180 text-sun-deep")} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title ?? ariaLabel}>
        <ul role="listbox" className="space-y-1.5 pb-1">
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={String(o.value)}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setOpen(false);
                    if (!selected) onChange(o.value);
                  }}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99]",
                    selected ? "border-sun bg-sun-pale" : "border-line bg-paper active:bg-card-2",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className={cx("block", selected ? "font-extrabold" : "font-bold")}>{o.label}</span>
                    {o.hint && <span className="block text-sm text-ink-2">{o.hint}</span>}
                  </span>
                  <span
                    className={cx(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      selected ? "bg-sun text-on-sun" : "border border-line",
                    )}
                  >
                    {selected && <Check size={16} strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}
