import { Action } from '../shared/Controls';
import { FunnelChart, KPIs, LeadTable, Panel } from './Widgets';
import type { CrmLead } from '../shared/types';
export function Overview({ leads, open, go }: { leads: CrmLead[]; open: (id: string) => void; go: () => void }) {
 return <><KPIs items={[
 ['Leads capturados','1.284','+18% vs. semana anterior'],['Conversão total','14,2%','+1,6 p.p.'],['Abandono de checkout','38%','+4 p.p. atenção','danger'],['Tempo médio até pagar','11 min','do quiz ao PIX confirmado','muted'],['Receita PIX','R$ 8.942','182 pedidos · ticket R$ 49,13','muted']]} />
 <div className="crm-two"><Panel title="Funil por etapa" subtitle="Quantos leads chegaram em cada etapa e a conversão para a próxima."><FunnelChart /></Panel><Panel title="Precisam de contato hoje" subtitle="Parados há mais de 30 min com alta intenção.">{[['47 no checkout','geraram ensaio, não pagaram o PIX'],['112 sem fotos','pararam na etapa de selfies'],['23 imagens expiram','retenção de 24h termina em menos de 3h']].map(([a,b]) => <Action key={a} className="crm-alert" onClick={go}><div><b>{a}</b><span>{b}</span></div><b>Ver</b></Action>)}</Panel></div>
 <Panel title="Leads recentes"><LeadTable leads={leads.slice(0,5)} open={open} /></Panel></>;
}
export function FunnelPage() { return <><KPIs items={ [['Conversão total','14,2%','+1,6 p.p.'],['Maior queda','−35%','Estilo → Fotos','danger'],['Gerou e não pagou','47','hoje','warning']] } /><div className="crm-two"><Panel title="Etapas" subtitle="Percentual é a conversão da etapa anterior."><FunnelChart /></Panel><Panel title="Conversão por estilo" subtitle="Leads que pagaram.">{[['Corporativo','31','+2'],['Aniversário','24','−1'],['Lifestyle','19','+3'],['Com Pet','12','+1']].map(([s,p,d]) => <div className="crm-setting-row" key={s}><span>{s}</span><b>{p}%<small className={d?.startsWith('+') ? 'ff-success' : 'ff-danger'}>{d} p.p.</small></b></div>)}</Panel></div></>; }
