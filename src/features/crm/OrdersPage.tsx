import { ReportHeader } from '@/features/international/ReportHeader';
import { summarizeOrders, type ReportScope } from '@/features/international/reports';
import type { InternationalConfig } from '@/features/international/types';
import { CountryBadge } from '@/features/international/CountrySelector';
import { money } from '@/lib/i18n';
import { recoveryMessage } from '@/features/international/recovery';
import { useState } from "react";
import type { CrmLead, CrmOrder } from "../shared/types";
import { formatMoney } from "../shared/catalog";
import { Action } from "../shared/Controls";
import { KPIs, WhatsApp } from "./Widgets";
export function OrdersPage({ orders, leads, config }: { config: InternationalConfig; orders: CrmOrder[]; leads: CrmLead[] }) {
  const [tab, setTab] = useState("Todos");
  const [scope, setScope] = useState<ReportScope>("all");
  const summary = summarizeOrders(orders, scope, config);
  const { paid, pending, revenue } = summary;
  const display = (cents: number) => scope === "all" && summary.missing.length ? "—" : money(cents, scope === "all" ? "BR" : scope);
  return (
    <>
      <ReportHeader scope={scope} setScope={setScope} orders={orders} config={config} />
      <KPIs
        items={[
          ["Receita", display(revenue), `${paid.length} pedidos`],
          [
            "Pendentes",
            display(summary.pendingAmount),
            `${pending.length} pedidos`,
            "warning",
          ],
          ["Expirados", String(summary.filtered.filter((o) => o.status === "Expirado").length), "", "danger"],
          [
            "Ticket médio",
            display(summary.average),
            "",
            "muted",
          ],
        ]}
      />
      <div className="crm-tabs">
        {["Todos", "Pago", "Pendente", "Expirado"].map((t) => (
          <Action key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {t}
          </Action>
        ))}
      </div>
      <div className="crm-table-wrap">
        <table>
          <thead>
            <tr>
              {["Pedido", "Cliente", "Pacote", "Valor", "Status", "Quando", ""].map((t, i) => (
                <th key={i}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.filtered
              .filter((o) => tab === "Todos" || o.status === tab)
              .map((o) => {
                const lead = leads.find((l) => o.leadId ? l.id === o.leadId : l.name === o.name);
                return (
                  <tr key={o.id}>
                    <td>
                      <b>{o.id}</b>
                    </td>
                    <td><div className="ff-inline-badge">{o.name}<CountryBadge country={o.country} /></div></td>
                    <td>{o.count} fotos</td>
                    <td>{money(o.cents, o.country || "BR")}</td>
                    <td>
                      <span
                        className={`ff-pill ${o.status === "Pago" ? "success" : o.status === "Pendente" ? "warning" : "danger"}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <small>{o.when}</small>
                    </td>
                    <td>
                      {o.status !== "Pago" && lead && (
                        <WhatsApp
                          lead={lead}
                          message={`Oi, ${lead.name.split(" ")[0]}! Seu pedido ${o.id} de ${o.count} fotos por ${money(o.cents, o.country || "BR")} está aguardando. Vamos retomar seu PIX?`}
                        >
                          Retomar pagamento
                        </WhatsApp>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
}
