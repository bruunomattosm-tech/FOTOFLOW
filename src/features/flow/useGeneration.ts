import { useEffect, useRef } from "react";
import { apiService } from "@/lib/api";
import type { Ensaio } from "@/types/domain";
import type { CrmLead, FlowReference, FlowStep, Gender, StyleId } from "../shared/types";
interface GenerationParams {
 step: FlowStep; customerId?: string; selected: string[]; referenceId: string; references: FlowReference[]; style: StyleId; photos: string[]; gender: Gender; results: Ensaio[];
 setPercent: (percent: number) => void; setStatus: (message: string) => void; setResults: (results: Ensaio[]) => void; setStep: (step: FlowStep) => void; setError: (message: string) => void;
 updateCustomer: (stage: string, progress: number, tone: CrmLead['tone'], images: string[]) => Promise<void>;
}
export function useGeneration({ step,customerId,selected,referenceId,references,style,photos,gender,results,setPercent,setStatus,setResults,setStep,setError,updateCustomer }: GenerationParams) {
 const generation = useRef(false);
  useEffect(() => {
    if ((step !== "gen" && step !== "gen2") || generation.current || !customerId) return;
    generation.current = true;
    let active = true;
    setPercent(0);
    setStatus("Analisando suas fotos…");
    const leadId = customerId;
    const ids = step === "gen2" ? selected : [referenceId];
    async function generate() {
      try {
        const generated: Ensaio[] = [];
        for (const [index, id] of ids.entries()) {
          const ref = references.find((r) => r.id === id);
          if (!ref) throw new Error("Referência indisponível. Volte e escolha outra.");
          const result = await apiService.gerarEnsaio({
            leadId,
            estiloId: style,
            referenciaId: id,
            referenceImage: ref.image,
            userImages: photos,
            gender,
            model: localStorage.getItem("fotoflow_model") || "nano-banana-2.1",
            resolution:
              localStorage.getItem("fotoflow_resolution") === "4K"
                ? "4K"
                : localStorage.getItem("fotoflow_resolution") === "2K"
                  ? "2K"
                  : "1K",
            onProgress: (message, pct = 0) => {
              if (active) {
                setPercent(Math.round((index * 100 + pct) / ids.length));
                setStatus(message);
              }
            },
          });
          generated.push(result);
        }
        if (!active) return;
        const all = step === "gen2" ? [...results, ...generated] : generated;
        setResults(all);
        setPercent(100);
        await updateCustomer(
          step === "gen2" ? "Concluído" : "Gerou ensaio",
          step === "gen2" ? 100 : 75,
          step === "gen2" ? "success" : "warning",
          all.map((r) => r.urlFinal || r.urlPreview || "").filter(Boolean),
        );
        setStep(step === "gen2" ? "final" : "result");
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : "Falha na geração.");
      } finally {
        generation.current = false;
      }
    }
    void generate();
    return () => {
      active = false;
    };
  }, [step]);
}
