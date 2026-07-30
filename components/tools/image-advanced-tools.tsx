'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Camera, Download, ImageOff } from 'lucide-react';
import {
  Button,
  CopyButton,
  Dropzone,
  ErrorNote,
  Field,
  FileChip,
  ResultPanel,
  Select,
  Slider,
  Stat,
  ToolShell,
  formatBytes,
} from './shared';

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Görsel yüklenemedi.'));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Görsel üretilemedi.'))), type, quality),
  );
}

/* ═══════════════════════ background remover ═══════════════════════ */

export function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState('');
  const [tolerance, setTolerance] = useState(32);
  const [feather, setFeather] = useState(2);
  const [out, setOut] = useState<Blob | null>(null);
  const [outUrl, setOutUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [removed, setRemoved] = useState(0);

  function pick(files: File[]) {
    const f = files[0];
    if (!f?.type.startsWith('image/')) {
      setError('Lütfen bir görsel dosyası seçin.');
      return;
    }
    setError('');
    setFile(f);
    setSrc(URL.createObjectURL(f));
    setOut(null);
  }

  async function remove() {
    if (!src) return;
    setBusy(true);
    setError('');
    try {
      const img = await loadImage(src);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Tarayıcınız canvas desteklemiyor.');
      ctx.drawImage(img, 0, 0);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const cleared = floodFillBackground(data, tolerance, feather);
      if (cleared === 0) {
        throw new Error(
          'Kenarlardan başlayan düz bir arka plan bulunamadı. Toleransı artırmayı deneyin.',
        );
      }
      ctx.putImageData(data, 0, 0);

      const blob = await toBlob(canvas, 'image/png');
      setOut(blob);
      setOutUrl(URL.createObjectURL(blob));
      setRemoved(Math.round((cleared / (canvas.width * canvas.height)) * 100));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell>
      {!file ? (
        <Dropzone accept="image/*" onFiles={pick} hint="Düz renkli arka plana sahip görseller için" />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="max-h-64 w-full rounded-xl object-contain" />
          <div className="mt-3">
            <FileChip file={file} onRemove={() => (setFile(null), setOut(null), setError(''))} />
          </div>
        </>
      )}

      {file && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Slider
              label="Renk toleransı"
              value={tolerance}
              onChange={setTolerance}
              min={4}
              max={120}
            />
            <Slider label="Kenar yumuşatma" value={feather} onChange={setFeather} min={0} max={6} suffix=" px" />
          </div>
          <div className="mt-4">
            <Button onClick={remove} disabled={busy}>
              {busy ? 'İşleniyor…' : 'Arka planı sil'}
            </Button>
          </div>
        </>
      )}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Bu araç, kenarlardan başlayarak <strong>düz ve tek renkli arka planları</strong> saydam hale
        getirir (ürün fotoğrafları, logolar, beyaz fonda çekilmiş görseller için idealdir). Karmaşık
        doğal sahnelerde — örneğin kalabalık bir sokak fotoğrafında — beklediğiniz sonucu vermez.
        Tümüyle tarayıcınızda çalışır, görseliniz yüklenmez.
      </p>

      {out && (
        <ResultPanel
          title="Saydam PNG hazır"
          actions={<Button onClick={() => saveBlob(out, 'arka-plansiz.png')}>
            <Download className="h-4 w-4" /> PNG indir
          </Button>}
        >
          <div
            className="rounded-xl p-3"
            style={{
              backgroundImage:
                'linear-gradient(45deg,#8883 25%,transparent 25%),linear-gradient(-45deg,#8883 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#8883 75%),linear-gradient(-45deg,transparent 75%,#8883 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={outUrl} alt="Arka planı silinmiş görsel" className="max-h-80 w-full object-contain" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Stat label="Saydamlaşan alan" value={`%${removed}`} />
            <Stat label="Boyut" value={formatBytes(out.size)} />
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/**
 * Scanline flood fill seeded from every border pixel. Returns how many pixels
 * were made transparent so the UI can tell the user whether it actually worked.
 */
function floodFillBackground(image: ImageData, tolerance: number, feather: number) {
  const { data, width, height } = image;
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];
  const tol = tolerance * tolerance * 3;

  const seedAt = (x: number, y: number) => stack.push(y * width + x);
  for (let x = 0; x < width; x++) {
    seedAt(x, 0);
    seedAt(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seedAt(0, y);
    seedAt(width - 1, y);
  }

  // Reference colour = average of the four corners.
  let rr = 0;
  let gg = 0;
  let bb = 0;
  for (const [x, y] of [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]) {
    const i = (y * width + x) * 4;
    rr += data[i];
    gg += data[i + 1];
    bb += data[i + 2];
  }
  rr /= 4;
  gg /= 4;
  bb /= 4;

  const matches = (idx: number) => {
    const i = idx * 4;
    const dr = data[i] - rr;
    const dg = data[i + 1] - gg;
    const db = data[i + 2] - bb;
    return dr * dr + dg * dg + db * db <= tol;
  };

  let cleared = 0;
  while (stack.length) {
    const idx = stack.pop()!;
    if (visited[idx]) continue;
    visited[idx] = 1;
    if (!matches(idx)) continue;

    data[idx * 4 + 3] = 0;
    cleared++;

    const x = idx % width;
    const y = (idx - x) / width;
    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  if (feather > 0) softenEdges(image, visited, feather);
  return cleared;
}

/** Fades alpha on pixels that sit next to a cleared region. */
function softenEdges(image: ImageData, visited: Uint8Array, radius: number) {
  const { data, width, height } = image;
  const original = new Uint8Array(data.length / 4);
  for (let i = 0; i < original.length; i++) original[i] = data[i * 4 + 3];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (original[idx] === 0) continue;
      let transparentNeighbours = 0;
      let total = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          total++;
          if (original[ny * width + nx] === 0) transparentNeighbours++;
        }
      }
      if (transparentNeighbours > 0) {
        data[idx * 4 + 3] = Math.round(255 * (1 - transparentNeighbours / total));
      }
      void visited;
    }
  }
}

/* ═══════════════════════════ upscaler ═══════════════════════════ */

export function ImageUpscaler() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState('');
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [factor, setFactor] = useState(2);
  const [sharpen, setSharpen] = useState(35);
  const [out, setOut] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick(files: File[]) {
    const f = files[0];
    if (!f?.type.startsWith('image/')) {
      setError('Lütfen bir görsel dosyası seçin.');
      return;
    }
    setError('');
    setFile(f);
    const url = URL.createObjectURL(f);
    setSrc(url);
    setOut(null);
    const img = await loadImage(url);
    setDims({ w: img.naturalWidth, h: img.naturalHeight });
  }

  async function upscale() {
    if (!src) return;
    setBusy(true);
    setError('');
    try {
      const img = await loadImage(src);
      const targetW = Math.round(img.naturalWidth * factor);
      const targetH = Math.round(img.naturalHeight * factor);
      if (targetW * targetH > 40_000_000) {
        throw new Error('Hedef çözünürlük çok büyük. Daha düşük bir kat seçin.');
      }

      // Step up in 2× increments — repeated halving-free interpolation keeps
      // far more detail than a single large jump.
      let current = document.createElement('canvas');
      current.width = img.naturalWidth;
      current.height = img.naturalHeight;
      current.getContext('2d')!.drawImage(img, 0, 0);

      while (current.width < targetW) {
        const next = document.createElement('canvas');
        next.width = Math.min(current.width * 2, targetW);
        next.height = Math.min(current.height * 2, targetH);
        const ctx = next.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(current, 0, 0, next.width, next.height);
        current = next;
      }

      if (sharpen > 0) applyUnsharpMask(current, sharpen / 100);
      setOut(await toBlob(current, 'image/png'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell>
      {!file ? (
        <Dropzone accept="image/*" onFiles={pick} />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="max-h-64 w-full rounded-xl object-contain" />
          <div className="mt-3">
            <FileChip
              file={file}
              onRemove={() => (setFile(null), setOut(null), setError(''))}
              extra={<span className="shrink-0 text-xs text-muted">{dims.w} × {dims.h}</span>}
            />
          </div>
        </>
      )}

      {file && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Büyütme oranı" hint={`Hedef: ${Math.round(dims.w * factor)} × ${Math.round(dims.h * factor)}`}>
              <Select value={factor} onChange={(e) => setFactor(Number(e.target.value))}>
                <option value={2}>2× </option>
                <option value={3}>3×</option>
                <option value={4}>4×</option>
              </Select>
            </Field>
            <Slider label="Netleştirme" value={sharpen} onChange={setSharpen} min={0} max={100} suffix="%" />
          </div>
          <div className="mt-4">
            <Button onClick={upscale} disabled={busy}>
              {busy ? 'Büyütülüyor…' : 'Görseli büyüt'}
            </Button>
          </div>
        </>
      )}
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Büyütme, kademeli yüksek kaliteli yeniden örnekleme ve ardından unsharp mask netleştirme ile
        yapılır. Bu yöntem kayıp detayı <em>yeniden üretmez</em> — var olan detayı mümkün olan en
        temiz şekilde ölçekler. Baskı için çözünürlük artırmakta ve küçük logoları büyütmekte iyi
        sonuç verir.
      </p>

      {out && (
        <ResultPanel
          title="Büyütülmüş görsel"
          actions={<Button onClick={() => saveBlob(out, `buyutulmus-${factor}x.png`)}>
            <Download className="h-4 w-4" /> PNG indir
          </Button>}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Önce" value={`${dims.w} × ${dims.h}`} />
            <Stat label="Sonra" value={`${Math.round(dims.w * factor)} × ${Math.round(dims.h * factor)}`} />
            <Stat label="Boyut" value={formatBytes(out.size)} />
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/** Classic unsharp mask: original + amount × (original − blurred). */
function applyUnsharpMask(canvas: HTMLCanvasElement, amount: number) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const { width, height } = canvas;
  const sharp = ctx.getImageData(0, 0, width, height);

  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = width;
  blurCanvas.height = height;
  const blurCtx = blurCanvas.getContext('2d', { willReadFrequently: true })!;
  blurCtx.filter = 'blur(1.2px)';
  blurCtx.drawImage(canvas, 0, 0);
  const blurred = blurCtx.getImageData(0, 0, width, height);

  for (let i = 0; i < sharp.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const value = sharp.data[i + c] + amount * (sharp.data[i + c] - blurred.data[i + c]);
      sharp.data[i + c] = value < 0 ? 0 : value > 255 ? 255 : value;
    }
  }
  ctx.putImageData(sharp, 0, 0);
}

/* ═══════════════════════════ GIF maker ═══════════════════════════ */

export function GifMaker() {
  const [files, setFiles] = useState<File[]>([]);
  const [delay, setDelay] = useState(400);
  const [width, setWidth] = useState(480);
  const [out, setOut] = useState<Blob | null>(null);
  const [outUrl, setOutUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  function add(list: File[]) {
    const images = list.filter((f) => f.type.startsWith('image/'));
    if (images.length !== list.length) setError('Görsel olmayan dosyalar atlandı.');
    setFiles((prev) => [...prev, ...images]);
    setOut(null);
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...files];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setFiles(next);
  }

  async function build() {
    if (files.length < 2) {
      setError('GIF oluşturmak için en az iki görsel ekleyin.');
      return;
    }
    setBusy(true);
    setError('');
    setProgress(0);
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const first = await loadImage(URL.createObjectURL(files[0]));
      const height = Math.round((first.naturalHeight / first.naturalWidth) * width);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const encoder = GIFEncoder();

      for (let i = 0; i < files.length; i++) {
        const url = URL.createObjectURL(files[i]);
        const img = await loadImage(url);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        // Letterbox so mixed aspect ratios do not stretch.
        const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
        URL.revokeObjectURL(url);

        const { data } = ctx.getImageData(0, 0, width, height);
        const palette = quantize(data, 256);
        encoder.writeFrame(applyPalette(data, palette), width, height, { palette, delay });
        setProgress(((i + 1) / files.length) * 100);
      }

      encoder.finish();
      const blob = new Blob([encoder.bytesView() as unknown as BlobPart], { type: 'image/gif' });
      setOut(blob);
      setOutUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError((e as Error).message || 'GIF oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell>
      <Dropzone accept="image/*" multiple onFiles={add} hint="Kareler sırayla eklenir" />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <FileChip
              key={`${f.name}-${i}`}
              file={f}
              onRemove={() => setFiles(files.filter((_, x) => x !== i))}
              extra={
                <span className="flex shrink-0 items-center gap-1">
                  <span className="text-xs text-muted">Kare {i + 1}</span>
                  <button onClick={() => move(i, -1)} aria-label="Yukarı" className="text-muted hover:text-brand-500">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(i, 1)} aria-label="Aşağı" className="text-muted hover:text-brand-500">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </span>
              }
            />
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Slider label="Kare süresi" value={delay} onChange={setDelay} min={50} max={2000} step={50} suffix=" ms" />
        <Slider label="Genişlik" value={width} onChange={setWidth} min={160} max={800} step={20} suffix=" px" />
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="mt-4">
        <Button onClick={build} disabled={busy || files.length < 2}>
          {busy ? `Oluşturuluyor… %${Math.round(progress)}` : 'GIF oluştur'}
        </Button>
      </div>

      {out && (
        <ResultPanel
          title="GIF hazır"
          actions={<Button onClick={() => saveBlob(out, 'animasyon.gif')}>
            <Download className="h-4 w-4" /> GIF indir
          </Button>}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={outUrl} alt="Oluşturulan GIF" className="mx-auto max-h-80 rounded-xl" />
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Stat label="Kare" value={String(files.length)} />
            <Stat label="Süre" value={`${((files.length * delay) / 1000).toFixed(1)} sn`} />
            <Stat label="Boyut" value={formatBytes(out.size)} />
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ QR scanner ═══════════════════════════ */

export function QrScanner() {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);

  useEffect(() => () => stop(), []);

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startCamera() {
    setError('');
    setResult('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setScanning(true);
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const jsQR = (await import('jsqr')).default;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const code = jsQR(
            ctx.getImageData(0, 0, canvas.width, canvas.height).data,
            canvas.width,
            canvas.height,
          );
          if (code?.data) {
            setResult(code.data);
            stop();
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError(
        'Kameraya erişilemedi. Tarayıcı izinlerini kontrol edin veya aşağıdan görsel yükleyerek okutun.',
      );
      setScanning(false);
    }
  }

  async function scanFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError('');
    setResult('');
    try {
      const img = await loadImage(URL.createObjectURL(f));
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(
        ctx.getImageData(0, 0, canvas.width, canvas.height).data,
        canvas.width,
        canvas.height,
      );
      if (!code?.data) {
        setError('Görselde okunabilir bir QR kod bulunamadı. Daha net bir fotoğraf deneyin.');
        return;
      }
      setResult(code.data);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const isUrl = /^https?:\/\//i.test(result);

  return (
    <ToolShell>
      <div className="flex flex-wrap gap-2">
        <Button onClick={scanning ? stop : startCamera}>
          <Camera className="h-4 w-4" />
          {scanning ? 'Kamerayı durdur' : 'Kamerayla tara'}
        </Button>
      </div>

      {scanning && (
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
          <video ref={videoRef} playsInline muted className="w-full" />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="h-48 w-48 rounded-2xl border-4 border-brand-500/80" />
          </div>
        </div>
      )}

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">
        veya görselden okut
      </p>
      <div className="mt-2">
        <Dropzone accept="image/*" onFiles={scanFile} hint="QR kod içeren ekran görüntüsü ya da fotoğraf" />
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {result ? (
        <ResultPanel title="Okunan içerik" actions={<CopyButton value={result} />}>
          <p className="break-all font-mono text-sm">{result}</p>
          {isUrl && (
            <a
              href={result}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-3 inline-block text-sm font-semibold text-brand-500"
            >
              Bağlantıyı aç →
            </a>
          )}
        </ResultPanel>
      ) : (
        !scanning && (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted">
            <ImageOff className="h-4 w-4" />
            Kod okuma tamamen cihazınızda yapılır; görsel hiçbir yere yüklenmez.
          </p>
        )
      )}
    </ToolShell>
  );
}
