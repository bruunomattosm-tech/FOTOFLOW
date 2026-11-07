import { useLocale } from '@/context/LocaleContext';
import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Escolha o estilo',
    desc: "De perfis executivos a ensaios lifestyle. Selecione o que mais combina com você."
  },
  {
    num: '02',
    title: 'Selecione as referências',
    desc: "Navegue por nossa galeria e escolha as poses e cenários exatos que deseja."
  },
  {
    num: '03',
    title: 'Tire 4 fotos guiadas',
    desc: "Use a câmera do celular. Nossa IA guia você para as melhores poses e iluminação."
  },
  {
    num: '04',
    title: 'Receba seu ensaio',
    desc: "Em até 2 minutos, suas fotos profissionais estarão prontas para download."
  }
];

export function HowItWorks() {
 const { t } = useLocale();
  return (
    <section id="como-funciona" className="py-24 bg-[#0A0A0F] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#8B5CF6]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-6">
            {t("Como funciona")}
          </h2>
          <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto">
            {t("Quatro passos simples entre você e seu próximo ensaio fotográfico profissional.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />

          {steps.map((step, idx) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full bg-[#14141C] border border-[#8B5CF6]/30 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(139,92,246,0.1)] relative">
                <div className="absolute inset-2 rounded-full border border-white/5" />
                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#F5F5F7] to-[#A1A1AA]">
                  {step.num}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F7] mb-3">{t(step.title)}</h3>
              <p className="text-[#A1A1AA] leading-relaxed max-w-xs">{t(step.desc)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
