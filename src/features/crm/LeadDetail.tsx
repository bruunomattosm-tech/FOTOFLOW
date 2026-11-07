import { useEffect, useState } from 'react';
import { apiService } from '@/lib/api';
import { Action, Back } from '../shared/Controls';
import { RETENTION_MS, styleName } from '../shared/catalog';
import type { CrmLead } from '../shared/types';
import { Panel, WhatsApp } from './Widgets';
export function LeadDetail({ lead, back, refresh }: { lead: CrmLead; back: () => void; refresh: () => Promise<void> }) {
 const [now,setNow] = useState(Date.now()); const [note,setNote] = useState(lead.note); const [saved,setSaved] = useState(false);
 const [message,setMessage] = useState(`Oi, ${lead.name.split(' ')[0]}! Seu ensaio ${styleName(lead.style).toLowerCase()} ficou pronto e está lindo ✨ Ele fica guardado por 24h. Quer que eu reenvie o PIX?`);
 useEffect(() => { const timer = setInterval(() => setNow(Date.now()),1000); return () => clearInterval(timer); }, []);
 const remaining = Math.max(0,Date.parse(lead.createdAt) + RETENTION_MS - now);
 const hours = Math.floor(remaining/3600000); const minutes = Math.floor((remaining%3600000)/60000); const seconds = Math.floor((remaining%60000)/1000);
 const stages = ['Iniciou quiz',`Gênero: ${lead.gender === 'female' ? 'Mulher' : 'Homem'}`,`Estilo: ${styleName(lead.style)}`,'Enviou 5 fotos','Gerou ensaio','Abriu checkout','Pagou'];
 return <><Back onClick={back} /><div className="crm-detail-head"><div className="crm-avatar">{lead.name.split(' ').map(s => s[0]).slice(0,2).join('')}</div><div><h1>{lead.name}</h1><span className={`ff-pill ${lead.tone}`}>{lead.stage} · {lead.activity}</span><p className="ff-sub">{lead.phone} · {lead.email} · {lead.city}</p></div><WhatsApp lead={lead}>Chamar no WhatsApp</WhatsApp></div>
 <div className="crm-side"><div><Panel title="Jornada no funil" subtitle={`${Math.round(lead.progress/100*7)} de 7 etapas concluídas`}><div className="crm-timeline">{stages.map((s,i) => <div key={s} className={i/7*100 < lead.progress ? 'complete' : ''}><i>{i/7*100 < lead.progress ? '✓' : i+1}</i><b>{s}</b></div>)}</div></Panel>
 <Panel title="Imagens geradas" subtitle={lead.tone === 'success' ? 'Ensaio liberado' : `Retenção de 24h: ${hours}h ${minutes}min ${seconds}s`}><div className="crm-images">{lead.photos.length ? lead.photos.map((p,i) => <img src={p} alt={`Prévia ${i+1}`} key={i} />) : <p className="ff-sub">Nenhuma imagem disponível.</p>}</div>{remaining === 0 && lead.tone !== 'success' && <p className="ff-danger">Prazo de retenção encerrado.</p>}</Panel></div>
 <div><Panel title="Checkout em aberto"><h2>{lead.tone === 'success' ? 'Pagamento confirmado' : 'Aguardando pagamento'}</h2><WhatsApp lead={lead} message={`Oi, ${lead.name.split(' ')[0]}! Vamos retomar seu pedido PIX no FotoFlow?`}>Reenviar PIX</WhatsApp></Panel><Panel title="Mensagem sugerida"><textarea className="ff-input crm-message" aria-label="Mensagem de recuperação" value={message} onChange={e => setMessage(e.target.value)} /><WhatsApp lead={lead} message={message}>Enviar no WhatsApp</WhatsApp><label className="ff-label">Nota interna<textarea className="ff-input" value={note} onChange={e => { setNote(e.target.value); setSaved(false); }} /></label><Action className="ff-small" onClick={() => { void apiService.prototype.saveLead({ ...lead,note }).then(async () => { setSaved(true); await refresh(); }); }}>{saved ? 'Nota salva ✓' : 'Salvar nota'}</Action></Panel></div></div></>;
}
