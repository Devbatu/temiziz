/**
 * JSON-LD verisini bir <script> etiketine gomerken kullanilir.
 *
 * JSON.stringify ciktisindaki kapanis etiketi dizisi tarayicida script'i
 * erkenden kapatir ve sonrasindaki icerik HTML olarak yorumlanir. Veri su an
 * kendi kayit defterimizden geliyor; ileride arac adi veya aciklamasi
 * disaridan beslenirse bu dogrudan bir XSS'e donusur.
 *
 * Riskli karakterleri JSON'un kendi kacis bicimiyle yazmak sorunu kaynaginda
 * kapatir: cikti hala gecerli JSON'dur, ama HTML ayristiricisi icin zararsizdir.
 * U+2028 ve U+2029 ayrica JavaScript'te satir sonu sayildigi icin escape edilir.
 */
export function jsonLdScript(data: unknown): { __html: string } {
  const json = JSON.stringify(data);
  let out = '';

  for (const ch of json) {
    const code = ch.charCodeAt(0);
    if (ch === '<') out += '\\u003c';
    else if (ch === '>') out += '\\u003e';
    else if (ch === '&') out += '\\u0026';
    else if (code === 0x2028) out += '\\u2028';
    else if (code === 0x2029) out += '\\u2029';
    else out += ch;
  }

  return { __html: out };
}
