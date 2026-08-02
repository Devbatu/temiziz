'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertCircle, Check, Copy, Download, Share2, Upload, X } from 'lucide-react';
import { useToolTracking } from './ToolContext';

/* ────────────────────────── primitives ────────────────────────── */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
        {hint && <span className="font-normal normal-case tracking-normal">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputBase =
  'w-full rounded-xl border border-[var(--border)] bg-transparent px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500/40';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputBase} appearance-none bg-[var(--bg-elevated)] ${props.className ?? ''}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      spellCheck={false}
      {...props}
      className={`${inputBase} min-h-[220px] resize-y font-mono text-[13px] leading-relaxed ${props.className ?? ''}`}
    />
  );
}

export function Button({
  variant = 'primary',
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const { trackRun } = useToolTracking();
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-lg shadow-brand-600/20 hover:-translate-y-0.5'
      : 'border border-[var(--border)] hover-surface';
  return (
    <button
      type="button"
      onClick={(e) => {
        // Birincil buton her aracin ana eylemidir; kullanim olcumu buradan.
        if (variant === 'primary') trackRun();
        onClick?.(e);
      }}
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 ${styles} ${props.className ?? ''}`}
    />
  );
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span className="text-brand-500">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#3163ff]"
      />
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/* ────────────────────────── actions ────────────────────────── */

export function CopyButton({ value, label = 'Kopyala' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  const { trackResult } = useToolTracking();
  const copy = useCallback(async () => {
    trackResult('copy');
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API blocked (insecure context) — fall back to a temp textarea.
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }, [value]);

  return (
    <Button variant="ghost" onClick={copy} disabled={!value}>
      {done ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      {done ? 'Kopyalandı' : label}
    </Button>
  );
}

export function DownloadButton({
  data,
  filename,
  mime = 'text/plain;charset=utf-8',
  label = 'İndir',
}: {
  data: string | Blob;
  filename: string;
  mime?: string;
  label?: string;
}) {
  const { trackResult } = useToolTracking();

  function download() {
    trackResult('download');
    const blob = typeof data === 'string' ? new Blob([data], { type: mime }) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Button variant="ghost" onClick={download} disabled={typeof data === 'string' && !data}>
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user dismissed the sheet — fall through to copying the link
      }
    }
    await navigator.clipboard.writeText(url);
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }
  return (
    <Button variant="ghost" onClick={share}>
      <Share2 className="h-4 w-4" />
      {done ? 'Bağlantı kopyalandı' : 'Paylaş'}
    </Button>
  );
}

/* ────────────────────────── file input ────────────────────────── */

export function Dropzone({
  accept,
  multiple = false,
  onFiles,
  hint,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      onClick={() => ref.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}
      className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
        over ? 'border-brand-500 bg-brand-500/5' : 'border-[var(--border)] hover:border-brand-400'
      }`}
    >
      <Upload className="h-8 w-8 text-brand-500" />
      <p className="mt-3 text-sm font-semibold">Dosyayı sürükleyin veya seçmek için tıklayın</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function FileChip({
  file,
  onRemove,
  extra,
}: {
  file: { name: string; size: number };
  onRemove?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3.5 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{file.name}</span>
        <span className="text-xs text-muted">{formatBytes(file.size)}</span>
      </span>
      {extra}
      {onRemove && (
        <button onClick={onRemove} aria-label="Kaldır" className="text-muted hover:text-rose-500">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ────────────────────────── layout ────────────────────────── */

export function ToolShell({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="surface rounded-2xl p-5 sm:p-6">
      {children}
      {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ResultPanel({
  title = 'Sonuç',
  children,
  actions,
}: {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-[var(--border)] bg-black/[0.02] p-4 dark:bg-white/[0.03]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{title}</h3>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] px-3.5 py-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}

/* ────────────────────────── helpers ────────────────────────── */

export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
