export type Country = 'BR' | 'MX' | 'CO' | 'US';
export type Currency = 'BRL' | 'MXN' | 'COP' | 'USD';
export const COUNTRIES = ['BR', 'MX', 'CO', 'US'] as const;
export const LOCALES = {
  BR: { country: 'BR', language: 'pt-BR', currency: 'BRL', flag: '🇧🇷', name: 'Brasil', ddi: '55', subdomain: 'br', phone: '+55 (11) 99999-9999', methods: ['PIX'] },
  MX: { country: 'MX', language: 'es-MX', currency: 'MXN', flag: '🇲🇽', name: 'México', ddi: '52', subdomain: 'mx', phone: '+52 55 1234 5678', methods: ['SPEI', 'OXXO', 'Tarjeta'] },
  CO: { country: 'CO', language: 'es-CO', currency: 'COP', flag: '🇨🇴', name: 'Colômbia', ddi: '57', subdomain: 'co', phone: '+57 300 123 4567', methods: ['PSE', 'Nequi'] },
  US: { country: 'US', language: 'en-US', currency: 'USD', flag: '🇺🇸', name: 'Estados Unidos', ddi: '1', subdomain: 'us', phone: '+1 (202) 555-0123', methods: ['Credit Card', 'Apple Pay', 'CashApp'] },
} as const;
export function isCountry(value: string | null | undefined): value is Country { return COUNTRIES.some(c => c === value); }
export function detectCountry(hostname: string, search: string): Country {
  const params = new URLSearchParams(search); const country = params.get('country')?.toUpperCase();
  if (isCountry(country)) return country;
  const language = params.get('lang');
  const found = COUNTRIES.find(c => LOCALES[c].language.toLowerCase() === language?.toLowerCase());
  if (found) return found;
  const subdomain = hostname.toLowerCase().split('.')[0];
  return COUNTRIES.find(c => LOCALES[c].subdomain === subdomain) || (subdomain === 'en' ? 'US' : 'BR');
}
export function money(cents: number, country: Country = 'BR'): string {
  return new Intl.NumberFormat(LOCALES[country].language, { style: 'currency', currency: LOCALES[country].currency }).format(cents / 100);
}
export function internationalPhone(phone: string, country: Country): string {
  const digits = phone.replace(/\D/g, ''); const ddi = LOCALES[country].ddi;
  const maxLocal = country === 'BR' ? 11 : 10;
  return digits.length > maxLocal && digits.startsWith(ddi) ? digits : `${ddi}${digits}`;
}
