import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { categories } from '@/lib/categories';
import { toolsByCategory } from '@/lib/tools';
import { site } from '@/lib/site';

const legal = [
  { href: '/about', label: 'Hakkımızda' },
  { href: '/blog', label: 'Blog' },
  { href: '/pricing', label: 'Premium' },
  { href: '/api', label: 'API' },
  { href: '/privacy', label: 'Gizlilik' },
  { href: '/terms', label: 'Kullanım Şartları' },
  { href: '/contact', label: 'İletişim' },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_3fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-extrabold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-[17px]">
                Multi<span className="text-brand-500">Tools</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{site.description}</p>
            <p className="mt-4 text-xs text-muted">
              Araçların çoğu tamamen tarayıcınızda çalışır — dosyalarınız cihazınızdan çıkmaz.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 3).map((c) => (
              <div key={c.id}>
                <h3 className="text-sm font-bold">{c.name}</h3>
                <ul className="mt-3 space-y-2">
                  {toolsByCategory(c.id)
                    .slice(0, 6)
                    .map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/tools/${t.slug}`}
                          className="text-sm text-muted transition-colors hover:text-brand-500"
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="text-sm font-bold">Platform</h3>
              <ul className="mt-3 space-y-2">
                {legal.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-brand-500"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="text-xs text-muted transition-colors hover:text-brand-500"
              >
                {c.short}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
