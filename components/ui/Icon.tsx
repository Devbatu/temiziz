'use client';

import * as icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

/**
 * Renders a Lucide icon by name so tool metadata can stay serialisable.
 * Falls back to a neutral glyph when a name is missing.
 */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp =
    (icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ??
    icons.Sparkles;
  return <Cmp aria-hidden {...props} />;
}
