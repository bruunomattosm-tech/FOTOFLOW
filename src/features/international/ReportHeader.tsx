import { COUNTRIES, LOCALES, money } from '@/lib/i18n';
import { Action } from '@/features/shared/Controls';
import type { ReportScope } from './reports';
import { summarizeOrders } from './reports';
import type { CrmOrder } from '@/features/shared/types';
import type { InternationalConfig } from './types';
export function ReportHeader({ scope, setScope, orders, config }: { scope: ReportScope; setScope: (s: ReportScope) => void; orders: CrmOrder[]; config: InternationalConfig }) {
  const summary = summarizeOrders(orders, scope, config);
  return <><div className="ff-country-tabs"><Action className={scope === 'all' ? 'ff-primary' : 'ff-small'} onClick={() => setScope('all')}>🌎 Consolidado BRL</Action>{COUNTRIES.map(c => <Action key={c} className={scope === c ? 'ff-primary' : 'ff-small'} onClick={() => setScope(c)}>{LOCALES[c].flag} {LOCALES[c].currency}</Action>)}</div>{scope === 'all' && <><div className="ff-country-tabs">{summary.breakdown.map(b => <span className="ff-pill muted" key={b.country}>{LOCALES[b.country].flag} {LOCALES[b.country].currency} {money(b.cents, b.country)}</span>)}</div>{summary.missing.length > 0 && <p className="ff-rate-note">Consolidado indisponível: informe câmbio BRL de {summary.missing.join(', ')} nas configurações.</p>}</>}</>;
}
