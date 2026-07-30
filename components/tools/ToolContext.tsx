'use client';

import { createContext, useContext, useRef } from 'react';
import { track } from '@/components/analytics/Tracker';

/**
 * Hangi araç sayfasında olduğumuzu paylaşır; böylece ortak butonlar
 * (birincil eylem, kopyala, indir) kullanımı doğru araca yazabilir.
 */
const ToolContext = createContext<string | null>(null);

export function ToolProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <ToolContext.Provider value={slug}>{children}</ToolContext.Provider>;
}

export function useToolTracking() {
  const slug = useContext(ToolContext);
  // Aynı ziyarette aynı araç için "kullanıldı" olayını bir kez sayarız;
  // kaydırıcıyla oynayan biri istatistiği şişirmesin.
  const ranOnce = useRef(false);

  return {
    /** Aracın birincil eylemi çalıştırıldığında. */
    trackRun() {
      if (!slug || ranOnce.current) return;
      ranOnce.current = true;
      track('tool_run', { tool: slug });
    },
    /** Sonuç kopyalandığında veya indirildiğinde — başarılı kullanım göstergesi. */
    trackResult(kind: 'copy' | 'download') {
      if (!slug) return;
      track('tool_result', { tool: slug, label: kind });
    },
  };
}
