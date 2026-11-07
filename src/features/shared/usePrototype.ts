import { DEFAULT_INTERNATIONAL } from '@/features/international/defaults';
import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { DEFAULT_SETTINGS } from "./catalog";
import type { BusinessSettings, CrmLead, CrmOrder, FlowReference } from "./types";
export function usePrototype() {
  const [international, setInternational] = useState(structuredClone(DEFAULT_INTERNATIONAL));
  const [settings, setSettings] = useState<BusinessSettings>(structuredClone(DEFAULT_SETTINGS));
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [orders, setOrders] = useState<CrmOrder[]>([]);
  const [references, setReferences] = useState<FlowReference[]>([]);
  const refresh = useCallback(async () => {
    const data = await apiService.prototype.getData();
    setSettings(data.settings);
    setInternational(data.international);
    setLeads(data.leads);
    setOrders(data.orders);
    setReferences(data.references);
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 30000);
    return () => clearInterval(timer);
  }, [refresh]);
  return { international, settings, setSettings, leads, orders, references, refresh };
}
