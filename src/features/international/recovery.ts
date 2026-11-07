import { internationalPhone, money } from '@/lib/i18n';
import type { CrmLead } from '@/features/shared/types';
import { RECOVERY } from './defaults';
export function recoveryMessage(lead: CrmLead, template?: string, cents?: number) {
  const country = lead.country || 'BR'; const url = new URL('/app', location.origin); url.searchParams.set('country', country);
  return (template || RECOVERY[country]).replaceAll('{nome}', lead.name.split(' ')[0] || lead.name).replaceAll('{valor}', cents === undefined && lead.orderCents === undefined ? country === 'BR' ? 'pendente' : country === 'US' ? 'pending' : 'pendiente' : money(cents ?? lead.orderCents ?? 0, country)).replaceAll('{link_checkout}', url.href);
}
export function whatsappUrl(lead: CrmLead, message?: string) { return `https://wa.me/${internationalPhone(lead.phone, lead.country || 'BR')}?text=${encodeURIComponent(message || recoveryMessage(lead))}`; }
