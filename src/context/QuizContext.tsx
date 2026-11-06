import React, { createContext, useContext, useState, useEffect } from 'react';

interface QuizData {
  gender: 'female' | 'male' | 'other' | null;
  styleId: string | null;
  completed: boolean;
}

interface QuizContextData {
  quizData: QuizData;
  setGender: (gender: QuizData['gender']) => void;
  setStyleId: (styleId: string) => void;
  completeQuiz: () => void;
  resetQuiz: () => void;
}

const defaultQuizData: QuizData = {
  gender: null,
  styleId: null,
  completed: false,
};

const QuizContext = createContext<QuizContextData | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [quizData, setQuizData] = useState<QuizData>(() => {
    try {
      const saved = localStorage.getItem('fotoflow_quiz_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse fotoflow_quiz_data', e);
    }
    return defaultQuizData;
  });

  useEffect(() => {
    localStorage.setItem('fotoflow_quiz_data', JSON.stringify(quizData));
  }, [quizData]);

  const setGender = (gender: QuizData['gender']) => {
    setQuizData((prev) => ({ ...prev, gender }));
  };

  const setStyleId = (styleId: string) => {
    setQuizData((prev) => ({ ...prev, styleId }));
  };

  const completeQuiz = () => {
    setQuizData((prev) => ({ ...prev, completed: true }));
  };

  const resetQuiz = () => {
    setQuizData(defaultQuizData);
    localStorage.removeItem('fotoflow_quiz_data');
  };

  return (
    <QuizContext.Provider value={{ quizData, setGender, setStyleId, completeQuiz, resetQuiz }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
