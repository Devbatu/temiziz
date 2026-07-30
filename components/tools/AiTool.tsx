'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Button,
  CopyButton,
  DownloadButton,
  ErrorNote,
  Field,
  ResultPanel,
  Select,
  TextArea,
  TextInput,
  ToolShell,
} from './shared';
import { getAiTool } from '@/lib/ai-prompts';

/** Renders any AI tool from its prompt spec — one component, ten tools. */
export function AiTool({ slug }: { slug: string }) {
  const spec = getAiTool(slug);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [truncated, setTruncated] = useState(false);

  if (!spec) return null;

  const set = (name: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setValues((v) => ({ ...v, [name]: e.target.value }));

  async function generate() {
    setBusy(true);
    setError('');
    setResult('');
    setTruncated(false);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool: slug, values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'İstek başarısız oldu.');
        return;
      }
      setResult(data.text);
      setTruncated(Boolean(data.truncated));
    } catch {
      setError('Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        {spec.fields.map((f) => {
          const wide = f.type === 'textarea';
          return (
            <div key={f.name} className={wide ? 'sm:col-span-2' : ''}>
              <Field label={f.label + (f.required ? ' *' : '')} hint={f.hint}>
                {f.type === 'textarea' ? (
                  <TextArea
                    value={values[f.name] ?? ''}
                    onChange={set(f.name)}
                    placeholder={f.placeholder}
                    className="min-h-[120px] font-sans text-sm"
                  />
                ) : f.type === 'select' ? (
                  <Select value={values[f.name] ?? f.options?.[0] ?? ''} onChange={set(f.name)}>
                    {f.options?.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                ) : (
                  <TextInput
                    value={values[f.name] ?? ''}
                    onChange={set(f.name)}
                    placeholder={f.placeholder}
                  />
                )}
              </Field>
            </div>
          );
        })}
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="mt-5">
        <Button onClick={generate} disabled={busy}>
          <Sparkles className={`h-4 w-4 ${busy ? 'animate-pulse' : ''}`} />
          {busy ? 'Üretiliyor…' : spec.cta}
        </Button>
      </div>

      {busy && (
        <div className="mt-5 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      )}

      {result && (
        <ResultPanel
          title="Sonuç"
          actions={
            <>
              <CopyButton value={result} />
              <DownloadButton data={result} filename={`${slug}.md`} label="Metni indir" />
            </>
          }
        >
          <p className="max-h-[520px] overflow-auto whitespace-pre-wrap text-[15px] leading-relaxed">
            {result}
          </p>
          {truncated && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              Çıktı uzunluk sınırına ulaştığı için kesilmiş olabilir. Daha kısa bir uzunluk seçmeyi
              deneyin.
            </p>
          )}
        </ResultPanel>
      )}

      <p className="mt-5 text-xs leading-relaxed text-muted">
        Üretilen metin yapay zekâ tarafından oluşturulur; yayınlamadan önce olgusal doğruluğunu
        kontrol edin. Girdileriniz yalnızca bu istek için işlenir ve saklanmaz.
      </p>
    </ToolShell>
  );
}

/* Thin per-tool wrappers so the registry can lazy-load each slug. */
export const AiResumeBuilder = () => <AiTool slug="ai-resume-builder" />;
export const AiCoverLetter = () => <AiTool slug="ai-cover-letter" />;
export const AiEmailGenerator = () => <AiTool slug="ai-email-generator" />;
export const AiBlogWriter = () => <AiTool slug="ai-blog-writer" />;
export const AiCaptionGenerator = () => <AiTool slug="ai-caption-generator" />;
export const AiProductDescription = () => <AiTool slug="ai-product-description" />;
export const AiPromptGenerator = () => <AiTool slug="ai-prompt-generator" />;
export const AiRewriteTool = () => <AiTool slug="ai-rewrite-tool" />;
export const AiHashtagGenerator = () => <AiTool slug="ai-hashtag-generator" />;
export const AiTitleGenerator = () => <AiTool slug="ai-title-generator" />;
