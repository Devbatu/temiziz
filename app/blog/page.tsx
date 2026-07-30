import type { Metadata } from 'next';
import Link from 'next/link';
import { posts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Online araçları daha verimli kullanmanız için rehberler: PDF, görsel optimizasyonu, SEO, güvenlik ve geliştirme ipuçları.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Blog</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Araçlardan en iyi verimi almanız için hazırlanmış pratik rehberler.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="surface group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
              {p.category}
            </span>
            <h2 className="mt-2 text-xl font-bold leading-snug group-hover:text-brand-500">
              {p.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.excerpt}</p>
            <span className="mt-4 text-xs text-muted">
              {new Date(p.date).toLocaleDateString('tr-TR', { dateStyle: 'long' })} · {p.readingTime} dk
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
