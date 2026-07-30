'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';

let libPromise: Promise<typeof import('pdfjs-dist')> | null = null;

/**
 * Loads pdf.js on demand and points it at the bundled worker.
 * Kept in one place so every PDF reader tool shares a single chunk.
 */
export async function getPdfjs() {
  if (!libPromise) {
    libPromise = import('pdfjs-dist').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      return lib;
    });
  }
  return libPromise;
}

export class PasswordRequiredError extends Error {
  constructor(public wrong: boolean) {
    super(wrong ? 'Parola hatalı. Lütfen tekrar deneyin.' : 'Bu PDF parola korumalı.');
  }
}

export async function openPdf(data: ArrayBuffer, password?: string): Promise<PDFDocumentProxy> {
  const lib = await getPdfjs();
  try {
    return await lib.getDocument({ data: new Uint8Array(data), password }).promise;
  } catch (e) {
    const err = e as { name?: string; code?: number; message?: string };
    // 1 = NEED_PASSWORD, 2 = INCORRECT_PASSWORD
    if (err.name === 'PasswordException') throw new PasswordRequiredError(err.code === 2);
    throw new Error('PDF okunamadı. Dosya bozuk veya desteklenmeyen bir biçimde olabilir.');
  }
}

/** Renders one page to a canvas at the requested scale. */
export async function renderPage(doc: PDFDocumentProxy, pageNumber: number, scale: number) {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tarayıcınız canvas desteklemiyor.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Görsel üretilemedi.'))), type, quality),
  );
}
