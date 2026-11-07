import { usePrototype } from '@/features/shared/usePrototype';
import { money } from '@/lib/i18n';
import { useLocale } from '@/context/LocaleContext';
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { track } from '@/lib/track';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Essencial',
    photos: '3 fotos',
    price: 'R$ 29,90',
    features: ['Qualidade 4K', 'Sem marca d\'água', 'Entrega em 2 min', 'Licença de uso comercial'],
    isPopular: false
  },
  {
    name: 'Profissional',
    photos: '6 fotos',
    price: 'R$ 49,90',
    features: ['Qualidade 4K', 'Sem marca d\'água', 'Entrega prioritária', 'Licença de uso comercial', 'Ajustes finos via IA'],
    isPopular: true
  },
  {
    name: 'Completo',
    photos: '10 fotos',
    price: 'R$ 79,90',
    features: ['Qualidade 4K', 'Sem marca d\'água', 'Entrega prioritária', 'Licença de uso comercial', 'Ajustes finos via IA', 'Múltiplos estilos no mesmo pacote'],
    isPopular: false
  }
];

export function Pricing() {
 const { t, country } = useLocale();
 const { international } = usePrototype();
  const navigate = useNavigate();

  const handleCTA = (planName: string) => {
    track('ClickCTA', { location: 'Pricing', plan: planName });
    navigate('/app' + location.search);
  };

  return (
    <section id="precos" className="py-24 bg-[#0A0A0F]">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-6">
            {t("Pague só pelo que baixar")}
          </h2>
          <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto">
            {t("Criar e visualizar seu ensaio é")} <strong className="text-white">{t("100% grátis")}</strong>{t(". Você só paga se gostar do resultado e quiser baixar em alta resolução.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-[#14141C] rounded-3xl p-8 flex flex-col h-full ${
                plan.isPopular
                  ? 'border-2 border-[#8B5CF6] shadow-[0_0_40px_rgba(139,92,246,0.15)] md:scale-105 z-10'
                  : 'border border-white/10'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  {t("Mais Escolhido")}
                </div>
              )}

              <h3 className="text-2xl font-bold text-[#F5F5F7] mb-2">{international[country].packages[idx]?.count} {t("fotos")}</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#22C55E]">{money(international[country].packages[idx]?.cents || 0, country)}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#A1A1AA]">
                    <Check size={20} className="text-[#8B5CF6] shrink-0 mt-0.5" />
                    <span>{t(feature)}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCTA(plan.name)}
                className={`w-full py-4 rounded-xl font-medium transition-all duration-300 mt-auto ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {t("Criar meu ensaio")}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
