import type { Metadata } from 'next';
import { categories } from '@/lib/categories';
import { toolCount, liveToolCount } from '@/lib/tools';

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description:
    'MultiTools; PDF, görsel, SEO ve geliştirici araçlarını tek platformda toplayan ücretsiz bir online araç kütüphanesidir.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Hakkımızda</h1>

      <div className="mt-8 space-y-5 leading-relaxed text-muted">
        <p>
          MultiTools, gündelik dijital işleri hızlandırmak için kurulmuş bir online araç
          platformudur. Amacımız basit: bir PDF’i birleştirmek, bir görseli küçültmek veya bir JSON
          çıktısını düzenlemek için ayrı ayrı site aramak zorunda kalmayın.
        </p>
        <p>
          Bugün {categories.length} kategoride {toolCount} araç listeleniyor; bunların{' '}
          {liveToolCount} tanesi tam olarak çalışır durumda, kalanları geliştirme sırasında. Platform
          500+ araca ölçeklenecek şekilde tasarlandı: yeni bir araç eklemek, kayıt defterine tek bir
          giriş ve bir bileşen yazmaktan ibaret.
        </p>
        <h2 className="pt-4 text-xl font-bold text-[var(--fg)]">İlkelerimiz</h2>
        <ul className="space-y-3">
          <li>
            <strong className="text-[var(--fg)]">Gizlilik önce gelir.</strong> Araçların büyük
            bölümü tamamen tarayıcınızda çalışır; dosyalarınız cihazınızdan hiç çıkmaz.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Hız pazarlık konusu değil.</strong> Her sayfa
            statik olarak üretilir, her aracın kodu ayrı yüklenir. Kullanmadığınız aracın kodunu
            indirmezsiniz.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Engelsiz erişim.</strong> Kayıt, e-posta veya
            kredi kartı istemeden kullanabilirsiniz.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Sade arayüz.</strong> Her araç en fazla iki üç
            tıkla sonuç verecek şekilde tasarlanır.
          </li>
        </ul>
      </div>
    </div>
  );
}
