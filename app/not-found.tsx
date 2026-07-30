import Link from 'next/link';
import { popularTools } from '@/lib/tools';
import { ToolCard } from '@/components/ui/ToolCard';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <p className="bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-7xl font-extrabold text-transparent">
        404
      </p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
        Aradığınız sayfa bulunamadı
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Bağlantı taşınmış veya silinmiş olabilir. Aşağıdaki popüler araçlardan biriyle devam
        edebilirsiniz.
      </p>
      <Link
        href="/tools"
        className="mt-7 inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-6 text-sm font-semibold text-white"
      >
        Tüm araçlara git
      </Link>

      <div className="mt-14 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
        {popularTools.slice(0, 4).map((t) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
      </div>
    </div>
  );
}
