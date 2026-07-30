'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
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

/** pdf-lib is ~350 KB — only pulled in when the user actually runs a PDF action. */
async function pdfLib() {
  return import('pdf-lib');
}

function DownloadResult({
  blob,
  filename,
  original,
  note,
}: {
  blob: Blob;
  filename: string;
  original?: number;
  note?: string;
}) {
  function download() {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  const diff = original ? Math.round((1 - blob.size / original) * 100) : null;

  return (
    <ResultPanel title="Hazır" actions={<Button onClick={download}>PDF’i indir</Button>}>
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="Dosya" value={filename} />
        <Stat label="Boyut" value={formatBytes(blob.size)} />
        {diff !== null && (
          <Stat label="Değişim" value={diff > 0 ? `%${diff} küçüldü` : `%${Math.abs(diff)} büyüdü`} />
        )}
      </div>
      {note && <p className="mt-3 text-xs text-muted">{note}</p>}
    </ResultPanel>
  );
}

function useBusy() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(
        (e as Error).message.includes('encrypted')
          ? 'Bu PDF parola korumalı. Önce “PDF Kilidini Aç” aracını kullanın.'
          : `İşlem tamamlanamadı: ${(e as Error).message}`,
      );
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, setError, run };
}

/* ═══════════════════════════ merge ═══════════════════════════ */

export function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [out, setOut] = useState<Blob | null>(null);
  const { busy, error, setError, run } = useBusy();

  function add(list: File[]) {
    const pdfs = list.filter((f) => f.type === 'application/pdf');
    if (pdfs.length !== list.length) setError('PDF olmayan dosyalar atlandı.');
    setFiles((prev) => [...prev, ...pdfs]);
    setOut(null);
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...files];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setFiles(next);
  }

  const merge = () =>
    run(async () => {
      if (files.length < 2) throw new Error('En az iki PDF dosyası seçmelisiniz.');
      const { PDFDocument } = await pdfLib();
      const merged = await PDFDocument.create();
      for (const file of files) {
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      setOut(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }));
    });

  return (
    <ToolShell>
      <Dropzone accept="application/pdf" multiple onFiles={add} hint="Birden fazla PDF seçebilirsiniz" />
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <FileChip
              key={`${f.name}-${i}`}
              file={f}
              onRemove={() => setFiles(files.filter((_, x) => x !== i))}
              extra={
                <span className="flex shrink-0 gap-1">
                  <button onClick={() => move(i, -1)} aria-label="Yukarı taşı" className="text-muted hover:text-brand-500">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(i, 1)} aria-label="Aşağı taşı" className="text-muted hover:text-brand-500">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </span>
              }
            />
          ))}
        </div>
      )}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      <div className="mt-4">
        <Button onClick={merge} disabled={busy || files.length < 2}>
          {busy ? 'Birleştiriliyor…' : `${files.length || ''} PDF’i birleştir`}
        </Button>
      </div>
      {out && <DownloadResult blob={out} filename="birlesik.pdf" />}
    </ToolShell>
  );
}

/* ═══════════════════════════ split ═══════════════════════════ */

export function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState('1-1');
  const [out, setOut] = useState<Blob | null>(null);
  const { busy, error, setError, run } = useBusy();

  function pick(list: File[]) {
    const f = list[0];
    if (!f) return;
    setFile(f);
    setOut(null);
    run(async () => {
      const { PDFDocument } = await pdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer());
      setPageCount(doc.getPageCount());
      setRange(`1-${doc.getPageCount()}`);
    });
  }

  const split = () =>
    run(async () => {
      if (!file) throw new Error('Önce bir PDF seçin.');
      const indices = parseRange(range, pageCount);
      if (indices.length === 0) throw new Error('Geçerli bir sayfa aralığı girin (örn. 1-3, 5, 8-10).');
      const { PDFDocument } = await pdfLib();
      const src = await PDFDocument.load(await file.arrayBuffer());
      const target = await PDFDocument.create();
      const pages = await target.copyPages(src, indices);
      pages.forEach((p) => target.addPage(p));
      const bytes = await target.save();
      setOut(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }));
    });

  return (
    <ToolShell>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={pick} hint="Tek PDF dosyası" />
      ) : (
        <FileChip
          file={file}
          onRemove={() => {
            setFile(null);
            setOut(null);
            setError('');
          }}
          extra={pageCount ? <span className="shrink-0 text-xs text-muted">{pageCount} sayfa</span> : null}
        />
      )}
      {file && (
        <div className="mt-4">
          <Field label="Sayfa aralığı" hint={pageCount ? `1 – ${pageCount}` : ''}>
            <TextInput
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="örn. 1-3, 5, 8-10"
            />
          </Field>
        </div>
      )}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      <div className="mt-4">
        <Button onClick={split} disabled={busy || !file}>
          {busy ? 'İşleniyor…' : 'Sayfaları ayır'}
        </Button>
      </div>
      {out && <DownloadResult blob={out} filename="bolunmus.pdf" original={file?.size} />}
    </ToolShell>
  );
}

/** "1-3, 5, 8-10" → zero-based page indices, clamped to the document. */
function parseRange(input: string, max: number): number[] {
  const out = new Set<number>();
  for (const part of input.split(',')) {
    const seg = part.trim();
    if (!seg) continue;
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(seg);
    if (m) {
      const [from, to] = [Number(m[1]), Number(m[2])].sort((a, b) => a - b);
      for (let i = from; i <= to; i++) if (i >= 1 && i <= max) out.add(i - 1);
    } else if (/^\d+$/.test(seg)) {
      const n = Number(seg);
      if (n >= 1 && n <= max) out.add(n - 1);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/* ═══════════════════════════ rotate ═══════════════════════════ */

export function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState(90);
  const [scope, setScope] = useState('all');
  const [out, setOut] = useState<Blob | null>(null);
  const { busy, error, setError, run } = useBusy();

  const rotate = () =>
    run(async () => {
      if (!file) throw new Error('Önce bir PDF seçin.');
      const { PDFDocument, degrees } = await pdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer());
      doc.getPages().forEach((page, i) => {
        const isEven = (i + 1) % 2 === 0;
        if (scope === 'even' && !isEven) return;
        if (scope === 'odd' && isEven) return;
        page.setRotation(degrees((page.getRotation().angle + angle) % 360));
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Döndürme açısı">
            <Select value={angle} onChange={(e) => setAngle(Number(e.target.value))}>
              <option value={90}>90° sağa</option>
              <option value={180}>180°</option>
              <option value={270}>90° sola</option>
            </Select>
          </Field>
          <Field label="Uygulanacak sayfalar">
            <Select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">Tüm sayfalar</option>
              <option value="odd">Tek sayfalar</option>
              <option value="even">Çift sayfalar</option>
            </Select>
          </Field>
        </div>
      )}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      <div className="mt-4">
        <Button onClick={rotate} disabled={busy || !file}>
          {busy ? 'Döndürülüyor…' : 'Döndür'}
        </Button>
      </div>
      {out && <DownloadResult blob={out} filename="dondurulmus.pdf" original={file?.size} />}
    </ToolShell>
  );
}

/* ═══════════════════════════ compress ═══════════════════════════ */

export function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [out, setOut] = useState<Blob | null>(null);
  const { busy, error, setError, run } = useBusy();

  const compress = () =>
    run(async () => {
      if (!file) throw new Error('Önce bir PDF seçin.');
      const { PDFDocument } = await pdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer());
      // Drop metadata and re-serialise with object streams — lossless, so page
      // content stays pixel-identical.
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setProducer('');
      doc.setCreator('');
      const bytes = await doc.save({ useObjectStreams: true });
      setOut(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }));
    });

  return (
    <ToolShell>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={(f) => (setFile(f[0]), setOut(null))} />
      ) : (
        <FileChip file={file} onRemove={() => (setFile(null), setOut(null), setError(''))} />
      )}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      <div className="mt-4">
        <Button onClick={compress} disabled={busy || !file}>
          {busy ? 'Sıkıştırılıyor…' : 'Sıkıştır'}
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted">
        Bu araç kayıpsız optimizasyon yapar: yapı yeniden yazılır, gereksiz nesneler ve meta veriler
        temizlenir. Sayfa görüntüsü hiç değişmez. Ağırlıklı olarak yüksek çözünürlüklü taramalardan
        oluşan dosyalarda kazanç sınırlı olabilir — bu durumda görselleri önce{' '}
        <strong>Görsel Sıkıştırıcı</strong> ile küçültmek daha etkilidir.
      </p>
      {out && (
        <DownloadResult
          blob={out}
          filename="sikistirilmis.pdf"
          original={file?.size}
          note="Sıkıştırma kayıpsızdır; içerik kalitesi korunur."
        />
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ jpg → pdf ═══════════════════════════ */

export function JpgToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState('fit');
  const [margin, setMargin] = useState(0);
  const [out, setOut] = useState<Blob | null>(null);
  const { busy, error, setError, run } = useBusy();

  function add(list: File[]) {
    const images = list.filter((f) => /image\/(jpeg|png)/.test(f.type));
    if (images.length !== list.length) setError('Yalnızca JPG ve PNG dosyaları eklenebilir.');
    setFiles((prev) => [...prev, ...images]);
    setOut(null);
  }

  const convert = () =>
    run(async () => {
      if (files.length === 0) throw new Error('En az bir görsel ekleyin.');
      const { PDFDocument } = await pdfLib();
      const doc = await PDFDocument.create();

      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const image =
          file.type === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

        if (pageSize === 'a4') {
          const [pw, ph] = [595.28, 841.89];
          const page = doc.addPage([pw, ph]);
          const usableW = pw - margin * 2;
          const usableH = ph - margin * 2;
          const scale = Math.min(usableW / image.width, usableH / image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
        } else {
          const page = doc.addPage([image.width + margin * 2, image.height + margin * 2]);
          page.drawImage(image, {
            x: margin,
            y: margin,
            width: image.width,
            height: image.height,
          });
        }
      }
      const bytes = await doc.save();
      setOut(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }));
    });

  return (
    <ToolShell>
      <Dropzone accept="image/jpeg,image/png" multiple onFiles={add} hint="JPG veya PNG — sırayla eklenir" />
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <FileChip
              key={`${f.name}-${i}`}
              file={f}
              onRemove={() => setFiles(files.filter((_, x) => x !== i))}
              extra={<span className="shrink-0 text-xs text-muted">Sayfa {i + 1}</span>}
            />
          ))}
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Sayfa boyutu">
          <Select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
            <option value="fit">Görsele uydur</option>
            <option value="a4">A4 (dikey)</option>
          </Select>
        </Field>
        <Slider label="Kenar boşluğu" value={margin} onChange={setMargin} min={0} max={72} suffix=" pt" />
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      <div className="mt-4">
        <Button onClick={convert} disabled={busy || files.length === 0}>
          {busy ? 'Dönüştürülüyor…' : 'PDF oluştur'}
        </Button>
      </div>
      {out && <DownloadResult blob={out} filename="gorseller.pdf" />}
    </ToolShell>
  );
}
