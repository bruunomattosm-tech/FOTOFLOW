import { useEffect, useRef } from 'react';
import type { useFlow } from '@/features/flow/useFlow';
import { trackEvent } from '@/lib/track';
export function useFlowTracking(f: ReturnType<typeof useFlow>) {
  const last = useRef(''); const complete = useRef(false);
  useEffect(() => {
    const key = `${f.country}:${f.step}`; if (key === last.current) return; last.current = key;
    const payload = { country: f.country };
    if (f.step === 'gender') { trackEvent('PageView', payload); trackEvent('ViewContent', payload); }
    if (f.step === 'style') trackEvent('SelectGender', { ...payload, gender: f.gender });
    if (f.step === 'refs') trackEvent('SelectStyle', { ...payload, style: f.style });
    if (f.step === 'result' && f.results[0]?.urlFinal) trackEvent('PreviewGenerated', payload);
  }, [f.step, f.country, f.gender, f.style, f.results]);
  useEffect(() => { const count = f.photos.filter(Boolean).length; if (count === 5 && !complete.current) { trackEvent('PhotoUploaded', { country: f.country, count: 5 }); complete.current = true; } if (count === 0) complete.current = false; }, [f.photos, f.country]);
}
