import { LocaleProvider } from '@/context/LocaleContext';
import { ConsentPanel } from '@/features/tracking/ConsentPanel';
import { PrivacyPage } from '@/features/tracking/PrivacyPage';
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import LandingPage from "@/pages/LandingPage";
import FlowPage from "@/features/flow/FlowPage";
import CrmPage from "@/features/crm/CrmPage";

export default function App() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, []);
  return (
    <LocaleProvider><BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<FlowPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/studio" element={<HomePage />} />
      </Routes>
    <ConsentPanel /></BrowserRouter></LocaleProvider>
  );
}
