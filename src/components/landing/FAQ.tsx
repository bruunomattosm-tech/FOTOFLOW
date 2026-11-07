import { useLocale } from '@/context/LocaleContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Preciso saber posar?',
    answer: "Não! Nossa IA analisa suas selfies e aplica a pose ideal para cada estilo, corrigindo postura, ombros e inclinação do rosto para um resultado perfeitamente natural."
  },
  {
    question: 'Minhas fotos ficam armazenadas?',
    answer: "Suas selfies originais são deletadas automaticamente após a geração do ensaio. As fotos finais ficam disponíveis por 30 dias para você baixar, e depois são apagadas."
  },
  {
    question: 'Quanto tempo demora?',
    answer: "O processo todo, desde o envio das selfies até a entrega das fotos em alta resolução, leva em média 2 minutos."
  },
  {
    question: 'Posso usar comercialmente?',
    answer: "Sim! Ao adquirir qualquer pacote, você recebe licença completa para usar as fotos no LinkedIn, site da sua empresa, Instagram, materiais impressos e campanhas."
  },
  {
    question: 'E se eu não gostar do resultado?',
    answer: "A visualização do ensaio gerado é totalmente gratuita com marca d'água. Você só paga se gostar do resultado e decidir baixar as fotos em alta resolução."
  },
  {
    question: 'Como recebo as fotos?',
    answer: "Assim que o pagamento for aprovado, o download em alta resolução (4K) é liberado imediatamente na própria plataforma, sem complicação."
  }
];

export function FAQ() {
 const { t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-[#0A0A0F]">
      <div className="container mx-auto px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-6">
            {t("Dúvidas frequentes")}
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#14141C] border border-white/5 rounded-2xl overflow-hidden transition-colors hover:border-white/10"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                aria-expanded={openIndex === idx}
              >
                <span className="text-[#F5F5F7] font-medium pr-4">{t(faq.question)}</span>
                <ChevronDown
                  className={`text-[#A1A1AA] transition-transform duration-300 shrink-0 ${openIndex === idx ? 'rotate-180' : ''}`}
                  size={20}
                />
              </button>

              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-5 pt-0 text-[#A1A1AA] leading-relaxed">
                      {t(faq.answer)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
