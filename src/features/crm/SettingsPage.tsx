import { useState } from "react";
import { apiService } from "@/lib/api";
import type { BusinessSettings } from "../shared/types";
import { Action, Toggle } from "../shared/Controls";
import { AISettings } from "../shared/AISettings";
import { Panel } from "./Widgets";
export function SettingsPage({
  settings,
  refresh,
}: {
  settings: BusinessSettings;
  refresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const change = (next: BusinessSettings) => {
    setDraft(next);
    setSaved(false);
  };
  async function save() {
    if (
      draft.packages.some((p) => !Number.isFinite(p.cents) || p.cents <= 0) ||
      draft.pixMinutes <= 0
    ) {
      setError("Informe preços e prazo PIX válidos.");
      return;
    }
    await apiService.prototype.saveSettings(draft);
    await refresh();
    setSaved(true);
    setError("");
  }
  return (
    <>
      <div className="crm-settings-save">
        <Action
          className="ff-primary"
          onClick={() => {
            void save();
          }}
        >
          {saved ? "Configurações salvas ✓" : "Salvar alterações"}
        </Action>
        {error && (
          <p role="alert" className="ff-danger">
            {error}
          </p>
        )}
      </div>
      <div className="crm-two equal">
        <Panel title="Pacotes e preços" subtitle="Valores exibidos no checkout.">
          {draft.packages.map((p) => (
            <div className="crm-setting-row" key={p.id}>
              <span>{p.count} fotos</span>
              <label className="crm-price">
                R$
                <input
                  className="ff-input"
                  aria-label={`Preço ${p.count} fotos`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={p.cents / 100}
                  onChange={(e) =>
                    change({
                      ...draft,
                      packages: draft.packages.map((item) =>
                        item.id === p.id
                          ? { ...item, cents: Math.round(Number(e.target.value) * 100) }
                          : item,
                      ),
                    })
                  }
                />
              </label>
            </div>
          ))}
        </Panel>
        <Panel title="Regras do sistema" subtitle="Controle privacidade e pagamento.">
          {(
            [
              ["retention", "Apagar selfies em 24h", "Se o cliente não pagar"],
              ["watermark", "Marca d’água na prévia", "Removida após o pagamento"],
              [
                "autoPix",
                "Confirmar PIX automaticamente",
                "Libera a imagem ao receber o pagamento",
              ],
              [
                "emailLink",
                "Login sem senha por e-mail",
                "Disponível após conectar envio de e-mails",
              ],
            ] as const
          ).map(([key, title, detail]) => (
            <div className="crm-setting-row" key={key}>
              <div>
                {title}
                <small>{detail}</small>
              </div>
              <Toggle
                checked={draft[key]}
                label={title}
                onChange={() => change({ ...draft, [key]: !draft[key] })}
              />
            </div>
          ))}
        </Panel>
        <Panel title="Chave PIX">
          <label className="ff-label">
            Chave de recebimento
            <input
              className="ff-input"
              value={draft.pixKey}
              placeholder="Sua chave PIX"
              onChange={(e) => change({ ...draft, pixKey: e.target.value })}
            />
          </label>
          <label className="ff-label">
            Expiração do código (minutos)
            <input
              className="ff-input"
              type="number"
              min="1"
              value={draft.pixMinutes}
              onChange={(e) => change({ ...draft, pixMinutes: Number(e.target.value) })}
            />
          </label>
        </Panel>
        <Panel title="Mensagem de recuperação">
          <label className="ff-label">
            Enviada pelo WhatsApp
            <textarea
              className="ff-input crm-message"
              value={draft.message}
              onChange={(e) => change({ ...draft, message: e.target.value })}
            />
          </label>
        </Panel>
      </div>
      <Panel
        title="Configurações de IA"
        subtitle="WaveSpeed AI · Nano Banana 2.1 · GPT 2.5 Flare · Sunburst"
      >
        <AISettings />
      </Panel>
    </>
  );
}
