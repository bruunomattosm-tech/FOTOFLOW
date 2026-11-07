import { TrackingSettings } from '@/components/crm/TrackingSettings';
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ChartNoAxesCombined,
  CreditCard,
  Images,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Download,
  ArrowUpRight,
} from "lucide-react";
import { Action } from "../shared/Controls";
import { usePrototype } from "../shared/usePrototype";
import { Overview, FunnelPage } from "./Overview";
import { LeadsPage } from "./LeadsPage";
import { LeadDetail } from "./LeadDetail";
import { OrdersPage } from "./OrdersPage";
import { LibraryPage } from "./LibraryPage";
import { SettingsPage } from "./SettingsPage";
import "../shared/prototype.css";
const NAV = [
  { id: "tracking", label: "Pixel & Rastreamento", icon: ChartNoAxesCombined, title: "Pixel & Rastreamento", sub: "Configuração por país e eventos desta sessão." },
  {
    id: "visao",
    label: "Visão geral",
    icon: LayoutDashboard,
    title: "Leads e funil",
    sub: "Acompanhe em que etapa cada lead está, onde parou e quem precisa de contato hoje.",
  },
  {
    id: "leads",
    label: "Leads",
    icon: Users,
    title: "Leads",
    sub: "Todos os contatos capturados no quiz, com etapa e última ação.",
  },
  {
    id: "funil",
    label: "Funil",
    icon: ChartNoAxesCombined,
    title: "Funil de conversão",
    sub: "Veja onde os leads desistem e quais estilos convertem melhor.",
  },
  {
    id: "pedidos",
    label: "Pedidos",
    icon: CreditCard,
    title: "Pedidos",
    sub: "Pagamentos confirmados, pendentes e expirados.",
  },
  {
    id: "biblioteca",
    label: "Biblioteca de Referências",
    icon: Images,
    title: "Biblioteca de Referências",
    sub: "As imagens ativas aparecem no quiz, depois que o cliente escolhe gênero e estilo.",
  },
  {
    id: "config",
    label: "Configurações",
    icon: Settings,
    title: "Configurações",
    sub: "Preços, retenção das imagens e mensagens do sistema.",
  },
];
export default function CrmPage() {
  const d = usePrototype();
  const [params, setParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const page = params.get("tela") || "visao";
  const active = NAV.find((n) => n.id === page) || NAV[0];
  const go = (id: string) => {
    setParams({ tela: id });
    window.scrollTo(0, 0);
  };
  const open = (id: string) => setParams({ tela: "lead", id });
  const lead = d.leads.find((l) => l.id === params.get("id"));
  function exportLeads() {
    const header = ["Nome", "Telefone", "E-mail", "Etapa"];
    const rows = d.leads.map((l) => [l.name, l.phone, l.email, l.stage]);
    const csv =
      "\uFEFF" +
      [header, ...rows]
        .map((row) => row.map((v) => `"${v.replaceAll('"', '""')}"`).join(";"))
        .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "fotoflow-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className={`ff-theme crm-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="crm-nav">
        <a href="/" className="ff-logo">
          <Sparkles size={19} />
          {!collapsed && (
            <>
              FotoFlow <small>CRM</small>
            </>
          )}
        </a>
        <div className="crm-nav-group">
          {!collapsed && <h6>Operação</h6>}
          {NAV.map((item, i) => (
            <div key={item.id}>
              {i === 4 && !collapsed && <h6>Conteúdo</h6>}
              <Action
                title={item.label}
                className={`crm-nav-item ${page === item.id || (page === "lead" && item.id === "leads") ? "on" : ""}`}
                onClick={() => go(item.id)}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Action>
            </div>
          ))}
        </div>
        <a className="crm-app-link" href="/app">
          <ArrowUpRight size={18} />
          {!collapsed && "Abrir ensaio"}
        </a>
        {!collapsed && (
          <div className="crm-profile">
            <div className="crm-avatar">AL</div>
            <div>
              <b>Ana Lopes</b>
              <small>Administradora</small>
            </div>
          </div>
        )}
      </aside>
      <main className="crm-main">
        <header className="crm-page-head">
          <div>
            <div className="crm-breadcrumb">
              <Action
                className="ff-icon-button"
                title={collapsed ? "Expandir menu" : "Recolher menu"}
                aria-label="Alternar menu"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
              </Action>
              CRM / {page === "lead" ? "Leads / " + (lead?.name || "") : active?.label}
              <span className="ff-pill muted">Demonstração</span>
            </div>
            {page !== "lead" && (
              <>
                <h1>{active?.title}</h1>
                <p className="ff-sub">{active?.sub}</p>
              </>
            )}
          </div>
          {page === "visao" && (
            <Action className="ff-primary" onClick={exportLeads}>
              <Download size={16} />
              Exportar leads
            </Action>
          )}
        </header>
        {page === "visao" && <Overview orders={d.orders} config={d.international} leads={d.leads} open={open} go={() => go("leads")} />}
        {page === "leads" && <LeadsPage leads={d.leads} open={open} />}
        {page === "lead" &&
          (lead ? (
            <LeadDetail config={d.international} orders={d.orders} key={lead.id} lead={lead} back={() => go("leads")} refresh={d.refresh} />
          ) : (
            <p className="ff-sub">Lead não encontrado.</p>
          ))}
        {page === "funil" && <FunnelPage />}
        {page === "pedidos" && <OrdersPage config={d.international} orders={d.orders} leads={d.leads} />}
        {page === "biblioteca" && <LibraryPage references={d.references} refresh={d.refresh} />}
        {page === "tracking" && <TrackingSettings />}
        {page === "config" && <SettingsPage config={d.international} key={JSON.stringify(d.settings)} settings={d.settings} refresh={d.refresh} />}
      </main>
    </div>
  );
}
