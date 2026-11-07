import { DEFAULT_SETTINGS, makeReferences, RETENTION_MS } from '@/features/shared/catalog';
import { SAMPLE_LEADS, SAMPLE_ORDERS } from '@/features/crm/sampleData';
import type { BusinessSettings, CrmLead, CrmOrder, FlowReference } from '@/features/shared/types';
interface MockStore { settings: BusinessSettings; leads: CrmLead[]; orders: CrmOrder[]; references: FlowReference[] }
const key = 'fotoflow_prototype_mock_v1';
let store: MockStore = { settings: structuredClone(DEFAULT_SETTINGS), leads: SAMPLE_LEADS, orders: SAMPLE_ORDERS, references: makeReferences() };
try { const saved = localStorage.getItem(key); if (saved) store = JSON.parse(saved) as MockStore; } catch { /* mock storage unavailable */ }
function persist() { try { localStorage.setItem(key, JSON.stringify(store)); } catch { /* quota: current session remains usable */ } }
export const prototypeService = {
 async getData(): Promise<MockStore> {
  store.leads = store.leads.map(lead => store.settings.retention && lead.tone !== 'success' && Date.now() - Date.parse(lead.createdAt) >= RETENTION_MS ? { ...lead, photos: [] } : lead);
  persist(); return structuredClone(store);
 },
 async saveSettings(settings: BusinessSettings) { store.settings = structuredClone(settings); persist(); },
 async saveReference(ref: FlowReference) { store.references = store.references.map(r => r.id === ref.id ? ref : r); persist(); },
 async addReference(ref: FlowReference) { store.references.push(ref); persist(); },
 async saveLead(lead: CrmLead) { store.leads = [lead, ...store.leads.filter(l => l.id !== lead.id)]; persist(); },
 async saveOrder(order: CrmOrder) { store.orders = [order, ...store.orders.filter(o => o.id !== order.id)]; persist(); },
 async confirmOrder(id: string) { store.orders = store.orders.map(o => o.id === id ? { ...o, status: 'Pago' } : o); persist(); },
};
