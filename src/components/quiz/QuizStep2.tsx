import React, { useState } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { landingAssets } from '@/data/landingAssets';
import { track } from '@/lib/track';
import { ArrowLeft } from 'lucide-react';

interface QuizStep2Props {
  onBack: () => void;
  onComplete: () => void;
}

const styles = [
  {
    id: 'corporativo',
    name: 'Corporativo',
    desc: 'Executivo, LinkedIn, autoridade',
    image: landingAssets.styles.corporativo
  },
  {
    id: 'aniversario',
    name: 'Aniversário',
    desc: 'Celebração, balões, cenário festivo',
    image: landingAssets.styles.aniversario
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    desc: 'Casual urbano, café, fim de tarde',
    image: landingAssets.styles.lifestyle
  },
  {
    id: 'pet',
    name: 'Pet',
    desc: 'Foto com seu cachorro ou gato',
    image: landingAssets.styles.pet
  },
  {
    id: 'afetivo',
    name: 'Afetivo & Datas',
    desc: 'Casal, família, gestante',
    image: landingAssets.styles.afetivo
  }
];

export function QuizStep2({ onBack, onComplete }: QuizStep2Props) {
  const { quizData, setStyleId, completeQuiz } = useQuiz();
  const [localStyle, setLocalStyle] = useState(quizData.styleId);

  const handleSelect = (id: string) => {
    setLocalStyle(id);
  };

  const handleContinue = () => {
    if (localStyle) {
      setStyleId(localStyle);
      track('SelectQuizStyle', { styleId: localStyle });
      completeQuiz();
      onComplete();
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={onBack}
        className="self-start flex items-center gap-2 text-[#A1A1AA] hover:text-[#F5F5F7] mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Voltar</span>
      </button>

      <h2 className="text-2xl md:text-3xl font-bold text-[#F5F5F7] mb-2 text-center">
        Escolha o estilo do ensaio
      </h2>
      <p className="text-[#A1A1AA] text-center mb-8">
        Selecione a categoria que melhor representa o que você busca.
      </p>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => handleSelect(style.id)}
            className={`relative group overflow-hidden rounded-2xl border text-left transition-all duration-300 aspect-[4/3] md:aspect-auto md:h-40 ${
              localStyle === style.id
                ? 'border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.2)] scale-[1.02]'
                : 'border-white/5 hover:border-white/20'
            }`}
          >
            <img
              src={style.image}
              alt={style.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className={`absolute inset-0 transition-colors duration-300 ${
              localStyle === style.id
                ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent'
                : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'
            }`} />

            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <h3 className={`text-lg font-bold mb-1 transition-colors ${
                localStyle === style.id ? 'text-[#8B5CF6]' : 'text-[#F5F5F7]'
              }`}>
                {style.name}
              </h3>
              <p className="text-[#A1A1AA] text-xs">
                {style.desc}
              </p>
            </div>

            {localStyle === style.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[#8B5CF6] rounded-full flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!localStyle}
        className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        Continuar para o Ensaio
      </button>
    </div>
  );
}
