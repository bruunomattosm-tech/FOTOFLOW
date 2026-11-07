import { translate } from '@/features/international/messages';
import { useLocale } from '@/context/LocaleContext';
import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { landingAssets } from '@/data/landingAssets';

const testimonials = [
  {
    name: 'Carolina Mendes',
    location: 'São Paulo, SP',
    text: '"Eu precisava atualizar meu LinkedIn e adiava pela preguiça de marcar estúdio. O resultado do FotoFlow é assustador de tão real. Ninguém acreditou que foi IA."',
    avatar: landingAssets.testimonials.avatar1
  },
  {
    name: 'Rafael Costa',
    location: 'Rio de Janeiro, RJ',
    text: '"Fiz um ensaio com meu cachorro e fiquei emocionado. Captou exatamente minha essência e os traços dele. Imprimiu um quadro pra minha sala."',
    avatar: landingAssets.testimonials.avatar2
  },
  {
    name: 'Juliana Torres',
    location: 'Curitiba, PR',
    text: '"Usei para as fotos de divulgação da minha clínica. Economizei uns 2 mil reais com fotógrafo e o resultado ficou super premium. Recomendo muito."',
    avatar: landingAssets.testimonials.avatar3
  }
];

export function Testimonials() {
 const { t, country } = useLocale();
  return (
    <section className="py-24 bg-[#14141C] border-y border-white/5">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-6">
            {t("O que dizem sobre nós")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#0A0A0F] p-8 rounded-[20px] border border-white/5 flex flex-col h-full"
            >
              <div className="flex text-[#22C55E] mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <p className="text-[#F5F5F7] text-lg leading-relaxed mb-8 flex-grow">
                {translate(t.text, country)}
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                  loading="lazy"
                />
                <div>
                  <h4 className="text-[#F5F5F7] font-medium">{t.name}</h4>
                  <p className="text-[#A1A1AA] text-sm">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
