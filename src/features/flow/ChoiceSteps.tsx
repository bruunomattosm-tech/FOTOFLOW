import { useLocale } from '@/context/LocaleContext';
import { Action, ReferenceGrid } from "../shared/Controls";
import { STYLES } from "../shared/catalog";
import type { useFlow } from "./useFlow";
import type { ReactNode } from "react";
export function ChoiceSteps({ f, cta }: { f: ReturnType<typeof useFlow>; cta: (text: string, action: () => void, disabled?: boolean) => ReactNode }) {
 const { t, locale } = useLocale();
 return <>
        {f.step === "gender" && (
          <>
            <h1>{t("Quem vai fazer o ensaio?")}</h1>
            <p className="ff-sub">{t("Assim mostramos as referências certas para você.")}</p>
            <div className="ff-options">
              {(["female", "male"] as const).map((g) => (
                <Action
                  key={g}
                  className="ff-option"
                  onClick={() => {
                    f.setGender(g);
                    f.go("style");
                  }}
                >
                  <span className="ff-option-icon">{g === "female" ? "👩" : "👨"}</span>
                  <div>
                    <b>{g === "female" ? t("Mulher") : t("Homem")}</b>
                    <span>{t("Ver estilos")} {g === "female" ? t("femininos") : t("masculinos")}</span>
                  </div>
                </Action>
              ))}
            </div>
          </>
        )}
        {f.step === "style" && (
          <>
            <h1>{t("Escolha seu estilo")}</h1>
            <p className="ff-sub">{t("Cada estilo tem referências de pose e luz.")}</p>
            <div className="ff-options">
              {STYLES.map((s) => (
                <Action
                  key={s.id}
                  className="ff-option"
                  onClick={() => {
                    f.setStyle(s.id);
                    f.setReferenceId("");
                    f.go("refs");
                  }}
                >
                  <span className="ff-option-icon">{s.icon}</span>
                  <div>
                    <b>{t(s.title)}</b>
                    <span>{t(s.description)}</span>
                  </div>
                </Action>
              ))}
            </div>
          </>
        )}
        {f.step === "refs" && (
          <>
            <h1>{t(STYLES.find((s) => s.id === f.style)?.title || "")}</h1>
            <p className="ff-sub">{t("Toque na referência que mais combina com você.")}</p>
            <ReferenceGrid refs={f.refs} selected={[f.referenceId]} onSelect={f.setReferenceId} />
            {!f.refs.length && <p className="ff-sub">{t("Nenhuma referência ativa neste estilo.")}</p>}
            {cta("Usar esta referência", () => f.go("capture"), !f.referenceId)}
          </>
        )}
 </>;
}
