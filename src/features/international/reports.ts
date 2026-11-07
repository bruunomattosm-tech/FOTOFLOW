import { COUNTRIES, type Country } from '@/lib/i18n';
import type { CrmOrder } from '@/features/shared/types';
import type { InternationalConfig } from './types';
export type ReportScope = 'all' | Country;
export function summarizeOrders(orders: CrmOrder[], scope: ReportScope, config: InternationalConfig) {
  const filtered = orders.filter(o => scope === 'all' || (o.country || 'BR') === scope);
  const paid = filtered.filter(o => o.status === 'Pago'); const pending = filtered.filter(o => o.status === 'Pendente');
  const missing = COUNTRIES.filter(c => filtered.some(o => (o.country || 'BR') === c) && config[c].brlRate === null);
  const sum = (items: CrmOrder[]) => items.reduce((total, o) => total + o.cents * (scope === 'all' ? config[o.country || 'BR'].brlRate || 0 : 1), 0);
  return { filtered, paid, pending, missing, revenue: Math.round(sum(paid)), pendingAmount: Math.round(sum(pending)), average: paid.length ? Math.round(sum(paid) / paid.length) : 0,
    breakdown: COUNTRIES.map(country => ({ country, cents: paid.filter(o => (o.country || 'BR') === country).reduce((n, o) => n + o.cents, 0) })) };
}
