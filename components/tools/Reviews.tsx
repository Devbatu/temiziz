'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Button, Field, TextArea, TextInput } from './shared';

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

/**
 * Reviews are stored in localStorage. Until a backend is wired up this keeps the
 * section honest — it only ever shows feedback written on this device.
 */
export function Reviews({ slug }: { slug: string }) {
  const key = `reviews:${slug}`;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    try {
      setReviews(JSON.parse(localStorage.getItem(key) ?? '[]'));
    } catch {
      setReviews([]);
    }
  }, [key]);

  function submit() {
    if (!text.trim()) return;
    const next = [
      {
        id: crypto.randomUUID(),
        name: name.trim() || 'Anonim',
        rating,
        text: text.trim(),
        date: new Date().toISOString(),
      },
      ...reviews,
    ];
    setReviews(next);
    localStorage.setItem(key, JSON.stringify(next));
    setText('');
    setName('');
  }

  const average = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="surface rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Yorumlar</h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <strong>{average.toFixed(1)}</strong>
            <span className="text-muted">/ 5 · {reviews.length} yorum</span>
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[200px_1fr]">
        <Field label="Adınız">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="İsteğe bağlı" />
        </Field>
        <Field label="Puanınız">
          <div className="flex h-[42px] items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} yıldız`}
              >
                <Star
                  className={`h-6 w-6 transition-transform hover:scale-110 ${
                    n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-muted'
                  }`}
                />
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Yorumunuz">
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Bu araç işinize yaradı mı? Deneyiminizi paylaşın."
            className="min-h-[100px] font-sans text-sm"
          />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!text.trim()}>
          Yorumu gönder
        </Button>
        <span className="text-xs text-muted">
          Yorumunuz şu an yalnızca bu cihazda saklanır.
        </span>
      </div>

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{r.name}</span>
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'
                      }`}
                    />
                  ))}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{r.text}</p>
              <p className="mt-2 text-xs text-muted">
                {new Date(r.date).toLocaleDateString('tr-TR', { dateStyle: 'long' })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
