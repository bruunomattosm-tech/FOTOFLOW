import { useLocale } from '@/context/LocaleContext';
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { track } from '@/lib/track';
import { landingAssets } from '@/data/landingAssets';

const stylesList = [
  {
    id: 'corporativo',
    name: 'Corporativo',
    desc: 'Sua foto de LinkedIn com cara de diretoria.',
    image: landingAssets.styles.corporativo
  },
  {
    id: 'aniversario',
    name: 'Aniversário',
    desc: 'Um ensaio de comemoração, do jeito que você imaginou.',
    image: landingAssets.styles.aniversario
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    desc: 'Fotos naturais, com luz de fim de tarde e verdade.',
    image: landingAssets.styles.lifestyle
  },
  {
    id: 'pet',
    name: 'Com seu Pet',
    desc: 'O melhor retrato que vocês dois vão ter juntos.',
    image: landingAssets.styles.pet
  },
  {
    id: 'afetivo',
    name: 'Afetivo & Datas',
    desc: 'Presenteie com memória: casal, família, homenagem.',
    image: landingAssets.styles.afetivo
  }
];

export function Styles() {
 const { t } = useLocale();
  const navigate = useNavigate();

  const handleSelectStyle = (styleId: string) => {
    track('SelectStyle', { style: styleId });
    navigate('/app' + location.search);
  };

  return (
    <section id="estilos" className="py-24 bg-[#0A0A0F]">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-6">
            {t("Escolha o ensaio da sua vida")}
          </h2>
          <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto">
            {t("Cinco categorias de excelência. Qualidade de estúdio, direção de arte e luz impecável para cada momento.")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stylesList.map((style, idx) => (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleSelectStyle(style.id)}
              className={`group relative overflow-hidden rounded-[20px] bg-[#14141C] border border-white/5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-[#8B5CF6] hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] ${
                idx === 0 || idx === 1 ? 'lg:col-span-3 lg:w-[calc(50%-12px)] lg:inline-flex lg:mr-6 last:mr-0' : '' // make first 2 larger/half width on desktop if wanted, or just use standard grid
              } aspect-[4/5] md:aspect-auto md:h-[400px]`}
              style={idx < 2 ? { gridColumn: 'auto' } : {}}
            >
              <img
                src={style.image}
                alt={t(style.name)}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <h3 className="text-2xl font-bold text-[#F5F5F7] mb-2 group-hover:text-[#A855F7] transition-colors">
                  {t(style.name)}
                </h3>
                <p className="text-[#A1A1AA] text-sm leading-relaxed">
                  {t(style.desc)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
