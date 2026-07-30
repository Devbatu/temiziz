import Link from 'next/link';
import { jsonLdScript } from '@/lib/jsonld';
import type { Metadata } from 'next';
import { ArrowRight, Clock, Lock, Shield, Sparkles, Zap } from 'lucide-react';
import { Hero } from '@/components/home/Hero';
import { Section } from '@/components/ui/Section';
import { ToolCard } from '@/components/ui/ToolCard';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { categories } from '@/lib/categories';
import {
  popularTools,
  newestTools,
  trendingTools,
  toolsByCategory,
  toolCount,
} from '@/lib/tools';
import { posts } from '@/lib/blog';
import { site } from '@/lib/site';
import { AdUnit } from '@/components/ads/AdUnit';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const stats = [
  { label: 'Toplam araç', value: `${toolCount}+` },
  { label: 'Kategori', value: `${categories.length}` },
  { label: 'Üyelik gereksinimi', value: 'Yok' },
  { label: 'Ortalama işlem süresi', value: '< 2 sn' },
];

const promises = [
  {
    icon: Zap,
    title: 'Anında sonuç',
    text: 'Araçların çoğu tarayıcınızda çalışır; sunucuya yükleme ve kuyruk bekleme yok.',
  },
  {
    icon: Lock,
    title: 'Dosyanız sizde kalır',
    text: 'İstemci tarafında işlenen dosyalar cihazınızdan hiç çıkmaz.',
  },
  {
    icon: Shield,
    title: 'Üyelik yok',
    text: 'Kayıt olmadan, e-posta vermeden tüm temel araçları kullanabilirsiniz.',
  },
  {
    icon: Sparkles,
    title: 'Sürekli büyüyor',
    text: 'Platform 500+ araca ölçeklenecek şekilde tasarlandı; her hafta yenisi ekleniyor.',
  },
];

const faq = [
  {
    q: 'Araçları kullanmak ücretsiz mi?',
    a: 'Evet. Platformdaki araçların tamamı temel kullanım için ücretsizdir. Premium üyelik yalnızca toplu işlem, daha yüksek dosya limitleri ve reklamsız deneyim gibi ek avantajlar sunar.',
  },
  {
    q: 'Yüklediğim dosyalara ne oluyor?',
    a: 'PDF ve görsel araçlarının büyük bölümü tamamen tarayıcınızda çalışır; dosya hiçbir zaman sunucuya gitmez. Sunucu gerektiren araçlarda dosyalar işlem biter bitmez silinir.',
  },
  {
    q: 'Üye olmam gerekiyor mu?',
    a: 'Hayır. Hiçbir aracı kullanmak için hesap açmanız gerekmez.',
  },
  {
    q: 'Mobil cihazda da çalışıyor mu?',
    a: 'Evet. Tüm arayüz mobil öncelikli tasarlandı; araçlar telefon ve tablette masaüstüyle aynı şekilde çalışır.',
  },
  {
    q: 'Kendi uygulamamda kullanabilir miyim?',
    a: 'Evet, API erişimi ile araçların çoğunu kendi ürününüze entegre edebilirsiniz. Ayrıntılar için API sayfasına göz atın.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(faqJsonLd)}
      />

      <Hero />

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="surface grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[var(--border)] lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-[var(--bg-elevated)] px-6 py-7 text-center">
              <div className="bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1.5 text-xs font-medium text-muted sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <Section
        title="En çok kullanılan araçlar"
        subtitle="Kullanıcıların en sık tercih ettiği araçlarla hemen başlayın."
        href="/tools"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularTools.slice(0, 8).map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AdUnit slot="home-mid" format="leaderboard" />
      </section>

      {/* Categories */}
      <Section
        title="Kategoriler"
        subtitle="İhtiyacınıza göre doğru araca hızlıca ulaşın."
        href="/tools"
        hrefLabel="Tüm araçlar"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const count = toolsByCategory(c.id).length;
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="surface group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span
                  className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${c.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-25`}
                />
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon name={c.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{c.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500">
                  {count} araç
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* Trending + new */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Trend araçlar</h2>
            <p className="mt-2 text-sm text-muted">Bu hafta ilgi gören araçlar.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {trendingTools.slice(0, 6).map((t) => (
                <ToolCard key={t.slug} tool={t} compact />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Son eklenenler</h2>
            <p className="mt-2 text-sm text-muted">Platforma yeni katılan araçlar.</p>
            <div className="mt-6 space-y-2">
              {newestTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="surface group flex items-center gap-3 rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white">
                    <Icon name={t.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{t.name}</span>
                    <span className="block truncate text-xs text-muted">{t.description}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted">
                    <Clock className="h-3 w-3" />
                    {new Date(t.added).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((p) => (
            <div key={p.title} className="surface rounded-2xl p-6">
              <p.icon className="h-6 w-6 text-brand-500" />
              <h3 className="mt-4 font-bold">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Section title="Blog" subtitle="Araçları daha verimli kullanmanız için rehberler." href="/blog">
        <div className="grid gap-4 md:grid-cols-3">
          {posts.slice(0, 3).map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="surface group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
                {p.category}
              </span>
              <h3 className="mt-2 text-lg font-bold leading-snug group-hover:text-brand-500">
                {p.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.excerpt}</p>
              <span className="mt-4 text-xs text-muted">
                {new Date(p.date).toLocaleDateString('tr-TR', { dateStyle: 'long' })} ·{' '}
                {p.readingTime} dk okuma
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AdUnit slot="home-bottom" format="rectangle" />
      </section>

      <Section title="Sık sorulan sorular" subtitle={`${site.name} hakkında merak edilenler.`}>
        <div className="mx-auto max-w-3xl">
          <Faq items={faq} />
        </div>
      </Section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 px-6 py-16 text-center text-white">
          <div className="absolute inset-0 opacity-20 grid-bg" />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">
            Hemen bir araç seçin, işiniz 2 tıkla bitsin
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/85">
            Kayıt yok, kurulum yok, bekleme yok. {toolCount}+ araç sizi bekliyor.
          </p>
          <Link
            href="/tools"
            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow-xl transition-transform hover:-translate-y-0.5"
          >
            Tüm araçları keşfet <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
