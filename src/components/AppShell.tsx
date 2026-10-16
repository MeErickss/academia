"use client";

import { Apple, ChartLine, ClipboardList, Home, PersonStanding } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { requestPersistentStorage, syncBuiltinExercises } from "@/lib/db";
import { useActiveSession, useProfile } from "@/lib/hooks";
import { CatColorProvider, CatFace, Logo, WatercolorBackdrop } from "./art";
import { Onboarding } from "./Onboarding";
import { cx } from "./ui";

const TABS = [
  { href: "/", label: "Hoje", icon: Home },
  { href: "/fichas", label: "Fichas", icon: ClipboardList },
  { href: "/comida", label: "Comida", icon: Apple },
  { href: "/evolucao", label: "Evolução", icon: ChartLine },
  { href: "/corpo", label: "Corpo", icon: PersonStanding },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/90 backdrop-blur-md">
      <ul className="mx-auto flex max-w-lg justify-around px-2 pt-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href) || (href === "/fichas" && pathname.startsWith("/exercicio"));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cx(
                  "mx-auto flex w-full max-w-[76px] flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition",
                  active ? "text-ink" : "text-ink-3",
                )}
              >
                <span className={cx("flex h-8 w-12 items-center justify-center rounded-full transition", active && "bg-sun text-on-sun")}>
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActiveWorkoutPill() {
  const active = useActiveSession();
  if (!active) return null;
  return (
    <Link
      href="/treino"
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-30 mx-auto flex max-w-md items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-paper shadow-soft"
    >
      <CatFace size={30} />
      <span className="min-w-0 flex-1">
        <span className="block text-xs opacity-75">Treino em andamento</span>
        <span className="block truncate text-sm font-bold">{active.planName}</span>
      </span>
      <span className="rounded-full bg-sun px-3 py-1 text-sm font-extrabold text-on-sun">Continuar</span>
    </Link>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Logo size={88} className="animate-spin-slow" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const profile = useProfile();

  useEffect(() => {
    syncBuiltinExercises().catch(() => {});
    requestPersistentStorage();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const inWorkout = pathname.startsWith("/treino");
  const hideNav = inWorkout || pathname.startsWith("/fichas/editar");

  return (
    <CatColorProvider value={profile?.catColor ?? "laranja"}>
      <WatercolorBackdrop />
      <div className="relative z-10">
        {profile === undefined ? (
          <Splash />
        ) : profile === null ? (
          <Onboarding />
        ) : (
          <>
            <main className={cx("mx-auto w-full max-w-lg px-4 pt-[calc(env(safe-area-inset-top)+12px)]", hideNav ? "pb-40" : "pb-36")}>
              {children}
            </main>
            {!hideNav && <ActiveWorkoutPill />}
            {!hideNav && <BottomNav pathname={pathname} />}
          </>
        )}
      </div>
    </CatColorProvider>
  );
}
