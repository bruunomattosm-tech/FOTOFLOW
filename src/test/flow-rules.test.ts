import { describe, expect, it } from "vitest";
import {
  canSelectReference,
  DEFAULT_SETTINGS,
  remainingPhotos,
  RETENTION_MS,
  STEPS,
  makeReferences,
} from "@/features/shared/catalog";
import { validLead } from "@/features/flow/LeadStep";
import { MOCK_PACOTES } from "@/data/mockData";
describe("Regras do fluxo FotoFlow", () => {
  it("oferece 3 fotos por R$ 29,90", () => {
    expect(DEFAULT_SETTINGS.packages[0]).toMatchObject({ count: 3, cents: 2990 });
    expect(MOCK_PACOTES[0]).toMatchObject({ quantidadeFotos: 3, precoCentavos: 2990 });
  });
  it("oferece 6 fotos por R$ 49,90", () => {
    expect(DEFAULT_SETTINGS.packages[1]).toMatchObject({ count: 6, cents: 4990 });
    expect(MOCK_PACOTES[1]).toMatchObject({ quantidadeFotos: 6, precoCentavos: 4990 });
  });
  it("oferece 10 fotos por R$ 79,90", () => {
    expect(DEFAULT_SETTINGS.packages[2]).toMatchObject({ count: 10, cents: 7990 });
    expect(MOCK_PACOTES[2]).toMatchObject({ quantidadeFotos: 10, precoCentavos: 7990 });
  });
  it("inclui a primeira foto no pacote", () => {
    expect(remainingPhotos(10)).toBe(9);
    expect(remainingPhotos(3)).toBe(2);
  });
  it("limita seleção ao saldo e permite desmarcar", () => {
    expect(canSelectReference(["a", "b"], "c", 3)).toBe(false);
    expect(canSelectReference(["a", "b"], "a", 3)).toBe(true);
  });
  it("disponibiliza referências suficientes para o maior pacote", () => {
    expect(
      makeReferences().filter((r) => r.gender === "female" && r.style === "pet").length,
    ).toBeGreaterThanOrEqual(9);
  });
  it("retém imagens não pagas por 24 horas", () => {
    expect(RETENTION_MS).toBe(86400000);
  });
  it("exige contato válido antes de gerar", () => {
    expect(validLead({ name: "Ana", phone: "11987654321", email: "ana@example.com" })).toBe(true);
    expect(validLead({ name: "Ana", phone: "123", email: "ana" })).toBe(false);
  });
  it("mantém as 13 etapas obrigatórias", () => {
    expect(STEPS).toEqual([
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
    ]);
  });
});
