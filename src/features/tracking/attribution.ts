import { canTrack, onConsentChange } from '@/lib/consent';
import { matchingAllowed } from './consentEvidence';
import { internationalPhone, type Country } from '@/lib/i18n';
const keys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','ttp','gclid','_fbc','_fbp'] as const;
export async function captureAttribution(): Promise<Record<string, string>> {
  if (!await canTrack('advertising')) return {};
  const saved = JSON.parse(localStorage.getItem('fotoflow_attribution') || '{}') as Record<string, string>;
  const params = new URLSearchParams(location.search);
  for (const key of keys) { const value = params.get(key); if (value) saved[key] = value.slice(0, 500); }
  for (const key of ['_fbc','_fbp','_ttp'] as const) { const value = document.cookie.split('; ').find(c => c.startsWith(`${key}=`))?.split('=').slice(1).join('='); if (value) saved[key === '_ttp' ? 'ttp' : key] = value; }
  if (saved.fbclid && !saved._fbc) saved._fbc = `fb.1.${Date.now()}.${saved.fbclid}`;
  localStorage.setItem('fotoflow_attribution', JSON.stringify(saved)); return saved;
}
export async function hashLead(lead: { email: string; phone: string; name: string }, country: Country): Promise<Record<string, string>> {
  if (!matchingAllowed() || !await canTrack('advertising')) return {};
  const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(b => b.toString(16).padStart(2,'0')).join('');
  return { em: await hash(lead.email.trim().toLowerCase()), ph: await hash(internationalPhone(lead.phone, country)), fn: await hash(lead.name.trim().toLowerCase().split(/\s+/)[0] || '') };
}

onConsentChange(() => { void canTrack('advertising').then(allowed => { if (!allowed) localStorage.removeItem('fotoflow_attribution'); }); });
