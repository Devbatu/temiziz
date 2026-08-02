'use client';

import { useRef, useState } from 'react';
import { Button, ErrorNote, Field, Select, TextArea, TextInput, ToolShell } from '@/components/tools/shared';

const SUBJECTS = ['Araç önerisi', 'Hata bildirimi', 'Premium / fatura', 'API talebi', 'Diğer'];

/** Mesajlar kendi sunucumuzdaki uca gider ve yönetim panelinde görünür. */
const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_URL
  ? process.env.NEXT_PUBLIC_ANALYTICS_URL.replace(/collect\.php$/, 'gonder.php')
  : '';

/** Sunucudan gelen hata kodlarının okunabilir karşılıkları. */
const HATA: Record<string, string> = {
  ad: 'Adınızı yazın.',
  eposta: 'Geçerli bir e-posta adresi girin.',
  mesaj: 'Mesajınız çok kısa. En az 10 karakter yazın.',
  spam: 'Mesajda çok fazla bağlantı var.',
  limit: 'Çok fazla gönderim yapıldı. Biraz sonra tekrar deneyin.',
  'cok-hizli': 'Formu biraz daha yavaş doldurun.',
};

export function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Bal küpü — ekranda görünmez, yalnızca botlar doldurur. */
  const [honeypot, setHoneypot] = useState('');
  const acilis = useRef(Date.now());

  async function submit() {
    if (!f.name.trim() || !f.message.trim()) {
      setError('Ad ve mesaj alanları zorunludur.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }
    if (!ENDPOINT) {
      setError('Form şu anda yapılandırılmamış. Lütfen daha sonra tekrar deneyin.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tur: 'mesaj',
          ad: f.name,
          eposta: f.email,
          konu: f.subject,
          mesaj: f.message,
          website: honeypot,
          t: acilis.current,
        }),
      });
      const veri = await res.json().catch(() => ({ ok: false }));
      if (veri?.ok) {
        setSent(true);
      } else {
        setError(HATA[veri?.hata] ?? 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch {
      setError('Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <ToolShell>
        <div className="py-6 text-center">
          <p className="text-lg font-bold">Mesajınız bize ulaştı.</p>
          <p className="mt-2 text-sm text-muted">
            En kısa sürede <strong>{f.email}</strong> adresine dönüş yapacağız.
          </p>
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Adınız">
          <TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="E-posta">
          <TextInput
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Konu">
            <Select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Mesajınız">
            <TextArea
              value={f.message}
              onChange={(e) => setF({ ...f, message: e.target.value })}
              className="min-h-[160px] font-sans text-sm"
            />
          </Field>
        </div>
      </div>

      {/* Bal küpü: ekran okuyucudan ve klavyeden gizli. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />

      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Gönderiliyor…' : 'Gönder'}
        </Button>
        <span className="text-xs text-muted">
          Mesajınız doğrudan bize ulaşır; e-posta uygulaması açılmaz.
        </span>
      </div>
    </ToolShell>
  );
}
