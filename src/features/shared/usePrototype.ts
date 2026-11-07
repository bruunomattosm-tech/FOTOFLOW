import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { DEFAULT_SETTINGS } from "./catalog";
import type { BusinessSettings, CrmLead, CrmOrder, FlowReference } from "./types";
export function usePrototype() {
  const [settings, setSettings] = useState<BusinessSettings>(structuredClone(DEFAULT_SETTINGS));
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [orders, setOrders] = useState<CrmOrder[]>([]);
  const [references, setReferences] = useState<FlowReference[]>([]);
  const refresh = useCallback(async () => {
    const data = await apiService.prototype.getData();
    setSettings(data.settings);
    setLeads(data.leads);
    setOrders(data.orders);
    setReferences(data.references);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { settings, setSettings, leads, orders, references, refresh };
}
