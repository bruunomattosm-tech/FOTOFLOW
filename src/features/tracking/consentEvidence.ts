import { readChoice, saveChoices, type Choice } from '@/lib/consent';
export const NOTICE_VERSION = 'fotoflow-advertising-2026-11-07';
export function recordChoices(analytics: Choice, advertising: Choice) {
  try {
  let visitor = localStorage.getItem('fotoflow_consent_visitor');
  if (!visitor) { visitor = crypto.randomUUID(); localStorage.setItem('fotoflow_consent_visitor', visitor); }
  const records = JSON.parse(localStorage.getItem('fotoflow_consent_evidence') || '[]') as unknown[];
  records.push({ visitor, at: new Date().toISOString(), notice: NOTICE_VERSION, analytics, advertising, region: 'lookup-managed-by-consent-module' });
  localStorage.setItem('fotoflow_consent_evidence', JSON.stringify(records));
  } catch { /* A storage failure never grants permission without a saved choice. */
    saveChoices({ analytics: 'denied', advertising: 'denied' }); return;
  }
  saveChoices({ analytics, advertising });
}
export function matchingAllowed(): boolean { return readChoice('advertising') === 'granted'; }
