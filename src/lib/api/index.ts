import { FotoFlowApiService } from './types';
import { mockApiService } from './mock';
import { supabaseApiService } from './supabase';
import { prototypeService } from './prototype';

const dataMode = (import.meta.env.VITE_DATA_MODE || 'mock').toLowerCase();

const baseService: FotoFlowApiService =
  dataMode === 'supabase' || dataMode === 'real'
    ? supabaseApiService
    : mockApiService;

export const apiService = Object.assign(baseService, { prototype: prototypeService });

export * from './types';
export { mockApiService, supabaseApiService };
