import type { Metadata } from 'next';
import { jsonLdScript } from '@/lib/jsonld';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, ShieldCheck, Zap } from 'lucide-react';
import { getTool, relatedTools, tools } from '@/lib/tools';
import { categoryMap } from '@/lib/categories';
import { toolFaq, toolJsonLd, toolMetaDescription, toolSteps, toolTitle } from '@/lib/seo';
import { postsForTool } from '@/lib/blog';
import { absoluteUrl, site } from '@/lib/site';
import { ToolRuntime } from '@/components/tools/registry';
import { ShareButton } from '@/components/tools/shared';
import { ToolCard } from '@/components/ui/ToolCard';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { AdUnit } from '@/components/ads/AdUnit';
import { WorkflowLinks } from '@/components/ui/WorkflowLinks';
import { OfferCard } from '@/components/ads/OfferCard';
import { offersForTool } from '@/lib/monetization';

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const description = toolMetaDescription(tool);
  return {
    title: toolTitle(tool),
    description,
    keywords: tool.keywords,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: {
      type: 'website',
      title: `${toolTitle(tool)} | ${site.name}`,
      description,
      url: absoluteUrl(`/tools/${tool.slug}`),
    },
    twitter: { card: 'summary_large_image', title: toolTitle(tool), description },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const cat = categoryMap.get(tool.category)!;
  const related = relatedTools(tool.slug);
  const faq = toolFaq(tool);
  const articles = postsForTool(tool.slug);
  const sponsored = offersForTool(tool.slug, tool.category, 1);

  return (
    <>
      {toolJsonLd(tool).map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(ld)}
        />
      ))}

      {/* ── header ── */}
      <div className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="aurora opacity-50" />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-brand-500">Ana sayfa</Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-brand-500">Araçlar</Link>
            <span>/</span>
            <Link href={`/category/${cat.slug}`} className="hover:text-brand-500">{cat.name}</Link>
            <span>/</span>
            <span className="text-[var(--fg)]">{tool.name}</span>
          </nav>

          <div className="flex flex-wrap items-start gap-4">
            <span
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${cat.gradient} text-white shadow-xl`}
            >
              <Icon name={tool.icon} className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{tool.name}</h1>
              <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
                {tool.description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-brand-500" /> Anında sonuç
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Üyelik gerekmez
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Eklenme: {new Date(tool.added).toLocaleDateString('tr-TR', { dateStyle: 'long' })}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── live tool ── */}
        <ToolRuntime slug={tool.slug} name={tool.name} />

        <div className="mt-4 flex flex-wrap gap-2">
          <ShareButton title={tool.name} />
        </div>

        {/* Highest-value placement: directly under a just-completed result. */}
        <div className="mt-8">
          <AdUnit slot="tool-below" format="leaderboard" />
        </div>

        {sponsored.length > 0 && (
          <div className="mt-4 space-y-3">
            {sponsored.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}

        {/* ── about ── */}
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight">{tool.name} nedir?</h2>
          <p className="mt-3 leading-relaxed text-muted">
            {tool.about ??
              `${tool.name}, ${tool.description.toLowerCase().replace(/\.$/, '')} amacıyla geliştirilmiş ücretsiz bir çevrimiçi araçtır. Kurulum gerektirmez, tarayıcınızda çalışır ve sonucu tek tıkla kopyalayıp indirebilirsiniz.`}
          </p>

          {(tool.useCases?.length ?? 0) > 0 && (
            <>
              <h3 className="mt-8 text-lg font-bold">Ne işe yarar?</h3>
              <ul className="mt-3 space-y-2.5">
                {tool.useCases!.map((u) => (
                  <li key={u} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-muted">{u}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="mt-8 text-lg font-bold">Nasıl kullanılır?</h3>
          <ol className="mt-3 space-y-3">
            {toolSteps(tool).map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/12 text-xs font-bold text-brand-500">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed text-muted">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── related tools ── */}
        {related.length > 0 && (
          <section className="mt-14">
            <div className="mb-6 flex items-end justify-between gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight">Benzer araçlar</h2>
              <Link href={`/category/${cat.slug}`} className="text-sm font-semibold text-brand-500">
                {cat.name}
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-14">
          <AdUnit slot="tool-sidebar" format="rectangle" />
        </div>

        <WorkflowLinks slug={tool.slug} />

        {/* ── faq ── */}
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight">Sık sorulan sorular</h2>
          <Faq items={faq} />
        </section>

        {/* ── blog ── */}
        {articles.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 text-2xl font-extrabold tracking-tight">İlgili yazılar</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {articles.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="surface group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
                    {p.category}
                  </span>
                  <h3 className="mt-2 font-bold leading-snug group-hover:text-brand-500">{p.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
