1. **Create Quiz Context/Store**: Create `src/context/QuizContext.tsx` to hold the selected `gender` and `styleId`. It will save to `localStorage` under `fotoflow_quiz_data`.
2. **Create Quiz Components**:
   - `src/components/quiz/QuizStep1.tsx` (Gender Selection)
   - `src/components/quiz/QuizStep2.tsx` (Style Selection)
   - `src/components/quiz/QuizLayout.tsx` (Progress bar & Container)
3. **Refactor HomePage**: Remove the hardcoded `gender` state and rely on the new Quiz flow. If no gender/style is selected, render the quiz flow before showing the current app content (wizard).
4. **Integrate with Landing Page**: Update the style selection on `LandingPage.tsx` and `Styles.tsx` to write to the `localStorage` key (or use URL query params) so the quiz skips or pre-selects the style.
5. **Add tracking**: Call `track('SelectGender', { gender })` and `track('SelectQuizStyle', { styleId })`.
6. **Pre-commit verification**: Build the app and use playwright to verify the flow visually.
