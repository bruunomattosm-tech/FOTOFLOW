import { useLocale } from '@/context/LocaleContext';
import { COUNTRIES, isCountry, LOCALES, type Country } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export function CountrySelector() {
  const { country, setCountry, t } = useLocale();
  return <Select value={country} onValueChange={value => { if (isCountry(value)) setCountry(value); }}><SelectTrigger className="ff-country-select" aria-label={t('País')}><SelectValue /></SelectTrigger><SelectContent>{COUNTRIES.map(c => <SelectItem value={c} key={c}>{LOCALES[c].flag} {c}</SelectItem>)}</SelectContent></Select>;
}
export function CountryBadge({ country = 'BR' }: { country?: Country }) { return <span className="ff-pill muted">{LOCALES[country].flag} {country}</span>; }
