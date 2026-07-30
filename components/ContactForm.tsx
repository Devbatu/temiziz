'use client';

import { useState } from 'react';
import { Button, ErrorNote, Field, Select, TextArea, TextInput, ToolShell } from '@/components/tools/shared';

const SUBJECTS = ['Araç önerisi', 'Hata bildirimi', 'Premium / fatura', 'API talebi', 'Diğer'];

export function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function submit() {
    if (!f.name.trim() || !f.message.trim()) {
      setError('Ad ve mesaj alanları zorunludur.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }
    setError('');
    // No backend is wired up yet, so hand off to the user's mail client.
    const body = encodeURIComponent(`${f.message}\n\n—\n${f.name} (${f.email})`);
    window.location.href = `mailto:destek@multitools.app?subject=${encodeURIComponent(
      `[${f.subject}] ${f.name}`,
    )}&body=${body}`;
    setSent(true);
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

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={submit}>Gönder</Button>
        <span className="text-xs text-muted">
          Form, mesajı e-posta uygulamanızda açar. Doğrudan destek@multitools.app adresine de
          yazabilirsiniz.
        </span>
      </div>

      {sent && (
        <p className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          E-posta uygulamanız açıldı. Açılmadıysa destek@multitools.app adresine yazabilirsiniz.
        </p>
      )}
    </ToolShell>
  );
}
