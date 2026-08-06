/**
 * Pure string transforms shared by the developer / SEO text tools.
 * Every function either returns the transformed string or throws an Error
 * with a user-friendly Turkish message.
 */

export function formatJson(input: string, indent = 2) {
  return JSON.stringify(parseJson(input), null, indent);
}

export function minifyJson(input: string) {
  return JSON.stringify(parseJson(input));
}

export function parseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch (e) {
    const msg = (e as Error).message;
    const pos = /position (\d+)/.exec(msg)?.[1];
    if (pos) {
      const upto = input.slice(0, Number(pos));
      const line = upto.split('\n').length;
      const col = Number(pos) - upto.lastIndexOf('\n');
      throw new Error(`Geçersiz JSON — ${line}. satır, ${col}. karakter civarında hata var.`);
    }
    throw new Error('Geçersiz JSON. Tırnak, virgül ve parantezleri kontrol edin.');
  }
}

export function formatXml(input: string, indentSize = 2) {
  const src = input.replace(/>\s*</g, '><').trim();
  if (!src.startsWith('<')) throw new Error('Girdi geçerli bir XML/HTML gibi görünmüyor.');
  const pad = ' '.repeat(indentSize);
  let depth = 0;
  return src
    .replace(/(>)(<)(\/*)/g, '$1\n$2$3')
    .split('\n')
    .map((line) => {
      if (/^<\/\w/.test(line)) depth = Math.max(depth - 1, 0);
      const out = pad.repeat(depth) + line;
      if (/^<\w[^>]*[^/]>.*$/.test(line) && !/<\/\w/.test(line.slice(1))) depth++;
      return out;
    })
    .join('\n');
}

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export function formatHtml(input: string, indentSize = 2) {
  const tokens = input
    .replace(/\r/g, '')
    .replace(/>\s+</g, '><')
    .split(/(<[^>]+>)/)
    .filter((t) => t.trim() !== '');
  const pad = ' '.repeat(indentSize);
  let depth = 0;
  const out: string[] = [];

  for (const token of tokens) {
    const isTag = token.startsWith('<');
    const isClose = /^<\//.test(token);
    const isSelf = /\/>$/.test(token) || VOID_TAGS.has(tagName(token));
    const isSpecial = /^<[!?]/.test(token);

    if (isTag && isClose) depth = Math.max(depth - 1, 0);
    out.push(pad.repeat(depth) + token.trim());
    if (isTag && !isClose && !isSelf && !isSpecial) depth++;
  }
  return out.join('\n');
}

function tagName(token: string) {
  return /^<\/?\s*([a-zA-Z0-9-]+)/.exec(token)?.[1]?.toLowerCase() ?? '';
}

export function minifyCss(input: string) {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s+/g, ' ')
    .trim();
}

export function beautifyCss(input: string) {
  return minifyCss(input)
    .replace(/}/g, '}\n')
    .replace(/{/g, ' {\n  ')
    .replace(/;/g, ';\n  ')
    .replace(/\n\s*}/g, '\n}')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/**
 * Conservative JS minifier: strips comments and collapses whitespace while
 * leaving string literals, template literals and regex literals untouched.
 */
export function minifyJs(input: string) {
  let out = '';
  let i = 0;
  const n = input.length;
  let prevMeaningful = '';

  while (i < n) {
    const c = input[i];
    const next = input[i + 1];

    // line comment
    if (c === '/' && next === '/') {
      while (i < n && input[i] !== '\n') i++;
      continue;
    }
    // block comment
    if (c === '/' && next === '*') {
      i += 2;
      while (i < n && !(input[i] === '*' && input[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // strings & templates
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let lit = c;
      i++;
      while (i < n) {
        if (input[i] === '\\') {
          lit += input[i] + (input[i + 1] ?? '');
          i += 2;
          continue;
        }
        lit += input[i];
        if (input[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      out += lit;
      prevMeaningful = quote;
      continue;
    }
    // regex literal — only where a value can start
    if (c === '/' && canPrecedeRegex(prevMeaningful)) {
      let lit = '/';
      i++;
      let inClass = false;
      while (i < n) {
        const ch = input[i];
        if (ch === '\\') {
          lit += ch + (input[i + 1] ?? '');
          i += 2;
          continue;
        }
        if (ch === '[') inClass = true;
        else if (ch === ']') inClass = false;
        lit += ch;
        i++;
        if (ch === '/' && !inClass) break;
        if (ch === '\n') throw new Error('Kapatılmamış regex ifadesi bulundu.');
      }
      while (i < n && /[a-z]/.test(input[i])) lit += input[i++];
      out += lit;
      prevMeaningful = '/';
      continue;
    }
    // whitespace
    if (/\s/.test(c)) {
      let j = i;
      while (j < n && /\s/.test(input[j])) j++;
      const before = out[out.length - 1] ?? '';
      const after = input[j] ?? '';
      if (/[\w$]/.test(before) && /[\w$]/.test(after)) out += ' ';
      i = j;
      continue;
    }

    out += c;
    prevMeaningful = c;
    i++;
  }
  return out.trim();
}

function canPrecedeRegex(prev: string) {
  return prev === '' || '(,=:[!&|?{};+-*%~^<>'.includes(prev);
}

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
  'OUTER JOIN', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'UNION ALL', 'UNION',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'ON', 'AND', 'OR',
];

export function formatSql(input: string) {
  let sql = input.replace(/\s+/g, ' ').trim();
  for (const kw of SQL_KEYWORDS) {
    sql = sql.replace(new RegExp(`\\s+${kw.replace(/ /g, '\\s+')}\\s+`, 'gi'), `\n${kw} `);
  }
  return sql
    .split('\n')
    .map((line) => {
      const l = line.trim();
      return /^(AND|OR|ON)\b/i.test(l) ? `  ${l}` : l;
    })
    .join('\n')
    .replace(/,\s*/g, ',\n  ')
    .trim();
}

export function encodeBase64(input: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(input)));
}

export function decodeBase64(input: string) {
  try {
    const bin = atob(input.trim());
    return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
  } catch {
    throw new Error('Geçerli bir Base64 değeri değil.');
  }
}

const TR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
};

export function slugify(input: string) {
  return input
    .split('')
    .map((ch) => TR_MAP[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export interface DensityRow {
  word: string;
  count: number;
  density: number;
}

export function keywordDensity(text: string, minLength = 3): { rows: DensityRow[]; total: number } {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= minLength);
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  const rows = [...counts.entries()]
    .map(([word, count]) => ({ word, count, density: (count / words.length) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);
  return { rows, total: words.length };
}

/** Minimal Markdown → HTML renderer (headings, emphasis, links, lists, code). */
export function markdownToHtml(md: string) {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const blocks = escape(md).split(/\n{2,}/);
  return blocks
    .map((block) => {
      const b = block.trim();
      if (!b) return '';
      if (/^```/.test(b)) {
        return `<pre><code>${b.replace(/^```\w*\n?/, '').replace(/```$/, '')}</code></pre>`;
      }
      const heading = /^(#{1,6})\s+(.*)$/.exec(b);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${inline(heading[2])}</h${level}>`;
      }
      if (/^&gt;\s/.test(b)) return `<blockquote>${inline(b.replace(/^&gt;\s?/gm, ''))}</blockquote>`;
      if (/^([-*+])\s/m.test(b)) {
        const items = b.split('\n').map((l) => `<li>${inline(l.replace(/^[-*+]\s+/, ''))}</li>`);
        return `<ul>${items.join('')}</ul>`;
      }
      if (/^\d+\.\s/m.test(b)) {
        const items = b.split('\n').map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`);
        return `<ol>${items.join('')}</ol>`;
      }
      if (/^(-{3,}|\*{3,})$/.test(b)) return '<hr />';
      return `<p>${inline(b.replace(/\n/g, '<br />'))}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  function inline(s: string) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (_m, alt: string, src: string) => `<img src="${safeUrl(src)}" alt="${alt}" />`,
      )
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_m, text: string, href: string) => {
          const url = safeUrl(href);
          // Site içi bağlantılar aynı sekmede ve takip edilebilir kalmalı:
          // nofollow, kendi sayfalarımız arasındaki bağ sinyalini boşa
          // harcıyor; target="_blank" ise okuyucuyu gereksizce yeni sekmeye
          // atıyordu. Dış bağlantılarda ikisi de yerinde duruyor.
          const ici = url.startsWith('/') || url.startsWith('#');
          return ici
            ? `<a href="${url}">${text}</a>`
            : `<a href="${url}" rel="nofollow noopener" target="_blank">${text}</a>`;
        },
      );
  }
}

/**
 * Yalnızca güvenli şemalara izin verir. `javascript:`, `data:` ve `vbscript:`
 * gibi şemalar bağlantı/görsel adresine yazıldığında XSS'e yol açar; bunlar
 * zararsız bir yer tutucuya çevrilir.
 *
 * Girdi bu noktada zaten HTML-escape edilmiş durumdadır (&amp; gibi), o yüzden
 * şema kontrolünü kaçırmaya çalışan varyantlara karşı önce çözüp bakıyoruz.
 */
export function safeUrl(raw: string): string {
  const decoded = raw
    .replace(/&amp;/g, '&')
    .replace(/&#(d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(parseInt(code, 16)));

  // Sema tespitinden once bosluk ve kontrol karakterlerini at; boylece
  // "java	script:alert(1)" gibi kacis denemeleri de yakalanir.
  // eslint-disable-next-line no-control-regex
  const normalised = decoded.replace(/[s -]/g, '').toLowerCase();

  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(normalised)?.[1];
  if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme)) {
    return '#gecersiz-baglanti';
  }
  // Protokolsuz (//ornek.com) ve goreli adresler sorunsuzdur.
  return raw.replace(/"/g, '&quot;');
}

export function decodeJwt(token: string) {
  const parts = token.trim().split('.');
  if (parts.length < 2) throw new Error('Geçerli bir JWT değil — token üç bölümden oluşmalıdır.');
  const decodePart = (part: string) => {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    try {
      return JSON.parse(decodeBase64(padded + '='.repeat((4 - (padded.length % 4)) % 4)));
    } catch {
      throw new Error('Token bölümleri çözülemedi. Kopyalarken eksik karakter kalmış olabilir.');
    }
  };
  const header = decodePart(parts[0]);
  const payload = decodePart(parts[1]);
  return { header, payload, signature: parts[2] ?? '' };
}
