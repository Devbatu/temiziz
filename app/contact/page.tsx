import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'Öneri, hata bildirimi, iş birliği veya API talepleri için bize ulaşın.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">İletişim</h1>
      <p className="mt-3 text-muted">
        Yeni araç önerileriniz, hata bildirimleriniz veya iş birliği talepleriniz için formu
        doldurun.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
