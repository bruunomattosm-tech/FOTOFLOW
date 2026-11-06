import React, { useState } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { User, Users } from 'lucide-react';
import { track } from '@/lib/track';

interface QuizStep1Props {
  onNext: () => void;
}

export function QuizStep1({ onNext }: QuizStep1Props) {
  const { quizData, setGender } = useQuiz();
  const [localGender, setLocalGender] = useState(quizData.gender);

  const handleSelect = (g: 'female' | 'male' | 'other') => {
    setLocalGender(g);
  };

  const handleContinue = () => {
    if (localGender) {
      setGender(localGender);
      track('SelectGender', { gender: localGender });
      onNext();
    }
  };

  const options = [
    { id: 'female', label: 'Feminino', icon: User },
    { id: 'male', label: 'Masculino', icon: User },
    { id: 'other', label: 'Outro / Prefiro não informar', icon: Users },
  ] as const;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl md:text-3xl font-bold text-[#F5F5F7] mb-2 text-center">
        Qual é o gênero do modelo?
      </h2>
      <p className="text-[#A1A1AA] text-center mb-8">
        Isso nos ajuda a ajustar a direção de arte e anatomia.
      </p>

      <div className="w-full flex flex-col gap-4 mb-10">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
              localGender === opt.id
                ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                : 'bg-[#0A0A0F] border-white/5 hover:border-white/20'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              localGender === opt.id ? 'bg-[#8B5CF6]/20 text-[#A855F7]' : 'bg-[#14141C] text-[#A1A1AA]'
            }`}>
              <opt.icon size={24} />
            </div>
            <span className={`text-lg font-medium ${
              localGender === opt.id ? 'text-[#F5F5F7]' : 'text-[#A1A1AA]'
            }`}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!localGender}
        className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        Continuar
      </button>
    </div>
  );
}
