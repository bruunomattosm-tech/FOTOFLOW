import { useState } from 'react';
import type { CrmLead, CrmOrder } from '../shared/types';
import { formatMoney } from '../shared/catalog';
import { Action } from '../shared/Controls';
import { KPIs, WhatsApp } from './Widgets';
export function OrdersPage({ orders,leads }: { orders: CrmOrder[]; leads: CrmLead[] }) {
 const [tab,setTab] = useState('Todos'); const paid = orders.filter(o => o.status === 'Pago');
 const revenue = paid.reduce((n,o) => n+o.cents,0); const pending = orders.filter(o => o.status === 'Pendente');
 return <><KPIs items={ [['Receita PIX',formatMoney(revenue),`${paid.length} pedidos`],['Pendentes',formatMoney(pending.reduce((n,o) => n+o.cents,0)),`${pending.length} pedidos`,'warning'],['Expirados',String(orders.filter(o => o.status === 'Expirado').length),'','danger'],['Ticket médio',formatMoney(paid.length ? Math.round(revenue/paid.length) : 0),'','muted']] } />
 <div className="crm-tabs">{['Todos','Pago','Pendente','Expirado'].map(t => <Action key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</Action>)}</div><div className="crm-table-wrap"><table><thead><tr>{['Pedido','Cliente','Pacote','Valor','Status','Quando',''].map((t,i) => <th key={i}>{t}</th>)}</tr></thead><tbody>{orders.filter(o => tab === 'Todos' || o.status === tab).map(o => { const lead = leads.find(l => l.name === o.name); return <tr key={o.id}><td><b>{o.id}</b></td><td>{o.name}</td><td>{o.count} fotos</td><td>{formatMoney(o.cents)}</td><td><span className={`ff-pill ${o.status === 'Pago' ? 'success' : o.status === 'Pendente' ? 'warning' : 'danger'}`}>{o.status}</span></td><td><small>{o.when}</small></td><td>{o.status !== 'Pago' && lead && <WhatsApp lead={lead} message={`Oi, ${lead.name.split(' ')[0]}! Seu pedido ${o.id} de ${o.count} fotos por ${formatMoney(o.cents)} está aguardando. Vamos retomar seu PIX?`}>Reenviar PIX</WhatsApp>}</td></tr>; })}</tbody></table></div></>;
}
