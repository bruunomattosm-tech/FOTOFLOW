import { useLocale } from '@/context/LocaleContext';
import { internationalPhone } from '@/lib/i18n';
import { trackEvent } from '@/lib/track';
import { useGeneration } from "./useGeneration";
import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import type { Ensaio } from "@/types/domain";
import { canSelectReference, remainingPhotos } from "../shared/catalog";
import type { CrmLead, FlowPackage, FlowStep, Gender, StyleId } from "../shared/types";
import { validLead, type LeadForm } from "./LeadStep";
import { usePrototype } from "../shared/usePrototype";
export function useFlow() {
  const data = usePrototype();
  const { country, locale } = useLocale();
  const countryConfig = data.international[country];
  const [step, setStep] = useState<FlowStep>("gender");
  const [gender, setGender] = useState<Gender>("female");
  const [style, setStyle] = useState<StyleId>("corp");
  const [referenceId, setReferenceId] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [lead, setLead] = useState<LeadForm>({ name: "", phone: "", email: "" });
  const [customer, setCustomer] = useState<CrmLead>();
  const [pack, setPack] = useState<FlowPackage>();
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<Ensaio[]>([]);
  const [orderId, setOrderId] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState("Analisando suas fotos…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refs = data.references.filter((r) => r.style === style && r.gender === gender && r.active);
  const go = (next: FlowStep) => {
    setError("");
    setStep(next);
    window.scrollTo(0, 0);
  };
  async function saveLead() {
    if (!validLead(lead)) {
      setError("Preencha nome, telefone com DDD e um e-mail válido.");
      return;
    }
    setBusy(true);
    try {
      const saved = await apiService.createLead({
        nome: lead.name.trim(),
        telefone: lead.phone,
        email: lead.email,
        genero: gender,
        estiloId: style,
      });
      const item: CrmLead = {
        id: saved.id,
        name: lead.name.trim(),
        phone: internationalPhone(lead.phone, country),
        country, currency: locale.currency, subdomain: location.hostname,
        email: lead.email,
        gender,
        style,
        city: "",
        stage: "Gerando ensaio",
        tone: "violet",
        progress: 55,
        activity: "gerando agora",
        when: "agora",
        createdAt: new Date().toISOString(),
        photos: [],
        note: "",
      };
      await apiService.prototype.saveLead(item);
      setCustomer(item);
      trackEvent("Lead", { country }, item.id);
      go("gen");
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function updateCustomer(
    stage: string,
    progress: number,
    tone: CrmLead["tone"],
    images: string[] = [],
  ) {
    if (!customer) return;
    const next = {
      ...customer,
      stage,
      progress,
      tone,
      photos: images,
      activity: "agora",
      when: "agora",
    };
    setCustomer(next);
    await apiService.prototype.saveLead(next);
  }
  useGeneration({ step,customerId:customer?.id,selected,referenceId,references:data.references,style,photos,gender,results,setPercent,setStatus,setResults,setStep,setError,updateCustomer });
  async function createOrder() {
    if (!pack || !customer) return;
    setBusy(true);
    try {
      const order = country === "BR" ? await apiService.criarPedido(customer.id, pack.id) : { id: crypto.randomUUID(), pixCopiaECola: "" };
      setOrderId(order.id);
      setPixCode(order.pixCopiaECola || "PIX de demonstração");
      await apiService.prototype.saveOrder({
        id: order.id,
        name: customer.name, leadId: customer.id, country, currency: locale.currency, subdomain: location.hostname,
        count: pack.count,
        cents: pack.cents,
        status: "Pendente",
        when: "agora",
      });
      await updateCustomer(
        "Abriu checkout",
        85,
        "warning",
        results.map((r) => r.urlFinal || "").filter(Boolean),
      );
      trackEvent("InitiateCheckout", { value: pack.cents / 100, currency: locale.currency, country, transaction_id: order.id }, customer.id);
      go("pix");
    } catch {
      setError("Não foi possível criar o pedido. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function confirmPayment() {
    if (!orderId) return;
    await apiService.prototype.confirmOrder(orderId);
    await updateCustomer(
      `Pagou · ${pack?.count || 3} fotos`,
      100,
      "success",
      results.map((r) => r.urlFinal || "").filter(Boolean),
    );
    trackEvent("Purchase", { value: (pack?.cents || 0) / 100, currency: locale.currency, country, transaction_id: orderId, demo: true }, customer?.id);
    go("paid");
  }
  useEffect(() => {
    if (step !== "pix" || !orderId) return;
    const poll = window.setInterval(() => {
      void apiService.prototype.getData().then((d) => {
        if (d.orders.find((o) => o.id === orderId)?.status === "Pago") void confirmPayment();
      });
    }, 1500);
    return () => clearInterval(poll);
  }, [step, orderId]);
  function toggle(id: string) {
    if (!pack || !canSelectReference(selected, id, pack.count)) return;
    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }
  const remaining = remainingPhotos(pack?.count || 3);
  return {
    ...data, country, countryConfig,
    settings: { ...data.settings, packages: countryConfig.packages },
    step,
    go,
    gender,
    setGender,
    style,
    setStyle,
    referenceId,
    setReferenceId,
    photos,
    setPhotos,
    lead,
    setLead,
    pack,
    setPack,
    selected,
    setSelected,
    results,
    percent,
    status,
    error,
    setError,
    busy,
    refs,
    remaining,
    saveLead,
    createOrder,
    confirmPayment,
    toggle,
    pixCode,
  };
}
