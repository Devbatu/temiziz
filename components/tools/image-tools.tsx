'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

/* ────────────────────────── shared image helpers ────────────────────────── */

interface Loaded {
  file: File;
  url: string;
  width: number;
  height: number;
}

function useImageFile() {
  const [img, setImg] = useState<Loaded | null>(null);
  const [error, setError] = useState('');

  function load(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir görsel dosyası seçin (JPG, PNG, WebP…).');
      return;
    }
    setError('');
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => setImg({ file, url, width: el.naturalWidth, height: el.naturalHeight });
    el.onerror = () => setError('Görsel okunamadı. Dosya bozuk olabilir.');
    el.src = url;
  }

  function reset() {
    if (img) URL.revokeObjectURL(img.url);
    setImg(null);
    setError('');
  }

  return { img, error, setError, load, reset };
}

/** Draws the source image into a canvas and returns a blob of the requested type. */
async function renderToBlob(
  src: string,
  draw: (ctx: CanvasRenderingContext2D, img: HTMLImageElement, canvas: HTMLCanvasElement) => void,
  type: string,
  quality?: number,
): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tarayıcınız canvas desteklemiyor.');
  draw(ctx, img, canvas);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Görsel oluşturulamadı.'))),
      type,
      quality,
    ),
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Görsel yüklenemedi.'));
    img.src = src;
  });
}

function OutputPreview({
  blob,
  filename,
  original,
}: {
  blob: Blob;
  filename: string;
  original?: number;
}) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const saved = original ? Math.round((1 - blob.size / original) * 100) : null;

  return (
    <ResultPanel
      title="Sonuç"
      actions={
        <Button
          onClick={() => {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
          }}
        >
          İndir
        </Button>
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="İşlenmiş görsel"
        className="max-h-80 w-full rounded-xl object-contain"
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Stat label="Yeni boyut" value={formatBytes(blob.size)} />
        {original !== undefined && <Stat label="Önceki boyut" value={formatBytes(original)} />}
        {saved !== null && (
          <Stat label="Kazanç" value={saved > 0 ? `%${saved} küçüldü` : `%${-saved} büyüdü`} />
        )}
      </div>
    </ResultPanel>
  );
}

function Uploader({
  img,
  load,
  reset,
  hint,
}: {
  img: Loaded | null;
  load: (f: File[]) => void;
  reset: () => void;
  hint?: string;
}) {
  if (!img) return <Dropzone accept="image/*" onFiles={load} hint={hint ?? 'JPG, PNG, WebP, GIF'} />;
  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.url} alt="" className="max-h-64 w-full rounded-xl object-contain" />
      <FileChip
        file={img.file}
        onRemove={reset}
        extra={
          <span className="shrink-0 text-xs text-muted">
            {img.width} × {img.height}
          </span>
        }
      />
    </div>
  );
}

/* ═══════════════════════════ compressor ═══════════════════════════ */

export function ImageCompressor() {
  const { img, error, setError, load, reset } = useImageFile();
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState('image/jpeg');
  const [out, setOut] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  async function compress() {
    if (!img) return;
    setBusy(true);
    try {
      const blob = await renderToBlob(
        img.url,
        (ctx, image, canvas) => {
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          if (format === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(image, 0, 0);
        },
        format,
        quality / 100,
      );
      setOut(blob);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell>
      <Uploader img={img} load={load} reset={reset} />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {img && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Slider label="Kalite" value={quality} onChange={setQuality} min={10} max={100} suffix="%" />
            <Field label="Çıktı formatı">
              <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/jpeg">JPEG — en küçük dosya</option>
                <option value="image/webp">WebP — modern, dengeli</option>
                <option value="image/png">PNG — kayıpsız</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={compress} disabled={busy}>
              {busy ? 'Sıkıştırılıyor…' : 'Sıkıştır'}
            </Button>
          </div>
        </>
      )}
      {out && (
        <OutputPreview
          blob={out}
          original={img?.file.size}
          filename={`compressed.${format.split('/')[1]}`}
        />
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ resizer ═══════════════════════════ */

export function ImageResizer() {
  const { img, error, setError, load, reset } = useImageFile();
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [lock, setLock] = useState(true);
  const [out, setOut] = useState<Blob | null>(null);

  useEffect(() => {
    if (img) {
      setW(img.width);
      setH(img.height);
      setOut(null);
    }
  }, [img]);

  const ratio = img ? img.width / img.height : 1;

  async function resize() {
    if (!img || w < 1 || h < 1) return;
    try {
      setOut(
        await renderToBlob(
          img.url,
          (ctx, image, canvas) => {
            canvas.width = w;
            canvas.height = h;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(image, 0, 0, w, h);
          },
          img.file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          0.92,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <ToolShell>
      <Uploader img={img} load={load} reset={reset} />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {img && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Genişlik (px)">
              <TextInput
                type="number"
                value={w}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setW(v);
                  if (lock) setH(Math.round(v / ratio));
                }}
              />
            </Field>
            <Field label="Yükseklik (px)">
              <TextInput
                type="number"
                value={h}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setH(v);
                  if (lock) setW(Math.round(v * ratio));
                }}
              />
            </Field>
          </div>
          <label className="mt-3 flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={lock}
              onChange={(e) => setLock(e.target.checked)}
              className="h-4 w-4 accent-[#3163ff]"
            />
            En-boy oranını koru
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {[25, 50, 75].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setW(Math.round((img.width * p) / 100));
                  setH(Math.round((img.height * p) / 100));
                }}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-muted hover:border-brand-400 hover:text-brand-500"
              >
                %{p}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={resize}>Boyutlandır</Button>
          </div>
        </>
      )}
      {out && <OutputPreview blob={out} original={img?.file.size} filename={`resized-${w}x${h}.jpg`} />}
    </ToolShell>
  );
}

/* ═══════════════════════════ converter ═══════════════════════════ */

export function ImageConverter() {
  const { img, error, setError, load, reset } = useImageFile();
  const [format, setFormat] = useState('image/webp');
  const [out, setOut] = useState<Blob | null>(null);

  async function convert() {
    if (!img) return;
    try {
      setOut(
        await renderToBlob(
          img.url,
          (ctx, image, canvas) => {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            if (format === 'image/jpeg') {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(image, 0, 0);
          },
          format,
          0.92,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <ToolShell>
      <Uploader img={img} load={load} reset={reset} />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {img && (
        <>
          <div className="mt-5">
            <Field label="Hedef format" hint={`Kaynak: ${img.file.type.split('/')[1].toUpperCase()}`}>
              <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/webp">WebP</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={convert}>Dönüştür</Button>
          </div>
        </>
      )}
      {out && (
        <OutputPreview
          blob={out}
          original={img?.file.size}
          filename={`converted.${format.split('/')[1]}`}
        />
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ crop ═══════════════════════════ */

const RATIOS: Array<[string, number | null]> = [
  ['Serbest', null],
  ['1:1', 1],
  ['4:3', 4 / 3],
  ['16:9', 16 / 9],
  ['3:4', 3 / 4],
  ['9:16', 9 / 16],
];

export function CropImage() {
  const { img, error, setError, load, reset } = useImageFile();
  const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [ratio, setRatio] = useState<number | null>(null);
  const [out, setOut] = useState<Blob | null>(null);

  useEffect(() => {
    if (img) {
      const side = Math.min(img.width, img.height);
      setRect({
        x: Math.round((img.width - side) / 2),
        y: Math.round((img.height - side) / 2),
        w: side,
        h: side,
      });
      setOut(null);
    }
  }, [img]);

  function update(patch: Partial<typeof rect>) {
    const next = { ...rect, ...patch };
    if (ratio && (patch.w !== undefined || patch.h !== undefined)) {
      if (patch.w !== undefined) next.h = Math.round(next.w / ratio);
      else next.w = Math.round(next.h * ratio);
    }
    setRect(next);
  }

  async function crop() {
    if (!img) return;
    if (rect.w < 1 || rect.h < 1) {
      setError('Kırpma alanı geçersiz.');
      return;
    }
    try {
      setOut(
        await renderToBlob(
          img.url,
          (ctx, image, canvas) => {
            canvas.width = rect.w;
            canvas.height = rect.h;
            ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
          },
          'image/png',
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <ToolShell>
      <Uploader img={img} load={load} reset={reset} />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {img && (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {RATIOS.map(([label, r]) => (
              <button
                key={label}
                onClick={() => {
                  setRatio(r);
                  if (r) update({ w: rect.w, h: Math.round(rect.w / r) });
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  ratio === r ? 'bg-brand-600 text-white' : 'border border-[var(--border)] text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Field label="X">
              <TextInput type="number" value={rect.x} onChange={(e) => update({ x: Number(e.target.value) })} />
            </Field>
            <Field label="Y">
              <TextInput type="number" value={rect.y} onChange={(e) => update({ y: Number(e.target.value) })} />
            </Field>
            <Field label="Genişlik">
              <TextInput type="number" value={rect.w} onChange={(e) => update({ w: Number(e.target.value) })} />
            </Field>
            <Field label="Yükseklik">
              <TextInput type="number" value={rect.h} onChange={(e) => update({ h: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={crop}>Kırp</Button>
          </div>
        </>
      )}
      {out && <OutputPreview blob={out} filename="cropped.png" />}
    </ToolShell>
  );
}

/* ═══════════════════════════ blur ═══════════════════════════ */

export function BlurImage() {
  const { img, error, setError, load, reset } = useImageFile();
  const [amount, setAmount] = useState(8);
  const [out, setOut] = useState<Blob | null>(null);

  async function apply() {
    if (!img) return;
    try {
      setOut(
        await renderToBlob(
          img.url,
          (ctx, image, canvas) => {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            ctx.filter = `blur(${amount}px)`;
            ctx.drawImage(image, 0, 0);
          },
          'image/jpeg',
          0.92,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <ToolShell>
      <Uploader img={img} load={load} reset={reset} />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {img && (
        <>
          <div className="mt-5">
            <Slider label="Bulanıklık" value={amount} onChange={setAmount} min={1} max={40} suffix=" px" />
          </div>
          <div className="mt-4">
            <Button onClick={apply}>Uygula</Button>
          </div>
        </>
      )}
      {out && <OutputPreview blob={out} filename="blurred.jpg" />}
    </ToolShell>
  );
}

/* ═══════════════════════════ watermark ═══════════════════════════ */

const POSITIONS = [
  ['Sol üst', 'tl'], ['Üst orta', 'tc'], ['Sağ üst', 'tr'],
  ['Sol alt', 'bl'], ['Alt orta', 'bc'], ['Sağ alt', 'br'],
  ['Merkez', 'c'], ['Döşeme', 'tile'],
] as const;

export function WatermarkImage() {
  const { img, error, setError, load, reset } = useImageFile();
  const [text, setText] = useState('© MultiTools');
  const [size, setSize] = useState(5);
  const [opacity, setOpacity] = useState(45);
  const [color, setColor] = useState('#ffffff');
  const [position, setPosition] = useState<string>('br');
  const [out, setOut] = useState<Blob | null>(null);

  async function apply() {
    if (!img || !text.trim()) {
      setError('Filigran metni boş olamaz.');
      return;
    }
    setError('');
    try {
      setOut(
        await renderToBlob(
          img.url,
          (ctx, image, canvas) => {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            ctx.drawImage(image, 0, 0);

            const fontSize = (canvas.width * size) / 100;
            ctx.font = `700 ${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity / 100;
            ctx.shadowColor = 'rgba(0,0,0,.35)';
            ctx.shadowBlur = fontSize / 8;

            const pad = fontSize * 0.6;
            const m = ctx.measureText(text);

            if (position === 'tile') {
              ctx.rotate(-0.35);
              for (let y = -canvas.height; y < canvas.height * 2; y += fontSize * 3) {
                for (let x = -canvas.width; x < canvas.width * 2; x += m.width + fontSize * 2) {
                  ctx.fillText(text, x, y);
                }
              }
              return;
            }

            const x =
              position.endsWith('l') ? pad
              : position.endsWith('r') ? canvas.width - m.width - pad
              : (canvas.width - m.width) / 2;
            const y =
              position.startsWith('t') ? pad + fontSize
              : position.startsWith('b') ? canvas.height - pad
              : canvas.height / 2;
            ctx.fillText(text, x, y);
          },
          'image/jpeg',
          0.92,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <ToolShell>
      <Uploader img={img} load={load} reset={reset} />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {img && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Filigran metni">
              <TextInput value={text} onChange={(e) => setText(e.target.value)} />
            </Field>
            <Field label="Renk">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-[var(--border)] bg-transparent"
              />
            </Field>
            <Slider label="Boyut" value={size} onChange={setSize} min={2} max={20} suffix="%" />
            <Slider label="Saydamlık" value={opacity} onChange={setOpacity} min={5} max={100} suffix="%" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {POSITIONS.map(([label, value]) => (
              <button
                key={value}
                onClick={() => setPosition(value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  position === value ? 'bg-brand-600 text-white' : 'border border-[var(--border)] text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={apply}>Filigran ekle</Button>
          </div>
        </>
      )}
      {out && <OutputPreview blob={out} filename="watermarked.jpg" />}
    </ToolShell>
  );
}

/* ═══════════════════════════ meme ═══════════════════════════ */

export function MemeGenerator() {
  const { img, error, setError, load, reset } = useImageFile();
  const [top, setTop] = useState('ÜST YAZI');
  const [bottom, setBottom] = useState('ALT YAZI');
  const [size, setSize] = useState(9);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!img) return;
    let cancelled = false;
    (async () => {
      const image = await loadImage(img.url);
      if (cancelled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);

      const fontSize = (canvas.width * size) / 100;
      ctx.font = `900 ${fontSize}px Impact, Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = fontSize / 12;
      ctx.lineJoin = 'round';

      const draw = (text: string, y: number) => {
        const t = text.toUpperCase();
        ctx.strokeText(t, canvas.width / 2, y);
        ctx.fillText(t, canvas.width / 2, y);
      };
      if (top) draw(top, fontSize * 1.1);
      if (bottom) draw(bottom, canvas.height - fontSize * 0.4);
    })();
    return () => {
      cancelled = true;
    };
  }, [img, top, bottom, size]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Görsel oluşturulamadı.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meme.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  return (
    <ToolShell>
      <Uploader img={img} load={load} reset={reset} hint="Meme şablonunuzu yükleyin" />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {img && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Üst yazı">
              <TextInput value={top} onChange={(e) => setTop(e.target.value)} />
            </Field>
            <Field label="Alt yazı">
              <TextInput value={bottom} onChange={(e) => setBottom(e.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Slider label="Yazı boyutu" value={size} onChange={setSize} min={4} max={18} suffix="%" />
          </div>
          <ResultPanel title="Önizleme" actions={<Button onClick={download}>PNG indir</Button>}>
            <canvas ref={canvasRef} className="max-h-96 w-full rounded-xl object-contain" />
          </ResultPanel>
        </>
      )}
    </ToolShell>
  );
}
