import type { Slug } from "react-muscle-highlighter";
import type { Muscle } from "./types";

export const MUSCLE_LABEL: Record<Muscle, string> = {
  quadriceps: "Quadríceps",
  gluteos: "Glúteos",
  posterior: "Posterior de coxa",
  panturrilha: "Panturrilha",
  adutores: "Parte interna da coxa",
  abdutores: "Glúteo lateral",
  costas: "Costas",
  lombar: "Lombar",
  trapezio: "Trapézio",
  peito: "Peito",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebraco: "Antebraço",
  abdomen: "Abdômen",
  obliquos: "Oblíquos",
};

export const ALL_MUSCLES = Object.keys(MUSCLE_LABEL) as Muscle[];

/** Como cada músculo aparece no desenho do corpo (react-muscle-highlighter). */
export const MUSCLE_SLUGS: Record<Muscle, Slug[]> = {
  quadriceps: ["quadriceps"],
  gluteos: ["gluteal"],
  posterior: ["hamstring"],
  panturrilha: ["calves"],
  adutores: ["adductors"],
  abdutores: ["gluteal"],
  costas: ["upper-back"],
  lombar: ["lower-back"],
  trapezio: ["trapezius"],
  peito: ["chest"],
  ombros: ["deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  antebraco: ["forearm"],
  abdomen: ["abs"],
  obliquos: ["obliques"],
};

export interface Region {
  id: string;
  label: string;
  muscles: Muscle[];
}

/** Grupos maiores, usados nos cartõezinhos da tela de evolução. */
export const REGIONS: Region[] = [
  { id: "gluteos", label: "Glúteos", muscles: ["gluteos", "abdutores"] },
  { id: "pernas", label: "Pernas", muscles: ["quadriceps", "posterior", "panturrilha", "adutores"] },
  { id: "costas", label: "Costas", muscles: ["costas", "lombar", "trapezio"] },
  { id: "peito", label: "Peito", muscles: ["peito"] },
  { id: "ombros", label: "Ombros", muscles: ["ombros"] },
  { id: "bracos", label: "Braços", muscles: ["biceps", "triceps", "antebraco"] },
  { id: "core", label: "Abdômen", muscles: ["abdomen", "obliquos"] },
];
