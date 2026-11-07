import type { Country, Currency } from '@/lib/i18n';
export const EVENTS = ['PageView', 'ViewContent', 'SelectGender', 'SelectStyle', 'PhotoUploaded', 'Lead', 'PreviewGenerated', 'InitiateCheckout', 'Purchase'] as const;
export type FunnelEvent = typeof EVENTS[number];
export type TrackingScope = 'global' | Country;
export interface TrackingConfig {
  enabled: boolean; metaPixel: string; metaTestCode: string; tiktokPixel: string;
  gtm: string; ga4: string; googleAdsId: string; googleAdsLabel: string;
  matching: boolean; events: Record<FunnelEvent, boolean>;
}
export type TrackingSettings = Record<TrackingScope, TrackingConfig>;
export interface DebugEvent {
  id: string; name: string; at: string; country: Country; currency: Currency;
  payload: Record<string, unknown>; browser: 'Bloqueado' | 'Demonstração' | 'Não configurado' | 'Enfileirado' | 'Erro';
  server: 'Não configurado'; consent: string;
}
export const emptyTracking = (): TrackingConfig => ({ enabled: false, metaPixel: '', metaTestCode: '', tiktokPixel: '', gtm: '', ga4: '', googleAdsId: '', googleAdsLabel: '', matching: false, events: Object.fromEntries(EVENTS.map(e => [e, true])) as Record<FunnelEvent, boolean> });
export const defaultTracking = (): TrackingSettings => ({ global: emptyTracking(), BR: emptyTracking(), MX: emptyTracking(), CO: emptyTracking(), US: emptyTracking() });
