import type { Metadata } from 'next';
import { jsonLdScript } from '@/lib/jsonld';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { categories, getCategory } from '@/lib/categories';
import { toolsByCategory } from '@/lib/tools';
import { ToolCard } from '@/components/ui/ToolCard';
import { Icon } from '@/components/ui/Icon';
import { absoluteUrl, site } from '@/lib/site';
import { AdUnit } from '@/components/ads/AdUnit';
import { OfferCard } from '@/components/ads/OfferCard';
import { offersForCategory } from '@/lib/monetization';

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return {};
  const count = toolsByCategory(cat.id).length;
  const title = `${cat.name} — ${count} Ücretsiz Online Araç`;
  return {
    title,
    description: cat.description,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: {
      title: `${title} | ${site.name}`,
      description: cat.description,
      url: absoluteUrl(`/category/${cat.slug}`),
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const list = toolsByCategory(cat.id).sort((a, b) => b.popularity - a.popularity);
  const sponsored = offersForCategory(cat.id, 2);

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.name,
    description: cat.description,
    url: absoluteUrl(`/category/${cat.slug}`),
    hasPart: list.map((t) => ({
      '@type': 'SoftwareApplication',
      name: t.name,
      url: absoluteUrl(`/tools/${t.slug}`),
      applicationCategory: 'WebApplication',
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(pageJsonLd)}
      />

      <div className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="aurora opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <nav aria-label="breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-brand-500">
              Ana sayfa
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-brand-500">
              Araçlar
            </Link>
            <span>/</span>
            <span className="text-[var(--fg)]">{cat.name}</span>
          </nav>
          <span
            className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${cat.gradient} text-white shadow-xl`}
          >
            <Icon name={cat.icon} className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">{cat.name}</h1>
          <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted">{cat.description}</p>
          <p className="mt-4 text-sm font-semibold text-brand-500">{list.length} araç</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <AdUnit slot="category-top" format="leaderboard" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>

        {sponsored.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {sponsored.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}

        {cat.intro && cat.intro.length > 0 && (
          <section className="mt-14 max-w-3xl">
            <h2 className="text-lg font-bold">{cat.name} hakkında</h2>
            <div className="mt-4 space-y-4 leading-relaxed text-muted">
              {cat.intro.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        <div className="mt-14">
          <h2 className="text-lg font-bold">Diğer kategoriler</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories
              .filter((c) => c.id !== cat.id)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="surface flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Icon name={c.icon} className="h-4 w-4 text-brand-500" />
                  {c.name}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
