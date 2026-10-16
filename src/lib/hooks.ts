"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, useSyncExternalStore } from "react";
import { db } from "./db";
import type { Exercise, Plan, Profile, Session } from "./types";

export function useProfile(): Profile | null | undefined {
  return useLiveQuery(async () => (await db.profile.get("me")) ?? null, []);
}

export function usePlans(): Plan[] | undefined {
  return useLiveQuery(() => db.plans.orderBy("order").toArray(), []);
}

export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(() => db.exercises.toArray(), []);
}

export function useExerciseMap(): Map<string, Exercise> | undefined {
  const list = useExercises();
  return list ? new Map(list.map((e) => [e.id, e])) : undefined;
}

/** Treinos concluídos, do mais antigo para o mais novo. */
export function useDoneSessions(): Session[] | undefined {
  return useLiveQuery(() => db.sessions.where("status").equals("done").sortBy("startedAt"), []);
}

export function useActiveSession(): Session | null | undefined {
  return useLiveQuery(async () => (await db.sessions.where("status").equals("active").first()) ?? null, []);
}

/** Atualiza a cada `ms` (para cronômetros). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

const noopSubscribe = () => () => {};

/** Está aberto como app (Tela de Início) e não numa aba do Safari? */
export function useIsStandalone() {
  return useSyncExternalStore(noopSubscribe, isStandalone, () => false);
}

export function useIsIOS() {
  return useSyncExternalStore(noopSubscribe, isIOS, () => false);
}
