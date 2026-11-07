import { useLocale } from '@/context/LocaleContext';
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { track } from '@/lib/track';

export function CTA() {
 const { t } = useLocale();
  const navigate = useNavigate();

  const handleCTA = () => {
    track('ClickCTA', { location: 'FooterCTA' });
    navigate('/app');
  };

  return (
    <section className="py-24 bg-[#0A0A0F] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-64 bg-gradient-to-r from-[#8B5CF6]/20 to-[#A855F7]/20 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-8 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-[#14141C] border border-[#8B5CF6]/30 rounded-3xl p-10 md:p-16 text-center shadow-[0_0_50px_rgba(139,92,246,0.1)]"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-6">
            {t("Sua próxima foto de perfil começa com uma selfie.")}
          </h2>
          <p className="text-[#A1A1AA] text-lg mb-10 max-w-xl mx-auto">
            {t("Junte-se a mais de 18.000 profissionais que já transformaram sua imagem com o FotoFlow.")}
          </p>

          <button
            onClick={handleCTA}
            className="w-full sm:w-auto bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white px-10 py-5 rounded-2xl font-semibold text-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300"
          >
            {t("Criar meu ensaio agora")}
          </button>

          <p className="text-sm text-[#A1A1AA] mt-6">
            {t("Visualização 100% grátis. Você só paga se quiser baixar.")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
