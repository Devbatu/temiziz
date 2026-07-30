import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { workflowsForTool } from '@/lib/workflows';
import { getTool } from '@/lib/tools';
import { categoryMap } from '@/lib/categories';
import { Icon } from './Icon';

/**
 * "Bu araçtan sonra" bölümü.
 *
 * Kategoriler arası site içi bağlantı kurar: kullanıcı için gerçek bir sonraki
 * adım önerisi, arama motoru için de sayfalar arasında keşif yolu.
 */
export function WorkflowLinks({ slug }: { slug: string }) {
  const flows = workflowsForTool(slug, 2);
  if (flows.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="text-2xl font-extrabold tracking-tight">Bu araçla birlikte kullanılanlar</h2>
      <p className="mt-2 text-sm text-muted">
        Aynı işi yapan kullanıcıların genellikle izlediği sıra.
      </p>

      <div className="mt-6 space-y-5">
        {flows.map(({ workflow, next, prev }) => (
          <div key={workflow.id} className="surface rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-500">
              {workflow.title}
            </p>

            <ol className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2">
              {workflow.steps.map((step, i) => {
                const tool = getTool(step);
                if (!tool) return null;
                const current = step === slug;
                const cat = categoryMap.get(tool.category)!;

                return (
                  <li key={step} className="flex items-center gap-1.5">
                    {i > 0 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />}
                    {current ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/12 px-2.5 py-1.5 text-[13px] font-semibold text-brand-500">
                        <Icon name={tool.icon} className="h-3.5 w-3.5" />
                        {tool.name}
                      </span>
                    ) : (
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:border-brand-400 hover:text-brand-500"
                      >
                        <Icon name={tool.icon} className={`h-3.5 w-3.5 bg-gradient-to-br ${cat.gradient} bg-clip-text`} />
                        {tool.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>

            {next && getTool(next) && (
              <p className="mt-4 text-sm text-muted">
                Sıradaki adım:{' '}
                <Link href={`/tools/${next}`} className="font-semibold text-brand-500">
                  {getTool(next)!.name}
                </Link>{' '}
                — {getTool(next)!.description.toLowerCase()}
              </p>
            )}
            {!next && prev && getTool(prev) && (
              <p className="mt-4 text-sm text-muted">
                Önceki adım:{' '}
                <Link href={`/tools/${prev}`} className="font-semibold text-brand-500">
                  {getTool(prev)!.name}
                </Link>
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
