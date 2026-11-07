import type { EventoTracking } from '@/types/domain';
import { apiService } from '@/lib/api';
import { detectCountry, isCountry, LOCALES } from '@/lib/i18n';
import { canTrack, readChoice } from '@/lib/consent';
import { captureAttribution } from '@/features/tracking/attribution';
import { sendBrowser } from '@/features/tracking/browser';
import { EVENTS, type DebugEvent, type FunnelEvent } from '@/features/tracking/types';
const recent: DebugEvent[] = [];
const purchases = new Set<string>();
export const getDebugEvents = () => [...recent];
export const generateEventId = () => crypto.randomUUID();
export function trackEvent(eventName: string, payload: Record<string, unknown> = {}, leadId = 'lead_anonymous'): EventoTracking {
  const eventID = generateEventId();
  const event: EventoTracking = { id: eventID, leadId, evento: eventName, payload, criadoEm: new Date().toISOString() };
  void report(event).catch(() => { /* tracking never interrupts customer actions */ });
  return event;
}
async function report(event: EventoTracking) {
  const data = await apiService.prototype.getData();
  const payload = event.payload || {};
  const candidate = typeof payload.country === 'string' ? payload.country : undefined;
  const country = isCountry(candidate) ? candidate : detectCountry(location.hostname, location.search);
  const config = data.tracking[country].enabled ? data.tracking[country] : data.tracking.global;
  if (EVENTS.includes(event.evento as FunnelEvent) && !config.events[event.evento as FunnelEvent]) return;
  if (event.evento === 'Purchase') { const key = String(payload.transaction_id || event.id); if (purchases.has(key)) return; purchases.add(key); }
  const permitted = await canTrack('advertising');
  const demo = (import.meta.env.VITE_DATA_MODE || 'mock') === 'mock' || payload.demo === true;
  // Only allowlisted non-identifying values can reach tags or the debugger.
  const allowedKeys = ['value','currency','transaction_id','country','gender','style','count','demo','location','plan'];
  const clean = Object.fromEntries(Object.entries(payload).filter(([key, value]) => allowedKeys.includes(key) && ['number','string','boolean'].includes(typeof value)));
  clean.country = country; clean.currency = LOCALES[country].currency;
  let browser: DebugEvent['browser'] = !permitted ? 'Bloqueado' : demo ? 'Demonstração' : 'Não configurado';
  if (permitted && !demo && config.enabled) { await captureAttribution(); browser = await sendBrowser(config, event.evento, clean, event.id); }
  recent.unshift({ id: event.id, name: event.evento, at: event.criadoEm, country, currency: LOCALES[country].currency, payload: { ...clean, event_id: event.id }, browser, server: 'Não configurado', consent: readChoice('advertising') || 'regional' });
  recent.splice(100); window.dispatchEvent(new Event('fotoflow-tracking-event'));
}
export const track = (event: string, payload?: Record<string, unknown>) => trackEvent(event, payload);
