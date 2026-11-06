import React, { useState } from 'react';
import { QuizLayout } from './QuizLayout';
import { QuizStep1 } from './QuizStep1';
import { QuizStep2 } from './QuizStep2';

export function QuizFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);

  return (
    <QuizLayout step={step} totalSteps={2}>
      {step === 1 && <QuizStep1 onNext={() => setStep(2)} />}
      {step === 2 && <QuizStep2 onBack={() => setStep(1)} onComplete={onComplete} />}
    </QuizLayout>
  );
}
