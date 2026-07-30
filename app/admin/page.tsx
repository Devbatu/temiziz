import type { Metadata } from 'next';
import Link from 'next/link';
import { categories } from '@/lib/categories';
import { tools, toolsByCategory, toolCount, liveToolCount } from '@/lib/tools';
import { posts } from '@/lib/blog';
import { ToolScaffold } from '@/components/admin/ToolScaffold';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'Yönetim Paneli',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const stats = [
    { label: 'Toplam araç', value: toolCount },
    { label: 'Çalışan araç', value: liveToolCount },
    { label: 'Geliştirmede', value: toolCount - liveToolCount },
    { label: 'Blog yazısı', value: posts.length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Yönetim paneli</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Araç kayıt defterinin canlı özeti. Yeni araç eklemek için aşağıdaki üreticiyi kullanın —
        çıktıyı <code className="font-mono text-brand-500">lib/tools.ts</code> içine yapıştırıp
        bileşenini <code className="font-mono text-brand-500">components/tools/registry.tsx</code>{' '}
        dosyasına bağlamanız yeterli.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="surface rounded-2xl p-6">
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Kategoriler</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const list = toolsByCategory(c.id);
            const live = list.filter((t) => t.live).length;
            return (
              <div key={c.id} className="surface rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${c.gradient} text-white`}
                  >
                    <Icon name={c.icon} className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-xs text-muted">
                      {list.length} araç · {live} çalışıyor
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${c.gradient}`}
                    style={{ width: `${list.length ? (live / list.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Yeni araç ekle</h2>
        <div className="mt-4">
          <ToolScaffold />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Geliştirme bekleyen araçlar</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {tools
            .filter((t) => !t.live)
            .map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="surface rounded-full px-3.5 py-1.5 text-xs font-medium hover:text-brand-500"
              >
                {t.name}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
