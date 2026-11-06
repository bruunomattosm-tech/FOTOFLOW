import { EventoTracking } from '@/types/domain';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function trackEvent(
  eventName: string,
  payload: Record<string, unknown> = {},
  leadId = 'lead_anonymous'
): EventoTracking {
  const eventId = generateEventId();
  const event: EventoTracking = {
    id: eventId,
    leadId,
    evento: eventName,
    payload,
    criadoEm: new Date().toISOString(),
  };

  // 1. Meta Pixel (Client-side)
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, { ...payload, eventID: eventId });
  }

  // 2. DataLayer / Analytics
  if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, eventId, ...payload });
  }

  // 3. Fallback ou log em desenvolvimento
  if (import.meta.env.DEV) {
    // evento registrado silenciosamente
  }

  return event;
}
