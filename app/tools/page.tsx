import type { Metadata } from 'next';
import { ToolExplorer } from '@/components/tools-page/ToolExplorer';
import { toolCount } from '@/lib/tools';

export const metadata: Metadata = {
  title: 'Tüm Araçlar',
  description: `${toolCount}+ ücretsiz online aracı kategorilere göre keşfedin: PDF, görsel, yapay zekâ, SEO, geliştirici ve günlük araçlar.`,
  alternates: { canonical: '/tools' },
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Tüm araçlar</h1>
        <p className="mt-3 max-w-2xl text-muted">
          {toolCount}+ araç, 7 kategori. Aramak için yazmaya başlayın veya kategori seçin.
        </p>
      </header>
      <ToolExplorer />
    </div>
  );
}
