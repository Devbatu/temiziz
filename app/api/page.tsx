import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, Gauge, KeyRound, Webhook } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Erişimi',
  description:
    'MultiTools araçlarını kendi uygulamanıza entegre edin: REST API, webhook desteği ve yüksek işlem limitleri.',
  alternates: { canonical: '/api' },
};

const features = [
  { icon: Code2, title: 'REST API', text: 'Basit, öngörülebilir uç noktalar ve JSON yanıtlar.' },
  { icon: KeyRound, title: 'API anahtarı', text: 'Panelden anahtar üretin, istediğiniz an iptal edin.' },
  { icon: Webhook, title: 'Webhook', text: 'Uzun süren işlemler tamamlandığında bildirim alın.' },
  { icon: Gauge, title: 'Yüksek limit', text: 'Aylık 100.000 istek; aşımda kullandıkça öde.' },
];

const sample = `curl -X POST https://api.multitools.app/v1/pdf/merge \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "files[]=@rapor-1.pdf" \\
  -F "files[]=@rapor-2.pdf" \\
  -o birlesik.pdf`;

export default function ApiPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">API erişimi</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Platformdaki araçların çoğunu kendi ürününüzden çağırabilirsiniz. Dosya işleme altyapısını
        sıfırdan kurmak yerine tek bir HTTP isteğiyle sonuç alın.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="surface rounded-2xl p-6">
            <f.icon className="h-6 w-6 text-brand-500" />
            <h2 className="mt-4 font-bold">{f.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Örnek istek</h2>
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-black/[0.03] p-5 font-mono text-[13px] leading-relaxed dark:bg-white/[0.04]">
          {sample}
        </pre>
        <p className="mt-4 text-sm text-muted">
          API erişimi İş planına dahildir. Anahtar talebi ve teknik dokümantasyon için bizimle
          iletişime geçin.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-5 text-sm font-semibold text-white"
          >
            API anahtarı talep et
          </Link>
          <Link
            href="/pricing"
            className="surface inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold"
          >
            Planları gör
          </Link>
        </div>
      </section>
    </div>
  );
}
