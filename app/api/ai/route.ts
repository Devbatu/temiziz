import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAiTool } from '@/lib/ai-prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-opus-5';

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          'Yapay zekâ araçları henüz yapılandırılmamış. Sunucu ortamında ANTHROPIC_API_KEY tanımlanmalı.',
        code: 'not_configured',
      },
      { status: 503 },
    );
  }

  let body: { tool?: string; values?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const spec = getAiTool(String(body.tool ?? ''));
  if (!spec) {
    return NextResponse.json({ error: 'Bilinmeyen araç.' }, { status: 400 });
  }

  const values = body.values ?? {};
  const missing = spec.fields.filter((f) => f.required && !values[f.name]?.trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Şu alanlar zorunlu: ${missing.map((f) => f.label).join(', ')}` },
      { status: 400 },
    );
  }

  // Cheap abuse guard — these prompts are short by design.
  const totalLength = Object.values(values).join('').length;
  if (totalLength > 20000) {
    return NextResponse.json(
      { error: 'Girdi çok uzun. Lütfen metni kısaltıp tekrar deneyin.' },
      { status: 413 },
    );
  }

  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: spec.maxTokens,
      // Short, well-specified generation tasks — low effort keeps latency and
      // cost down without hurting quality here.
      output_config: { effort: 'low' },
      // Opus 5's safety classifiers can decline a request; fall back automatically.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: spec.system,
      messages: [{ role: 'user', content: spec.build(values) }],
    });

    if (response.stop_reason === 'refusal') {
      return NextResponse.json(
        {
          error:
            'Bu istek güvenlik politikaları nedeniyle yanıtlanamadı. Farklı bir konuyla tekrar deneyin.',
          code: 'refusal',
        },
        { status: 422 },
      );
    }

    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    if (!text) {
      return NextResponse.json({ error: 'Boş yanıt alındı. Tekrar deneyin.' }, { status: 502 });
    }

    return NextResponse.json({
      text,
      truncated: response.stop_reason === 'max_tokens',
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Şu an yoğunluk var. Birkaç saniye sonra tekrar deneyin.' },
        { status: 429 },
      );
    }
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'API anahtarı geçersiz. Sunucu yapılandırmasını kontrol edin.' },
        { status: 500 },
      );
    }
    if (e instanceof Anthropic.APIConnectionError) {
      return NextResponse.json(
        { error: 'Yapay zekâ servisine ulaşılamadı. Tekrar deneyin.' },
        { status: 504 },
      );
    }
    console.error('AI route error:', e);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
