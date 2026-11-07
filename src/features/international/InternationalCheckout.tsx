import { useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { money } from '@/lib/i18n';
import type { FlowPackage } from '@/features/shared/types';
import { Action } from '@/features/shared/Controls';
import { CreditCard, Building2, Smartphone } from 'lucide-react';
export function InternationalCheckout({ pack }: { pack: FlowPackage }) {
  const { country, locale } = useLocale(); const [method, setMethod] = useState<string>(locale.methods[0]);
  return <><h1>{country === 'US' ? 'Payment' : 'Pago'}</h1><p className="ff-sub">{pack.count} {country === 'US' ? 'photos' : 'fotos'} · {money(pack.cents, country)}</p><div className="ff-options">{locale.methods.map((item, i) => <Action key={item} aria-pressed={item === method} className={`ff-option ${item === method ? 'selected' : ''}`} onClick={() => setMethod(item)}>{i === 0 ? <Building2 /> : i === 1 ? <Smartphone /> : <CreditCard />} {item}</Action>)}</div><div className="ff-notice warning">{country === 'US' ? 'Demo checkout · No real payment will be charged.' : 'Pago de demostración · No realices una transferencia real.'}</div><p className="ff-sub">{country === 'US' ? 'Waiting for payment confirmation' : 'Esperando la confirmación del pago'}</p></>;
}
