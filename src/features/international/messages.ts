import type { Country } from '@/lib/i18n';
import m0 from './messages-0';
import m1 from './messages-1';
import m2 from './messages-2';
import m3 from './messages-3';
const messages: Record<string, readonly string[]> = {...m0,...m1,...m2,...m3};
export function translate(text: string, country: Country): string { if (country === 'BR') return text; return messages[text.trim()]?.[country === 'US' ? 1 : 0] || text; }
