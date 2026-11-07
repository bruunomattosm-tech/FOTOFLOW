import { useState } from "react";
import { Action } from "../shared/Controls";
import type { CrmLead } from "../shared/types";
import { LeadTable } from "./Widgets";
export function LeadsPage({ leads, open }: { leads: CrmLead[]; open: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Todos");
  const filtered = leads.filter(
    (l) =>
      `${l.name} ${l.phone} ${l.email}`.toLowerCase().includes(query.toLowerCase()) &&
      (tab === "Todos" ||
        (tab === "Pagaram"
          ? l.tone === "success"
          : tab === "Abandonaram"
            ? l.tone === "danger"
            : !["success", "danger"].includes(l.tone))),
  );
  return (
    <>
      <input
        className="ff-input crm-search"
        aria-label="Buscar leads"
        placeholder="Buscar por nome, telefone ou e-mail"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="crm-tabs">
        {["Todos", "Em andamento", "Pagaram", "Abandonaram"].map((t) => (
          <Action className={tab === t ? "on" : ""} key={t} onClick={() => setTab(t)}>
            {t}
          </Action>
        ))}
      </div>
      <LeadTable leads={filtered} open={open} />
      <p className="ff-sub ff-space">
        Mostrando {filtered.length} de {leads.length} leads de demonstração
      </p>
    </>
  );
}
