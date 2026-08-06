import Link from 'next/link';
import { categories } from '@/lib/categories';
import { tools } from '@/lib/tools';

/**
 * Kategorilere ayrılmış, sunucuda basılan tam araç dizini.
 *
 * NEDEN VAR: sayfanın üstündeki gezgin bir istemci bileşeni ve arama
 * parametresini okuduğu için bir Suspense sınırının içinde duruyor. Statik
 * derlemede o sınır yalnızca yer tutucu olarak basılıyor; yani /tools sayfası
 * sunucudan geldiğinde içinde tek bir araç bağlantısı bulunmuyordu. Arama
 * motoru ve JavaScript'i çalışmayan ziyaretçi için sayfa boştu.
 *
 * Bu bölüm aynı listeyi HTML'e yazar: gezgin filtrelemeyi hızlandırır, dizin
 * ise sayfanın gerçek içeriğini oluşturur ve her araca bağlantı verir.
 */
export function ToolDirectory() {
  return (
    <section className="mt-16 border-t border-[var(--border)] pt-12">
      <h2 className="text-2xl font-extrabold tracking-tight">Kategorilere göre tüm araçlar</h2>
      <p className="mt-3 max-w-2xl text-muted">
        Tüm araçlar ücretsizdir, üyelik gerektirmez ve işlemler tarayıcınızda çalışır.
        Aradığınız araca kategorisinden ulaşabilirsiniz.
      </p>

      <div className="mt-10 space-y-10">
        {categories.map((cat) => {
          const list = tools
            .filter((t) => t.category === cat.id)
            .sort((a, b) => b.popularity - a.popularity);
          if (list.length === 0) return null;

          return (
            <div key={cat.id}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-bold">
                  <Link href={`/category/${cat.slug}`} className="hover:text-brand-500">
                    {cat.name}
                  </Link>
                </h3>
                <span className="text-xs text-muted">{list.length} araç</span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                {cat.description}
              </p>

              <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => (
                  <li key={t.slug} className="text-sm leading-relaxed">
                    <Link
                      href={`/tools/${t.slug}`}
                      className="font-medium hover:text-brand-500"
                    >
                      {t.name}
                    </Link>
                    <span className="text-muted"> — {t.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
