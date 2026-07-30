'use client';

import { useState } from 'react';
import {
  Button,
  CopyButton,
  ErrorNote,
  Field,
  ResultPanel,
  Select,
  TextInput,
  ToolShell,
} from './shared';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA'];

interface Answer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

/**
 * Queries Cloudflare's public DNS-over-HTTPS resolver straight from the browser,
 * so no request ever touches our servers.
 */
export function DnsLookup() {
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('A');
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function lookup() {
    const host = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
      setError('Geçerli bir alan adı girin (örn. ornek.com).');
      setAnswers(null);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
        { headers: { accept: 'application/dns-json' } },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAnswers(data.Answer ?? []);
      if (!data.Answer?.length) {
        setError(`${host} için ${type} kaydı bulunamadı.`);
      }
    } catch {
      setAnswers(null);
      setError('Sorgu tamamlanamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  const text = answers?.map((a) => `${a.name}\t${a.TTL}\t${type}\t${a.data}`).join('\n') ?? '';

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <Field label="Alan adı">
          <TextInput
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            placeholder="ornek.com"
          />
        </Field>
        <Field label="Kayıt türü">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {RECORD_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-4">
        <Button onClick={lookup} disabled={busy}>
          {busy ? 'Sorgulanıyor…' : 'Sorgula'}
        </Button>
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {answers && answers.length > 0 && (
        <ResultPanel title={`${answers.length} kayıt`} actions={<CopyButton value={text} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted">
                  <th className="pb-2 pr-4 font-semibold">Ad</th>
                  <th className="pb-2 pr-4 font-semibold">TTL</th>
                  <th className="pb-2 font-semibold">Değer</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {answers.map((a, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-4">{a.name}</td>
                    <td className="py-2 pr-4 text-muted">{a.TTL}s</td>
                    <td className="break-all py-2">{a.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ResultPanel>
      )}
      <p className="mt-4 text-xs text-muted">
        Sorgular doğrudan tarayıcınızdan Cloudflare’in genel DNS çözümleyicisine (1.1.1.1) gider;
        sunucularımızda kayıt tutulmaz.
      </p>
    </ToolShell>
  );
}
