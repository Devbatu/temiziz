import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Tool } from '@/lib/tools';
import { categoryMap } from '@/lib/categories';
import { Icon } from './Icon';

const badgeLabels: Record<string, string> = {
  popular: 'Popüler',
  new: 'Yeni',
  trending: 'Trend',
  pro: 'Premium',
};

const badgeStyles: Record<string, string> = {
  popular: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  new: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  trending: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
  pro: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
};

export function ToolCard({ tool, compact = false }: { tool: Tool; compact?: boolean }) {
  const cat = categoryMap.get(tool.category)!;
  const badge = tool.badges?.[0];

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group surface relative flex flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/50 hover:shadow-xl hover:shadow-brand-500/10"
    >
      {/* Hover wash tinted with the category colour */}
      <span
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06]`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-lg shadow-black/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
        >
          <Icon name={tool.icon} className="h-6 w-6" />
        </span>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeStyles[badge]}`}>
              {badgeLabels[badge]}
            </span>
          )}
          <ArrowUpRight className="h-4 w-4 -translate-x-1 text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
      </div>

      <h3 className="relative mt-4 text-[15px] font-bold leading-snug">{tool.name}</h3>
      {!compact && (
        <p className="relative mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {tool.description}
        </p>
      )}
      <span className="relative mt-3 text-[11px] font-medium uppercase tracking-wider text-muted">
        {cat.short}
      </span>
    </Link>
  );
}
