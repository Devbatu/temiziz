'use client';

import { useMemo, useState } from 'react';
import {
  CopyButton,
  Field,
  ResultPanel,
  Select,
  TextArea,
  TextInput,
  ToolShell,
} from '@/components/tools/shared';
import { categories } from '@/lib/categories';
import { slugify } from '@/lib/format';

/**
 * Generates a ready-to-paste registry entry so adding the 100th (or 500th) tool
 * stays a one-minute job.
 */
export function ToolScaffold() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0].id);
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [keywords, setKeywords] = useState('');
  const [popularity, setPopularity] = useState(70);

  const slug = slugify(name || 'yeni-arac');

  const snippet = useMemo(() => {
    const kw = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    return `{
  slug: '${slug}',
  name: '${name.replace(/'/g, "\\'") || 'Yeni Araç'}',
  category: '${category}',
  description:
    '${description.replace(/'/g, "\\'") || 'Kısa açıklama.'}',
  icon: '${icon}',
  keywords: [${kw.map((k) => `'${k.replace(/'/g, "\\'")}'`).join(', ')}],
  popularity: ${popularity},
  added: '${new Date().toISOString().slice(0, 10)}',
  badges: ['new'],
  live: true,
},`;
  }, [slug, name, category, description, icon, keywords, popularity]);

  const wiring = `// components/tools/registry.tsx
'${slug}': lazy(() => util().then((m) => m.${toPascal(slug)})),`;

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Araç adı">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: CSV to JSON" />
        </Field>
        <Field label="Kategori">
          <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lucide ikon adı">
          <TextInput value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Sparkles" />
        </Field>
        <Field label="Popülerlik (0-100)">
          <TextInput
            type="number"
            value={popularity}
            onChange={(e) => setPopularity(Number(e.target.value))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Açıklama" hint="Meta description’ın temeli">
            <TextInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tek cümlelik açıklama."
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Anahtar kelimeler" hint="virgülle ayırın">
            <TextArea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="csv json, csv dönüştür"
              className="min-h-[80px] font-sans text-sm"
            />
          </Field>
        </div>
      </div>

      <ResultPanel title={`lib/tools.ts — /tools/${slug}`} actions={<CopyButton value={snippet} />}>
        <pre className="overflow-auto font-mono text-[13px] leading-relaxed">{snippet}</pre>
      </ResultPanel>

      <ResultPanel title="Bileşen bağlantısı" actions={<CopyButton value={wiring} />}>
        <pre className="overflow-auto font-mono text-[13px] leading-relaxed">{wiring}</pre>
      </ResultPanel>
    </ToolShell>
  );
}

function toPascal(slug: string) {
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}
