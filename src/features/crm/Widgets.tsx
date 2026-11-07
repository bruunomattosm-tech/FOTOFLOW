import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { FUNNEL } from "./sampleData";
import type { CrmLead } from "../shared/types";
import { styleName } from "../shared/catalog";
export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="crm-panel">
      <h3>{title}</h3>
      {subtitle && <p className="ff-sub">{subtitle}</p>}
      {children}
    </section>
  );
}
export function KPIs({ items }: { items: [string, string, string, string?][] }) {
  return (
    <div className="crm-kpis">
      {items.map(([label, value, detail, tone]) => (
        <div className="crm-kpi" key={label}>
          <small>{label}</small>
          <b>{value}</b>
          <span className={`ff-${tone || "success"}`}>{detail}</span>
        </div>
      ))}
    </div>
  );
}
export function FunnelChart() {
  return (
    <div className="crm-funnel">
      {FUNNEL.map(([label, count], i) => (
        <div className="crm-funnel-row" key={label}>
          <span>{label}</span>
          <progress max={1284} value={count} />
          <b>
            {count.toLocaleString("pt-BR")}{" "}
            <small>
              {i ? `${Math.round((count / (FUNNEL[i - 1]?.[1] || count)) * 100)}%` : ""}
            </small>
          </b>
        </div>
      ))}
    </div>
  );
}
export function WhatsApp({
  lead,
  message,
  children = "WhatsApp",
}: {
  lead: CrmLead;
  message?: string;
  children?: ReactNode;
}) {
  const phone = lead.phone.replace(/\D/g, "");
  return (
    <a
      className="ff-small ff-wa"
      href={`https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}?text=${encodeURIComponent(message || `Oi, ${lead.name.split(" ")[0]}! Seu ensaio FotoFlow está aguardando você.`)}`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      <MessageCircle size={15} />
      {children}
    </a>
  );
}
export function LeadTable({ leads, open }: { leads: CrmLead[]; open: (id: string) => void }) {
  return (
    <div className="crm-table-wrap">
      <table>
        <thead>
          <tr>
            {["Lead", "Contato", "Estilo", "Etapa atual", "Progresso", "Última ação", ""].map(
              (t, i) => (
                <th key={i}>{t}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr
              key={l.id}
              tabIndex={0}
              onClick={() => open(l.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") open(l.id);
              }}
            >
              <td>
                <b>{l.name}</b>
                <br />
                <small>
                  {l.gender === "female" ? "Mulher" : "Homem"} · {l.city}
                </small>
              </td>
              <td>
                {l.phone}
                <br />
                <small>{l.email}</small>
              </td>
              <td>{styleName(l.style)}</td>
              <td>
                <span className={`ff-pill ${l.tone}`}>{l.stage}</span>
              </td>
              <td>
                <progress max={100} value={l.progress} />
                <small>{l.activity}</small>
              </td>
              <td>
                <small>{l.when}</small>
              </td>
              <td>
                <WhatsApp lead={l} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!leads.length && (
        <p className="ff-sub">Nenhum lead encontrado. Tente outro nome ou limpe a busca.</p>
      )}
    </div>
  );
}
