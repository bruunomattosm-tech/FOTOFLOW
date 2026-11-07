import { COUNTRIES, LOCALES, type Country } from '@/lib/i18n';
import { useState } from "react";
import { Action } from "../shared/Controls";
import type { CrmLead } from "../shared/types";
import { LeadTable } from "./Widgets";
export function LeadsPage({ leads, open }: { leads: CrmLead[]; open: (id: string) => void }) {
  const [country, setCountry] = useState<Country | "all">("all");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Todos");
  const filtered = leads.filter(
    (l) =>
      (country === "all" || (l.country || "BR") === country) &&
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
      <div className="ff-country-tabs"><Action className={country === "all" ? "ff-primary" : "ff-small"} onClick={() => setCountry("all")}>Todos</Action>{COUNTRIES.map(c => <Action key={c} className={country === c ? "ff-primary" : "ff-small"} onClick={() => setCountry(c)}>{LOCALES[c].flag} {LOCALES[c].name}</Action>)}</div>
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
