import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { apiService } from "@/lib/api";
import { Action, Toggle } from "../shared/Controls";
import { STYLES, styleName } from "../shared/catalog";
import type { FlowReference, StyleId } from "../shared/types";
import { Panel } from "./Widgets";
export function LibraryPage({
  references,
  refresh,
}: {
  references: FlowReference[];
  refresh: () => Promise<void>;
}) {
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<FlowReference>();
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const filtered = references.filter((r) => filter === "Todos" || r.style === filter);
  async function upload(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice("Selecione uma imagem JPG, PNG ou WebP.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const image = new Image();
      const dataUrl = reader.result;
      image.onload = () => {
        if (
          image.naturalHeight < 1200 ||
          Math.abs(image.naturalWidth / image.naturalHeight - 0.75) > 0.08
        ) {
          setNotice("Use uma imagem vertical 3:4, com pelo menos 1200px de altura.");
          return;
        }
        const ref: FlowReference = {
          id: crypto.randomUUID(),
          code: `#CORP-M-${String(references.length + 1).padStart(3, "0")}`,
          style: "corp",
          gender: "female",
          image: dataUrl,
          active: false,
          choices: 0,
        };
        void apiService.prototype.addReference(ref).then(async () => {
          await refresh();
          setSelected(ref);
          setNotice("Referência enviada. Configure e ative no quiz.");
        });
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }
  return (
    <>
      <Action className="ff-small" onClick={() => input.current?.click()}>
        <Upload size={16} />
        Subir referências
      </Action>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {notice && (
        <p role="status" className="ff-success ff-space">
          {notice}
        </p>
      )}
      <div className="crm-tabs ff-space">
        {[{ id: "Todos", short: "Todos" }, ...STYLES].map((s) => (
          <Action
            key={s.id}
            className={filter === s.id ? "on" : ""}
            onClick={() => setFilter(s.id)}
          >
            {s.short}
          </Action>
        ))}
      </div>
      <div className="crm-side">
        <div className="crm-library-grid">
          {filtered.map((r) => (
            <Action
              className={`crm-library-tile ${selected?.id === r.id ? "selected" : ""}`}
              key={r.id}
              aria-label={r.code}
              onClick={() => {
                setSelected({ ...r });
                setNotice("");
              }}
            >
              <div className="crm-library-image">
                <img src={r.image} alt={r.code} />
                <span className={`ff-pill ${r.active ? "success" : "muted"}`}>
                  {r.active ? "Ativa" : "Inativa"}
                </span>
              </div>
              <div>
                <b>{r.code}</b>
                <span>
                  {styleName(r.style)} · {r.gender === "female" ? "Mulher" : "Homem"} · {r.choices}{" "}
                  escolhas
                </span>
              </div>
            </Action>
          ))}
        </div>
        <div>
          {selected ? (
            <Panel title={selected.code}>
              <label className="ff-label">
                Estilo
                <select
                  className="ff-input"
                  value={selected.style}
                  onChange={(e) => setSelected({ ...selected, style: e.target.value as StyleId })}
                >
                  {STYLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.short}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ff-label">Gênero</label>
              <div className="crm-tabs">
                {(["female", "male"] as const).map((g) => (
                  <Action
                    className={selected.gender === g ? "on" : ""}
                    key={g}
                    onClick={() => setSelected({ ...selected, gender: g })}
                  >
                    {g === "female" ? "Mulher" : "Homem"}
                  </Action>
                ))}
              </div>
              <div className="crm-setting-row">
                <span>Ativa no quiz</span>
                <Toggle
                  label="Ativa no quiz"
                  checked={selected.active}
                  onChange={() => setSelected({ ...selected, active: !selected.active })}
                />
              </div>
              <Action
                className="ff-primary ff-wide"
                onClick={() => {
                  void apiService.prototype.saveReference(selected).then(async () => {
                    await refresh();
                    setNotice("Alterações salvas ✓");
                  });
                }}
              >
                Salvar alterações
              </Action>
            </Panel>
          ) : (
            <p className="ff-sub">Selecione uma referência.</p>
          )}
        </div>
      </div>
    </>
  );
}
