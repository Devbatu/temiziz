'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  Button,
  Dropzone,
  ErrorNote,
  Field,
  FileChip,
  ResultPanel,
  Select,
  Slider,
  Stat,
  TextInput,
  ToolShell,
  formatBytes,
} from './shared';
import { PasswordRequiredError, canvasToBlob, openPdf, renderPage } from '@/lib/pdfjs';

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Shared file + progress + error state for the long-running conversions. */
function useConversion() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    setProgress(0);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message || 'İşlem tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  }

  return { file, setFile, busy, progress, setProgress, error, setError, run };
}

function ProgressBar({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <div className="mt-4">
      <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-violet-600 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">%{Math.round(value)} tamamlandı</p>
    </div>
  );
}

/* ═══════════════════════════ PDF → JPG ═══════════════════════════ */

export function PdfToJpg() {
  const { file, setFile, busy, progress, setProgress, error, setError, run } = useConversion();
  const [dpi, setDpi] = useState(150);
  const [format, setFormat] = useState('image/jpeg');
  const [pages, setPages] = useState<Array<{ url: string; blob: Blob; n: number }>>([]);

  const convert = () =>
    run(async () => {
      if (!file) throw new Error('Önce bir PDF seçin.');
      const doc = await openPdf(await file.arrayBuffer());
      const scale = dpi / 72;
      const out: Array<{ url: string; blob: Blob; n: number }> = [];
      for (let n = 1; n <= doc.numPages; n++) {
        const canvas = await renderPage(doc, n, scale);
        const blob = await canvasToBlob(canvas, format, 0.92);
        out.push({ url: URL.createObjectURL(blob), blob, n });
        setProgress((n / doc.numPages) * 100);
      }
      setPages(out);
    });

  async function downloadAll() {
    const { zipSync } = await import('fflate');
    const ext = format.split('/')[1];
    const entries: Record<string, Uint8Array> = {};
    for (const p of pages) {
      entries[`sayfa-${String(p.n).padStart(3, '0')}.${ext}`] = new Uint8Array(
        await p.blob.arrayBuffer(),
      );
    }
    saveBlob(new Blob([zipSync(entries) as unknown as BlobPart], { type: 'application/zip' }), 'pdf-gorseller.zip');
  }

  return (
    <ToolShell>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={(f) => (setFile(f[0]), setPages([]))} />
      ) : (
        <FileChip file={file} onRemove={() => (setFile(null), setPages([]), setError(''))} />
      )}

      {file && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Slider label="Çözünürlük" value={dpi} onChange={setDpi} min={72} max={300} step={6} suffix=" DPI" />
            <Field label="Görsel formatı">
              <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/jpeg">JPG — küçük dosya</option>
                <option value="image/png">PNG — kayıpsız</option>
                <option value="image/webp">WebP — modern</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={convert} disabled={busy}>
              {busy ? 'Dönüştürülüyor…' : 'Görsellere dönüştür'}
            </Button>
          </div>
          {busy && <ProgressBar value={progress} />}
        </>
      )}

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {pages.length > 0 && (
        <ResultPanel
          title={`${pages.length} sayfa`}
          actions={
            <Button onClick={downloadAll}>
              <Download className="h-4 w-4" /> Tümünü ZIP indir
            </Button>
          }
        >
          <div className="grid max-h-[520px] gap-3 overflow-y-auto sm:grid-cols-3">
            {pages.map((p) => (
              <div key={p.n} className="rounded-xl border border-[var(--border)] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Sayfa ${p.n}`} className="w-full rounded-lg" />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted">
                    Sayfa {p.n} · {formatBytes(p.blob.size)}
                  </span>
                  <button
                    onClick={() => saveBlob(p.blob, `sayfa-${p.n}.${format.split('/')[1]}`)}
                    className="font-semibold text-brand-500"
                  >
                    İndir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ PDF → Word ═══════════════════════════ */

export function PdfToWord() {
  const { file, setFile, busy, progress, setProgress, error, setError, run } = useConversion();
  const [result, setResult] = useState<{ blob: Blob; words: number; pages: number } | null>(null);

  const convert = () =>
    run(async () => {
      if (!file) throw new Error('Önce bir PDF seçin.');
      const doc = await openPdf(await file.arrayBuffer());
      const { Document, Packer, Paragraph, TextRun } = await import('docx');

      const paragraphs: InstanceType<typeof Paragraph>[] = [];
      let wordCount = 0;

      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const content = await page.getTextContent();

        // pdf.js emits positioned fragments; regroup them into visual lines.
        let line = '';
        for (const item of content.items) {
          if (!('str' in item)) continue;
          line += item.str;
          if (item.hasEOL) {
            if (line.trim()) {
              paragraphs.push(new Paragraph({ children: [new TextRun(line.trim())] }));
              wordCount += line.trim().split(/\s+/).length;
            }
            line = '';
          }
        }
        if (line.trim()) {
          paragraphs.push(new Paragraph({ children: [new TextRun(line.trim())] }));
          wordCount += line.trim().split(/\s+/).length;
        }
        if (n < doc.numPages) paragraphs.push(new Paragraph({ text: '', pageBreakBefore: true }));
        setProgress((n / doc.numPages) * 100);
      }

      if (wordCount === 0) {
        throw new Error(
          'Bu PDF’te seçilebilir metin bulunamadı. Belge taranmış bir görüntü olabilir; bu durumda önce OCR gerekir.',
        );
      }

      const blob = await Packer.toBlob(new Document({ sections: [{ children: paragraphs }] }));
      setResult({ blob, words: wordCount, pages: doc.numPages });
    });

  return (
    <ToolShell>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={(f) => (setFile(f[0]), setResult(null))} />
      ) : (
        <FileChip file={file} onRemove={() => (setFile(null), setResult(null), setError(''))} />
      )}

      {file && (
        <div className="mt-4">
          <Button onClick={convert} disabled={busy}>
            {busy ? 'Dönüştürülüyor…' : 'Word’e dönüştür'}
          </Button>
        </div>
      )}
      {busy && <ProgressBar value={progress} />}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <p className="mt-4 text-xs text-muted">
        Dönüştürme metin katmanı üzerinden yapılır: yazılar tam olarak düzenlenebilir biçimde
        aktarılır. Karmaşık sütun düzenleri, tablolar ve gömülü görseller aktarılmaz.
      </p>

      {result && (
        <ResultPanel
          title="DOCX hazır"
          actions={
            <Button onClick={() => saveBlob(result.blob, file!.name.replace(/\.pdf$/i, '') + '.docx')}>
              <Download className="h-4 w-4" /> Word dosyasını indir
            </Button>
          }
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Sayfa" value={String(result.pages)} />
            <Stat label="Kelime" value={result.words.toLocaleString('tr-TR')} />
            <Stat label="Boyut" value={formatBytes(result.blob.size)} />
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ Word → PDF ═══════════════════════════ */

interface DocxBlock {
  text: string;
  heading: number;
  bold: boolean;
}

export function WordToPdf() {
  const { file, setFile, busy, error, setError, run } = useConversion();
  const [out, setOut] = useState<Blob | null>(null);
  const [blocks, setBlocks] = useState(0);

  const convert = () =>
    run(async () => {
      if (!file) throw new Error('Önce bir DOCX dosyası seçin.');
      if (!/\.docx$/i.test(file.name)) {
        throw new Error('Yalnızca .docx desteklenir. Eski .doc dosyalarını önce Word’de kaydedin.');
      }

      const { unzipSync, strFromU8 } = await import('fflate');
      const zip = unzipSync(new Uint8Array(await file.arrayBuffer()));
      const xml = zip['word/document.xml'];
      if (!xml) throw new Error('Belge içeriği okunamadı. Dosya bozuk olabilir.');

      const parsed = parseDocx(strFromU8(xml));
      if (parsed.length === 0) throw new Error('Belgede metin bulunamadı.');
      setBlocks(parsed.length);

      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      const regular = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

      const [pw, ph] = [595.28, 841.89];
      const margin = 56;
      const maxWidth = pw - margin * 2;
      let page = pdf.addPage([pw, ph]);
      let y = ph - margin;

      for (const block of parsed) {
        const size = block.heading === 1 ? 20 : block.heading === 2 ? 16 : block.heading ? 14 : 11;
        const font = block.heading || block.bold ? bold : regular;
        const lineHeight = size * 1.5;

        for (const line of wrapText(block.text, font, size, maxWidth)) {
          if (y - lineHeight < margin) {
            page = pdf.addPage([pw, ph]);
            y = ph - margin;
          }
          page.drawText(line, { x: margin, y: y - size, size, font, color: rgb(0.05, 0.06, 0.12) });
          y -= lineHeight;
        }
        y -= block.heading ? size * 0.6 : size * 0.35;
      }

      const bytes = await pdf.save();
      setOut(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }));
    });

  return (
    <ToolShell>
      {!file ? (
        <Dropzone
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onFiles={(f) => (setFile(f[0]), setOut(null))}
          hint="Word .docx dosyası"
        />
      ) : (
        <FileChip file={file} onRemove={() => (setFile(null), setOut(null), setError(''))} />
      )}

      {file && (
        <div className="mt-4">
          <Button onClick={convert} disabled={busy}>
            {busy ? 'Dönüştürülüyor…' : 'PDF’e dönüştür'}
          </Button>
        </div>
      )}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <p className="mt-4 text-xs text-muted">
        Metin, başlıklar ve kalın yazı biçimi korunarak A4 sayfalara aktarılır. Gömülü görseller,
        tablolar ve özel yazı tipleri aktarılmaz.
      </p>

      {out && (
        <ResultPanel
          title="PDF hazır"
          actions={
            <Button onClick={() => saveBlob(out, file!.name.replace(/\.docx$/i, '') + '.pdf')}>
              <Download className="h-4 w-4" /> PDF’i indir
            </Button>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Paragraf" value={String(blocks)} />
            <Stat label="Boyut" value={formatBytes(out.size)} />
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/** Minimal OOXML reader: paragraph text, heading level and bold runs. */
function parseDocx(xml: string): DocxBlock[] {
  const blocks: DocxBlock[] = [];
  const paragraphs = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) ?? [];
  for (const p of paragraphs) {
    const text = (p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) ?? [])
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join('')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
    if (!text) continue;
    const styleId = /<w:pStyle w:val="([^"]+)"/.exec(p)?.[1] ?? '';
    const heading = Number(/^Heading(\d)$/.exec(styleId)?.[1] ?? 0);
    blocks.push({ text, heading, bold: /<w:b\/>|<w:b /.test(p) });
  }
  return blocks;
}

/** Greedy wrap using the embedded font's real glyph widths. */
function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number,
) {
  // pdf-lib's standard fonts are WinAnsi — swap characters they cannot encode.
  const safe = text.replace(/[^\x00-\xFF]/g, (ch) => TR_FALLBACK[ch] ?? '?');
  const words = safe.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

const TR_FALLBACK: Record<string, string> = {
  ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ş: 's', Ş: 'S', ' ': ' ', '’': "'", '‘': "'",
  '“': '"', '”': '"', '–': '-', '—': '-', '…': '...',
};

/* ═══════════════════════════ protect ═══════════════════════════ */

export function ProtectPdf() {
  const { file, setFile, busy, error, setError, run } = useConversion();
  const [userPass, setUserPass] = useState('');
  const [ownerPass, setOwnerPass] = useState('');
  const [perms, setPerms] = useState({ printing: true, copying: false, modifying: false });
  const [out, setOut] = useState<Blob | null>(null);

  const protect = () =>
    run(async () => {
      if (!file) throw new Error('Önce bir PDF seçin.');
      if (userPass.length < 4) throw new Error('Parola en az 4 karakter olmalıdır.');

      const { PDFDocument } = await import('@cantoo/pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });

      await doc.encrypt({
        userPassword: userPass,
        ownerPassword: ownerPass || userPass,
        permissions: {
          printing: perms.printing ? 'highResolution' : undefined,
          copying: perms.copying,
          modifying: perms.modifying,
          annotating: perms.modifying,
          fillingForms: perms.modifying,
          contentAccessibility: true,
          documentAssembly: perms.modifying,
        },
      });

      const bytes = await doc.save();
      setOut(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }));
    });

  return (
    <ToolShell>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={(f) => (setFile(f[0]), setOut(null))} />
      ) : (
        <FileChip file={file} onRemove={() => (setFile(null), setOut(null), setError(''))} />
      )}

      {file && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Açma parolası" hint="Belgeyi açmak için gerekir">
              <TextInput
                type="password"
                value={userPass}
                onChange={(e) => setUserPass(e.target.value)}
                placeholder="En az 4 karakter"
              />
            </Field>
            <Field label="Sahip parolası" hint="İzinleri değiştirmek için — boş bırakılabilir">
              <TextInput
                type="password"
                value={ownerPass}
                onChange={(e) => setOwnerPass(e.target.value)}
                placeholder="İsteğe bağlı"
              />
            </Field>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">İzinler</p>
            {(
              [
                ['printing', 'Yazdırmaya izin ver'],
                ['copying', 'Metin kopyalamaya izin ver'],
                ['modifying', 'Düzenlemeye izin ver'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={perms[key]}
                  onChange={(e) => setPerms({ ...perms, [key]: e.target.checked })}
                  className="h-4 w-4 accent-[#3163ff]"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="mt-4">
            <Button onClick={protect} disabled={busy}>
              {busy ? 'Şifreleniyor…' : 'PDF’i şifrele'}
            </Button>
          </div>
        </>
      )}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <p className="mt-4 text-xs text-muted">
        Şifreleme AES-256 ile tarayıcınızda yapılır; parolanız hiçbir sunucuya gönderilmez.
        Parolanızı kaybederseniz belge <strong>geri açılamaz</strong> — güvenli bir yerde saklayın.
      </p>

      {out && (
        <ResultPanel
          title="Şifrelenmiş PDF hazır"
          actions={
            <Button onClick={() => saveBlob(out, 'korumali-' + file!.name)}>
              <Download className="h-4 w-4" /> İndir
            </Button>
          }
        >
          <Stat label="Boyut" value={formatBytes(out.size)} />
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ unlock ═══════════════════════════ */

export function UnlockPdf() {
  const { file, setFile, busy, progress, setProgress, error, setError, run } = useConversion();
  const [password, setPassword] = useState('');
  const [out, setOut] = useState<Blob | null>(null);

  const unlock = () =>
    run(async () => {
      if (!file) throw new Error('Önce bir PDF seçin.');
      let doc;
      try {
        doc = await openPdf(await file.arrayBuffer(), password || undefined);
      } catch (e) {
        if (e instanceof PasswordRequiredError) {
          throw new Error(
            e.wrong
              ? 'Parola hatalı. Lütfen kontrol edip tekrar deneyin.'
              : 'Bu PDF parola korumalı. Açma parolasını girip tekrar deneyin.',
          );
        }
        throw e;
      }

      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();

      for (let n = 1; n <= doc.numPages; n++) {
        const canvas = await renderPage(doc, n, 2);
        const jpg = await canvasToBlob(canvas, 'image/jpeg', 0.9);
        const image = await pdf.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
        const page = pdf.addPage([image.width / 2, image.height / 2]);
        page.drawImage(image, { x: 0, y: 0, width: image.width / 2, height: image.height / 2 });
        setProgress((n / doc.numPages) * 100);
      }

      const bytes = await pdf.save();
      setOut(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }));
    });

  return (
    <ToolShell>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={(f) => (setFile(f[0]), setOut(null))} />
      ) : (
        <FileChip file={file} onRemove={() => (setFile(null), setOut(null), setError(''))} />
      )}

      {file && (
        <>
          <div className="mt-4">
            <Field label="Belge parolası" hint="Kısıtlama parolası varsa boş bırakın">
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Açma parolası"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={unlock} disabled={busy}>
              {busy ? 'İşleniyor…' : 'Kilidi kaldır'}
            </Button>
          </div>
          {busy && <ProgressBar value={progress} />}
        </>
      )}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="mt-4 rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
        <strong>Önemli:</strong> Bu araç parola kırmaz — belgeyi açmak için parolayı bilmeniz
        gerekir. Yalnızca sahibi olduğunuz veya erişim hakkınız olan belgelerde kullanın. Sayfalar
        görüntü olarak yeniden oluşturulduğu için çıktıdaki metin seçilemez.
      </div>

      {out && (
        <ResultPanel
          title="Kilitsiz PDF hazır"
          actions={
            <Button onClick={() => saveBlob(out, 'kilitsiz-' + file!.name)}>
              <Download className="h-4 w-4" /> İndir
            </Button>
          }
        >
          <Stat label="Boyut" value={formatBytes(out.size)} />
        </ResultPanel>
      )}
    </ToolShell>
  );
}
