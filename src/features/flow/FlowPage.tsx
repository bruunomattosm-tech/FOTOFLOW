import { ChoiceSteps } from "./ChoiceSteps";
import { Sparkles, ArrowRight } from "lucide-react";
import { Action, Back, ReferenceGrid } from "../shared/Controls";
import { AISettings } from "../shared/AISettings";
import { formatMoney, STEPS } from "../shared/catalog";
import { CaptureStep } from "./CaptureStep";
import { LeadStep } from "./LeadStep";
import { GenerationStep } from "./GenerationStep";
import { DownloadButton, Photo } from "./Photos";
import { PixStep } from "./PixStep";
import { useFlow } from "./useFlow";
import "../shared/prototype.css";
export default function FlowPage() {
  const f = useFlow();
  const index = STEPS.indexOf(f.step);
  const url = f.results[0]?.urlFinal || f.photos[0] || "";
  const previous = {
    style: "gender",
    refs: "style",
    capture: "refs",
    lead: "capture",
    pack: "result",
    pix: "pack",
    batch: "paid",
  } as const;
  const back = f.step in previous ? previous[f.step as keyof typeof previous] : undefined;
  const cta = (text: string, action: () => void, disabled = false) => (
    <Action className="ff-cta" disabled={disabled || f.busy} onClick={action}>
      {f.busy ? "Aguarde…" : text}
      <ArrowRight size={18} />
    </Action>
  );
  return (
    <div className="ff-theme ff-flow">
      <div className="ff-flow-inner">
        <header className="ff-flow-header">
          <a href="/" className="ff-logo">
            <Sparkles size={18} />
            FotoFlow
          </a>
          <div className="ff-row ff-header-actions">
            <AISettings compact />
            <span>{index + 1}/13</span>
          </div>
        </header>
        <progress className="ff-step-bar" value={index + 1} max={13} />
        {back && <Back onClick={() => f.go(back)} />}
        <ChoiceSteps f={f} cta={cta} />
        {f.step === "capture" && (
          <>
            <CaptureStep photos={f.photos} onChange={f.setPhotos} />
            {cta("Gerar meu ensaio", () => f.go("lead"), f.photos.filter(Boolean).length < 5)}
          </>
        )}
        {f.step === "lead" && (
          <>
            <LeadStep lead={f.lead} onChange={f.setLead} error={f.error} />
            {cta("Começar a criar", () => {
              void f.saveLead();
            })}
          </>
        )}
        {(f.step === "gen" || f.step === "gen2") && (
          <>
            <GenerationStep batch={f.step === "gen2"} percent={f.percent} status={f.status} />
            {f.error && (
              <div className="ff-notice danger" role="alert">
                {f.error}
                <Action
                  className="ff-small"
                  onClick={() => f.go(f.step === "gen" ? "lead" : "batch")}
                >
                  Voltar e tentar novamente
                </Action>
              </div>
            )}
          </>
        )}
        {f.step === "result" && (
          <>
            <h1>Seu ensaio está pronto</h1>
            <p className="ff-sub">Veja a prévia. Desbloqueie para baixar sem marca d’água.</p>
            <Photo url={url} locked />
            <p className="ff-sub ff-fine ff-space">
              Ela fica guardada por 24h. Depois, será apagada.
            </p>
            {cta("Desbloquear esta imagem", () => f.go("pack"))}
          </>
        )}
        {f.step === "pack" && (
          <>
            <h1>Escolha seu pacote</h1>
            <p className="ff-sub">A imagem que você já viu está inclusa em todos.</p>
            <div className="ff-options">
              {f.settings.packages.map((p) => (
                <Action
                  key={p.id}
                  className={`ff-option ff-package ${p.id === f.pack?.id ? "selected" : ""}`}
                  aria-pressed={p.id === f.pack?.id}
                  onClick={() => f.setPack(p)}
                >
                  {p.count === 6 && <span className="ff-tag">RECOMENDADO</span>}
                  <strong>{formatMoney(p.cents)}</strong>
                  <b>{p.count} fotos</b>
                  <span>{p.count - 1} novas para criar com as referências que você escolher</span>
                </Action>
              ))}
            </div>
            {cta(
              "Pagar com PIX",
              () => {
                void f.createOrder();
              },
              !f.pack,
            )}
          </>
        )}
        {f.step === "pix" && f.pack && (
          <>
            <PixStep pack={f.pack} code={f.pixCode} />
            {cta("Simular pagamento confirmado", () => {
              void f.confirmPayment();
            })}
          </>
        )}
        {f.step === "paid" && (
          <>
            <div className="ff-notice success">✓ Pagamento confirmado.</div>
            <h1>Sua primeira foto</h1>
            <Photo url={url} />
            <DownloadButton url={url} index={0} onError={f.setError} />
            <p className="ff-sub ff-space">
              Você ainda tem {f.remaining} fotos para criar neste pacote.
            </p>
            {cta(`Criar as ${f.remaining} imagens restantes`, () => {
              f.setSelected([]);
              f.go("batch");
            })}
          </>
        )}
        {f.step === "batch" && (
          <>
            <h1>Escolha as referências</h1>
            <p className="ff-sub">Selecione {f.remaining} para criar tudo de uma vez.</p>
            <div className="ff-count">
              <span>Selecionadas</span>
              <b>
                {f.selected.length} de {f.remaining}
              </b>
            </div>
            <ReferenceGrid refs={f.refs} selected={f.selected} onSelect={f.toggle} />
            {cta(
              f.selected.length < f.remaining
                ? `Faltam ${f.remaining - f.selected.length}`
                : "Criar meu ensaio",
              () => f.go("gen2"),
              f.selected.length !== f.remaining,
            )}
          </>
        )}
        {f.step === "final" && (
          <>
            <h1>Seu ensaio completo</h1>
            <p className="ff-sub">{f.results.length} fotos prontas para baixar.</p>
            <div className="ff-reference-grid">
              {f.results.map((r, i) => (
                <div key={r.id}>
                  <Photo url={r.urlFinal || url} />
                  <DownloadButton url={r.urlFinal || url} index={i} onError={f.setError} />
                </div>
              ))}
            </div>
            {cta("Criar outro ensaio", () => {
              f.setPhotos([]);
              f.setPack(undefined);
              f.setSelected([]);
              f.setReferenceId("");
              f.go("style");
            })}
          </>
        )}
        {f.error && !["lead", "gen", "gen2"].includes(f.step) && (
          <p className="ff-danger" role="alert">
            {f.error}
          </p>
        )}
        <div className="ff-mode-label">Modo demonstração</div>
      </div>
    </div>
  );
}
