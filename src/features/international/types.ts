import type { Country } from '@/lib/i18n';
import type { FlowPackage } from '@/features/shared/types';
export interface CountryConfig {
  domain: string; packages: FlowPackage[]; provider: string; publicKey: string;
  paymentReference: string; priceIds: string; message: string; brlRate: number | null;
}
export type InternationalConfig = Record<Country, CountryConfig>;
