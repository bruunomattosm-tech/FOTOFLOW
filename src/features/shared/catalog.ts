import type { BusinessSettings, FlowReference, Gender, StyleId } from "./types";
import corpFemale from "@/assets/reference-corp-female.jpg";
import corpMale from "@/assets/reference-corp-male.jpg";
import anivFemale from "@/assets/reference-aniv-female.jpg";
import anivMale from "@/assets/reference-aniv-male.jpg";
import lifeFemale from "@/assets/reference-life-female.jpg";
import lifeMale from "@/assets/reference-life-male.jpg";
import petFemale from "@/assets/reference-pet-female.jpg";
import petMale from "@/assets/reference-pet-male.jpg";
const portraits = {
  corp: { female: corpFemale, male: corpMale },
  aniv: { female: anivFemale, male: anivMale },
  life: { female: lifeFemale, male: lifeMale },
  pet: { female: petFemale, male: petMale },
};
export const STEPS = [
  "gender",
  "style",
  "refs",
  "capture",
  "lead",
  "gen",
  "result",
  "pack",
  "pix",
  "paid",
  "batch",
  "gen2",
  "final",
] as const;
export const STYLES: {
  id: StyleId;
  title: string;
  short: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "corp",
    title: "Ensaio Corporativo",
    short: "Corporativo",
    description: "Perfil profissional, LinkedIn, currículo",
    icon: "💼",
  },
  {
    id: "aniv",
    title: "Ensaio de Aniversário",
    short: "Aniversário",
    description: "Para datas comemorativas",
    icon: "🎈",
  },
  {
    id: "life",
    title: "Ensaio Lifestyle",
    short: "Lifestyle",
    description: "Cenas urbanas, viagens, dia a dia",
    icon: "🌆",
  },
  {
    id: "pet",
    title: "Ensaio com seu Pet",
    short: "Com Pet",
    description: "Você e seu melhor amigo",
    icon: "🐾",
  },
];
export const SHOTS = [
  ["Frente", "Olhe direto para a câmera, rosto inteiro dentro do contorno"],
  ["Lado esquerdo", "Vire o rosto devagar para a esquerda"],
  ["Lado direito", "Vire o rosto devagar para a direita"],
  ["Sorrindo", "Sorria de frente, com naturalidade"],
  ["Corpo inteiro", "Suba uma foto de corpo inteiro da sua galeria"],
];
export const DEFAULT_SETTINGS: BusinessSettings = {
  packages: [
    { id: "starter", count: 3, cents: 2990 },
    { id: "pro", count: 6, cents: 4990 },
    { id: "executive", count: 10, cents: 7990 },
  ],
  retention: true,
  watermark: true,
  autoPix: true,
  emailLink: false,
  pixKey: "",
  pixMinutes: 30,
  message:
    "Oi, {nome}! Seu ensaio ficou pronto e fica guardado por 24h. Quer que eu reenvie o PIX?",
};
export const RETENTION_MS = 24 * 60 * 60 * 1000;
export const remainingPhotos = (count: number) => Math.max(0, count - 1);
export const canSelectReference = (selected: string[], id: string, count: number) =>
  selected.includes(id) || selected.length < remainingPhotos(count);
export const formatMoney = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const styleName = (id: StyleId) => STYLES.find((s) => s.id === id)?.short || "Corporativo";
export const makeReferences = (): FlowReference[] =>
  STYLES.flatMap((style) =>
    (["female", "male"] as Gender[]).flatMap((gender) =>
      Array.from({ length: 10 }, (_, i) => ({
        id: `${style.id}-${gender}-${i}`,
        code: `#${style.id.toUpperCase()}-${gender === "male" ? "H" : "M"}-${String(i * 7 + 3).padStart(3, "0")}`,
        style: style.id,
        gender,
        image: portraits[style.id][gender],
        active: true,
        choices: 0,
      })),
    ),
  );
