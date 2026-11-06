import { FotoFlowApiService } from './types';
import { mockApiService } from './mock';
import { supabaseApiService } from './supabase';

const dataMode = (import.meta.env.VITE_DATA_MODE || 'mock').toLowerCase();

export const apiService: FotoFlowApiService =
  dataMode === 'supabase' || dataMode === 'real'
    ? supabaseApiService
    : mockApiService;

export * from './types';
export { mockApiService, supabaseApiService };
