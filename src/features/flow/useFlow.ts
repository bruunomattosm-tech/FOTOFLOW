import { useEffect, useRef, useState } from 'react';
import { apiService } from '@/lib/api';
import type { Ensaio } from '@/types/domain';
import { canSelectReference, remainingPhotos } from '../shared/catalog';
import type { CrmLead, FlowPackage, FlowStep, Gender, StyleId } from '../shared/types';
import { validLead, type LeadForm } from './LeadStep';
import { usePrototype } from '../shared/usePrototype';
export function useFlow() {
 const data = usePrototype(); const [step, setStep] = useState<FlowStep>('gender');
 const [gender, setGender] = useState<Gender>('female'); const [style, setStyle] = useState<StyleId>('corp');
 const [referenceId, setReferenceId] = useState(''); const [photos, setPhotos] = useState<string[]>([]);
 const [lead, setLead] = useState<LeadForm>({ name:'', phone:'', email:'' }); const [customer, setCustomer] = useState<CrmLead>();
 const [pack, setPack] = useState<FlowPackage>(); const [selected, setSelected] = useState<string[]>([]);
 const [results, setResults] = useState<Ensaio[]>([]); const [orderId, setOrderId] = useState(''); const [pixCode, setPixCode] = useState('');
 const [percent, setPercent] = useState(0); const [status, setStatus] = useState('Analisando suas fotos…'); const [error, setError] = useState('');
 const [busy, setBusy] = useState(false); const generation = useRef(false);
 const refs = data.references.filter(r => r.style === style && r.gender === gender && r.active);
 const go = (next: FlowStep) => { setError(''); setStep(next); window.scrollTo(0,0); };
 async function saveLead() {
  if (!validLead(lead)) { setError('Preencha nome, telefone com DDD e um e-mail válido.'); return; }
  setBusy(true);
  try {
   const saved = await apiService.createLead({ nome:lead.name.trim(), telefone:lead.phone, email:lead.email, genero:gender, estiloId:style });
   const item: CrmLead = { id:saved.id, name:lead.name.trim(), phone:lead.phone, email:lead.email, gender, style, city:'', stage:'Gerando ensaio',tone:'violet',progress:55,activity:'gerando agora',when:'agora',createdAt:new Date().toISOString(),photos:[],note:'' };
   await apiService.prototype.saveLead(item); setCustomer(item); go('gen');
  } catch { setError('Não foi possível salvar. Tente novamente.'); } finally { setBusy(false); }
 }
 async function updateCustomer(stage: string, progress: number, tone: CrmLead['tone'], images: string[] = []) {
  if (!customer) return; const next = { ...customer, stage, progress, tone, photos:images, activity:'agora',when:'agora' }; setCustomer(next); await apiService.prototype.saveLead(next);
 }
 useEffect(() => {
  if ((step !== 'gen' && step !== 'gen2') || generation.current || !customer) return;
  generation.current = true; let active = true; setPercent(0); setStatus('Analisando suas fotos…');
  const ids = step === 'gen2' ? selected : [referenceId];
  async function generate() {
   try {
    const generated: Ensaio[] = [];
    for (const [index, id] of ids.entries()) {
     const ref = data.references.find(r => r.id === id); if (!ref) throw new Error('Referência indisponível. Volte e escolha outra.');
     const result = await apiService.gerarEnsaio({ leadId:customer.id, estiloId:style, referenciaId:id, referenceImage:ref.image, userImages:photos,gender,
      model:localStorage.getItem('fotoflow_model') || 'nano-banana-2.1',resolution:localStorage.getItem('fotoflow_resolution') === '4K' ? '4K' : localStorage.getItem('fotoflow_resolution') === '2K' ? '2K' : '1K',
      onProgress:(message,pct = 0) => { if (active) { setPercent(Math.round((index * 100 + pct) / ids.length)); setStatus(message); } },
     });
     generated.push(result);
    }
    if (!active) return;
    const all = step === 'gen2' ? [...results, ...generated] : generated;
    setResults(all); setPercent(100); await updateCustomer(step === 'gen2' ? 'Concluído' : 'Gerou ensaio',step === 'gen2' ? 100 : 75,step === 'gen2' ? 'success' : 'warning',all.map(r => r.urlFinal || r.urlPreview || '').filter(Boolean));
    setStep(step === 'gen2' ? 'final' : 'result');
   } catch (e: unknown) { if (active) setError(e instanceof Error ? e.message : 'Falha na geração.'); }
   finally { generation.current = false; }
  }
  void generate(); return () => { active = false; };
 }, [step]);
 async function createOrder() {
  if (!pack || !customer) return; setBusy(true);
  try {
   const order = await apiService.criarPedido(customer.id, pack.id); setOrderId(order.id); setPixCode(order.pixCopiaECola || 'PIX de demonstração');
   await apiService.prototype.saveOrder({ id:order.id,name:customer.name,count:pack.count,cents:pack.cents,status:'Pendente',when:'agora' });
   await updateCustomer('Abriu checkout',85,'warning',results.map(r => r.urlFinal || '').filter(Boolean)); go('pix');
  } catch { setError('Não foi possível criar o pedido. Tente novamente.'); } finally { setBusy(false); }
 }
 async function confirmPayment() {
  if (!orderId) return; await apiService.prototype.confirmOrder(orderId);
  await updateCustomer(`Pagou · ${pack?.count || 3} fotos`,100,'success',results.map(r => r.urlFinal || '').filter(Boolean)); go('paid');
 }
 useEffect(() => {
  if (step !== 'pix' || !orderId) return;
  const poll = window.setInterval(() => { void apiService.prototype.getData().then(d => { if (d.orders.find(o => o.id === orderId)?.status === 'Pago') void confirmPayment(); }); }, 1500);
  return () => clearInterval(poll);
 }, [step,orderId]);
 function toggle(id: string) { if (!pack || !canSelectReference(selected,id,pack.count)) return; setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected,id]); }
 const remaining = remainingPhotos(pack?.count || 3);
 return { ...data,step,go,gender,setGender,style,setStyle,referenceId,setReferenceId,photos,setPhotos,lead,setLead,pack,setPack,selected,setSelected,results,percent,status,error,setError,busy,refs,remaining,saveLead,createOrder,confirmPayment,toggle,pixCode };
}
