import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Section({
  title,
  subtitle,
  href,
  hrefLabel = 'Tümünü gör',
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted sm:text-[15px]">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="group flex items-center gap-1.5 text-sm font-semibold text-brand-500"
          >
            {hrefLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
