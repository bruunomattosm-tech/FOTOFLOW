import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { detectCountry, LOCALES, type Country } from '@/lib/i18n';
import { translate } from '@/features/international/messages';
interface LocaleValue { country: Country; locale: typeof LOCALES[Country]; setCountry: (country: Country) => void; t: (text: string) => string; }
const LocaleContext = createContext<LocaleValue | undefined>(undefined);
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [country, update] = useState<Country>(() => detectCountry(location.hostname, location.search));
  const setCountry = (next: Country) => { const url = new URL(location.href); url.searchParams.set('country', next); url.searchParams.delete('lang'); history.replaceState(null, "", url.pathname + url.search + url.hash); update(next); };
  useEffect(() => { document.documentElement.lang = LOCALES[country].language; const onHistory = () => update(detectCountry(location.hostname, location.search)); window.addEventListener('popstate', onHistory); return () => window.removeEventListener('popstate', onHistory); }, [country]);
  const value = useMemo(() => ({ country, locale: LOCALES[country], setCountry, t: (text: string) => translate(text, country) }), [country]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale() { const context = useContext(LocaleContext); if (!context) throw new Error('LocaleProvider required'); return context; }
