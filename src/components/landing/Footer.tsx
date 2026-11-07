import { useLocale } from '@/context/LocaleContext';
import React from 'react';

export function Footer() {
 const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0A0F] py-12 border-t border-white/5">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#F5F5F7] font-bold text-xl tracking-tight">FotoFlow</span>
          </div>

          <div className="flex gap-8">
            <a href="#" className="text-[#A1A1AA] hover:text-[#F5F5F7] text-sm transition-colors">{t("Termos de Uso")}</a>
            <a href="/privacy" className="text-[#A1A1AA] hover:text-[#F5F5F7] text-sm transition-colors">{t("Privacidade")}</a>
            <a href="#" className="text-[#A1A1AA] hover:text-[#F5F5F7] text-sm transition-colors">{t("Contato")}</a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#A1A1AA] text-sm">
            © {currentYear} FotoFlow. {t("Todos os direitos reservados.")}
          </p>
          <p className="text-[#A1A1AA] text-xs">
            {t("Feito com IA. Para humanos.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
