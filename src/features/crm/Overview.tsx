import { useState } from 'react';
import { ReportHeader } from '@/features/international/ReportHeader';
import { summarizeOrders, type ReportScope } from '@/features/international/reports';
import type { InternationalConfig } from '@/features/international/types';
import type { CrmOrder } from '@/features/shared/types';
import { money } from '@/lib/i18n';
import { CountryBadge } from '@/features/international/CountrySelector';
import { Action } from "../shared/Controls";
import { FunnelChart, KPIs, LeadTable, Panel } from "./Widgets";
import type { CrmLead } from "../shared/types";
export function Overview({
  leads, orders, config,
  open,
  go,
}: {
  leads: CrmLead[]; orders: CrmOrder[]; config: InternationalConfig;
  open: (id: string) => void;
  go: () => void;
}) {
  const [scope, setScope] = useState<ReportScope>("all");
  const summary = summarizeOrders(orders, scope, config);
  const filtered = leads.filter(l => scope === "all" || (l.country || "BR") === scope);
  const display = (cents: number) => scope === "all" && summary.missing.length ? "—" : money(cents, scope === "all" ? "BR" : scope);
  return (
    <>
      <ReportHeader scope={scope} setScope={setScope} orders={orders} config={config} />
      <KPIs
        items={[
          ["Leads capturados", String(filtered.length), "Neste ambiente"],
          ["Receita", display(summary.revenue), `${summary.paid.length} pedidos pagos`],
          ["Ticket médio", display(summary.average), "", "muted"],
          ["Pendentes", display(summary.pendingAmount), `${summary.pending.length} pedidos`, "warning"],
        ]}
      />
      <div className="crm-two">
        <Panel
          title="Funil por etapa"
          subtitle="Quantos leads chegaram em cada etapa e a conversão para a próxima."
        >
          <FunnelChart />
        </Panel>
        <Panel
          title="Precisam de contato hoje"
          subtitle="Parados há mais de 30 min com alta intenção."
        >
          {filtered.filter(l => l.tone !== "success").slice(0, 4).map(l => (
            <Action key={l.id} className="crm-alert" onClick={() => open(l.id)}><div><b>{l.name} <CountryBadge country={l.country} /></b><span>{l.stage}</span></div><b>Ver</b></Action>
          ))}
        </Panel>
      </div>
      <Panel title="Leads recentes">
        <LeadTable leads={filtered.slice(0, 5)} open={open} />
      </Panel>
    </>
  );
}
export function FunnelPage() {
  return (
    <>
      <KPIs
        items={[
          ["Conversão total", "14,2%", "+1,6 p.p."],
          ["Maior queda", "−35%", "Estilo → Fotos", "danger"],
          ["Gerou e não pagou", "47", "hoje", "warning"],
        ]}
      />
      <div className="crm-two">
        <Panel title="Etapas" subtitle="Percentual é a conversão da etapa anterior.">
          <FunnelChart />
        </Panel>
        <Panel title="Conversão por estilo" subtitle="Leads que pagaram.">
          {[
            ["Corporativo", "31", "+2"],
            ["Aniversário", "24", "−1"],
            ["Lifestyle", "19", "+3"],
            ["Com Pet", "12", "+1"],
          ].map(([s, p, d]) => (
            <div className="crm-setting-row" key={s}>
              <span>{s}</span>
              <b>
                {p}%
                <small className={d?.startsWith("+") ? "ff-success" : "ff-danger"}>{d} p.p.</small>
              </b>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
