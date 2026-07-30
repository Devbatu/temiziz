import type { Metadata } from 'next';
import { jsonLdScript } from '@/lib/jsonld';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPost, posts } from '@/lib/blog';
import { getTool } from '@/lib/tools';
import { markdownToHtml } from '@/lib/format';
import { absoluteUrl, site } from '@/lib/site';
import { ToolCard } from '@/components/ui/ToolCard';
import { AdUnit } from '@/components/ads/AdUnit';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}`),
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = markdownToHtml(post.body);
  const related = post.tools.map(getTool).filter((t) => t !== undefined);

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name, url: site.url },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(pageJsonLd)}
      />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand-500">Ana sayfa</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-brand-500">Blog</Link>
        </nav>

        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
          {post.category}
        </span>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {new Date(post.date).toLocaleDateString('tr-TR', { dateStyle: 'long' })} · {post.readingTime} dk
          okuma
        </p>

        <div
          className="mt-8 leading-relaxed [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:my-4 [&_p]:text-muted"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-10">
          <AdUnit slot="blog-inarticle" format="in-article" />
        </div>

        {related.length > 0 && (
          <section className="mt-12 border-t border-[var(--border)] pt-10">
            <h2 className="mb-6 text-xl font-bold">Bu yazıda geçen araçlar</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((t) => (
                <ToolCard key={t.slug} tool={t} compact />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
