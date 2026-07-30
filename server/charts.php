<?php
/**
 * Sunucu tarafinda SVG grafik uretimi.
 *
 * Neden kutuphane degil: yonetim panelinin CSP'si dis kaynak yuklemeye izin
 * vermiyor (default-src 'self'). Chart.js gibi bir kutuphane icin CSP'yi
 * gevsetmek gerekirdi - guvenlikten grafik icin odun vermeye deger degil.
 * Satir ici SVG hem CSP ile uyumlu, hem JavaScript gerektirmiyor, hem de
 * sayfa aninda aciliyor.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

/** Sayilari Turkce bicimde yazar. */
function mt_n(int|float|null $v): string
{
    return number_format((float) ($v ?? 0), 0, ',', '.');
}

/**
 * Onceki doneme gore degisim rozeti.
 * Yalnizca sayiyi degil, iyi mi kotu mu oldugunu da gosterir.
 */
function mt_delta(int $simdi, int $onceki, bool $artisIyi = true): string
{
    if ($onceki === 0) {
        return $simdi > 0
            ? '<span class="dlt up">yeni</span>'
            : '<span class="dlt flat">&ndash;</span>';
    }
    $fark = (int) round((($simdi - $onceki) / $onceki) * 100);
    if ($fark === 0) {
        return '<span class="dlt flat">&plusmn;0%</span>';
    }
    $iyi = $fark > 0 ? $artisIyi : !$artisIyi;
    $ok  = $fark > 0 ? '&#9650;' : '&#9660;';
    return '<span class="dlt ' . ($iyi ? 'up' : 'down') . '">'
        . $ok . ' ' . abs($fark) . '%</span>';
}

/**
 * Zaman serisi alan grafigi.
 *
 * @param array<int,array{etiket:string,deger:int}> $veri
 */
function mt_chart_area(array $veri, string $renk = '#5b8cff', int $yuksek = 170): string
{
    if (count($veri) < 2) {
        return '<p class="empty">Grafik icin en az iki gunluk veri gerekir.</p>';
    }

    $w = 800;
    $h = $yuksek;
    $padL = 38;
    $padR = 8;
    $padT = 12;
    $padB = 26;

    $degerler = array_map(static fn (array $d): int => (int) $d['deger'], $veri);
    $enBuyuk  = max($degerler);
    // Ust sinir "yuvarlak" bir sayiya cikarilir; eksen okunur olsun.
    $ust = $enBuyuk <= 5 ? 5 : (int) (ceil($enBuyuk / 5) * 5);

    $ic  = $w - $padL - $padR;
    $icY = $h - $padT - $padB;
    $adet = count($veri);
    $x = static fn (int $i): float => $padL + ($adet === 1 ? $ic / 2 : ($i / ($adet - 1)) * $ic);
    $y = static fn (int $v): float => $padT + $icY - ($ust > 0 ? ($v / $ust) * $icY : 0);

    $noktalar = [];
    foreach ($veri as $i => $d) {
        $noktalar[] = sprintf('%.1f,%.1f', $x($i), $y((int) $d['deger']));
    }
    $cizgi = implode(' ', $noktalar);
    $alan  = sprintf('%.1f,%.1f ', $x(0), $padT + $icY) . $cizgi
           . sprintf(' %.1f,%.1f', $x($adet - 1), $padT + $icY);

    $gid = 'g' . substr(md5($renk . $adet), 0, 6);
    $svg = '<svg viewBox="0 0 ' . $w . ' ' . $h . '" width="100%" height="' . $h
        . '" preserveAspectRatio="none" role="img" style="display:block">'
        . '<defs><linearGradient id="' . $gid . '" x1="0" y1="0" x2="0" y2="1">'
        . '<stop offset="0%" stop-color="' . $renk . '" stop-opacity=".38"/>'
        . '<stop offset="100%" stop-color="' . $renk . '" stop-opacity="0"/>'
        . '</linearGradient></defs>';

    // Yatay kilavuz cizgileri + y ekseni etiketleri
    for ($k = 0; $k <= 4; $k++) {
        $deger = (int) round($ust - ($ust / 4) * $k);
        $yy    = $padT + ($icY / 4) * $k;
        $svg .= sprintf(
            '<line x1="%d" y1="%.1f" x2="%d" y2="%.1f" stroke="#232b45" stroke-width="1"/>'
            . '<text x="%d" y="%.1f" fill="#6b7699" font-size="10" text-anchor="end">%s</text>',
            $padL, $yy, $w - $padR, $yy, $padL - 6, $yy + 3, mt_n($deger)
        );
    }

    $svg .= '<polygon points="' . $alan . '" fill="url(#' . $gid . ')"/>'
        . '<polyline points="' . $cizgi . '" fill="none" stroke="' . $renk
        . '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';

    // Veri noktalari: <title> sayesinde fareyle uzerine gelince deger gorunur.
    foreach ($veri as $i => $d) {
        $svg .= sprintf(
            '<circle cx="%.1f" cy="%.1f" r="3" fill="#0b0f1c" stroke="%s" stroke-width="2">'
            . '<title>%s: %s</title></circle>',
            $x($i), $y((int) $d['deger']), $renk,
            htmlspecialchars((string) $d['etiket'], ENT_QUOTES, 'UTF-8'),
            mt_n((int) $d['deger'])
        );
    }

    // X ekseni: ilk, orta ve son etiket (kalabaligi onlemek icin)
    foreach ([0, intdiv($adet - 1, 2), $adet - 1] as $i) {
        $hiza = $i === 0 ? 'start' : ($i === $adet - 1 ? 'end' : 'middle');
        $svg .= sprintf(
            '<text x="%.1f" y="%d" fill="#6b7699" font-size="10" text-anchor="%s">%s</text>',
            $x($i), $h - 8, $hiza,
            htmlspecialchars((string) $veri[$i]['etiket'], ENT_QUOTES, 'UTF-8')
        );
    }

    return $svg . '</svg>';
}

/**
 * Yatay cubuk listesi. Siralamalar icin tablodan cok daha okunur.
 *
 * @param array<int,array{etiket:string,deger:int,ek?:string,baglanti?:string}> $veri
 */
function mt_chart_bars(array $veri, string $renk = '#5b8cff', int $limit = 10): string
{
    if ($veri === []) {
        return '<p class="empty">Veri yok.</p>';
    }
    $veri = array_slice($veri, 0, $limit);
    $enB  = max(array_map(static fn (array $d): int => (int) $d['deger'], $veri)) ?: 1;

    $out = '<div class="bars-h">';
    foreach ($veri as $d) {
        $pct   = max(1.5, ((int) $d['deger'] / $enB) * 100);
        $etiket = htmlspecialchars((string) $d['etiket'], ENT_QUOTES, 'UTF-8');
        $ad = isset($d['baglanti'])
            ? '<a href="' . htmlspecialchars((string) $d['baglanti'], ENT_QUOTES, 'UTF-8')
              . '" target="_blank" rel="noopener">' . $etiket . '</a>'
            : $etiket;

        $out .= '<div class="bar-row">'
            . '<span class="bar-label" title="' . $etiket . '">' . $ad . '</span>'
            . '<span class="bar-track"><span class="bar-fill" style="width:' . round($pct, 1)
            . '%;background:' . $renk . '"></span></span>'
            . '<span class="bar-val">' . mt_n((int) $d['deger'])
            . (isset($d['ek']) ? ' <em>' . htmlspecialchars((string) $d['ek'], ENT_QUOTES, 'UTF-8') . '</em>' : '')
            . '</span></div>';
    }
    return $out . '</div>';
}

/**
 * Halka grafik: bir butunun parcalari (cihaz, tarayici dagilimi).
 *
 * @param array<int,array{etiket:string,deger:int}> $veri
 */
function mt_chart_donut(array $veri, int $boy = 150): string
{
    $toplam = array_sum(array_map(static fn (array $d): int => (int) $d['deger'], $veri));
    if ($toplam === 0) {
        return '<p class="empty">Veri yok.</p>';
    }

    $renkler = ['#5b8cff', '#8b5cf6', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#a3a3a3'];
    $r = 54;
    $c = 2 * M_PI * $r;
    $offset = 0.0;

    $svg = '<svg viewBox="0 0 140 140" width="' . $boy . '" height="' . $boy
        . '" role="img" style="flex:0 0 auto">'
        . '<g transform="rotate(-90 70 70)">';

    foreach ($veri as $i => $d) {
        $pay = (int) $d['deger'] / $toplam;
        $uzunluk = $pay * $c;
        $svg .= sprintf(
            '<circle cx="70" cy="70" r="%d" fill="none" stroke="%s" stroke-width="17"'
            . ' stroke-dasharray="%.2f %.2f" stroke-dashoffset="%.2f"><title>%s: %s (%%%d)</title></circle>',
            $r,
            $renkler[$i % count($renkler)],
            $uzunluk,
            $c - $uzunluk,
            -$offset,
            htmlspecialchars((string) $d['etiket'], ENT_QUOTES, 'UTF-8'),
            mt_n((int) $d['deger']),
            (int) round($pay * 100)
        );
        $offset += $uzunluk;
    }

    $svg .= '</g>'
        . '<text x="70" y="66" text-anchor="middle" fill="#e9edf7" font-size="20" font-weight="700">'
        . mt_n($toplam) . '</text>'
        . '<text x="70" y="82" text-anchor="middle" fill="#6b7699" font-size="10">gosterim</text>'
        . '</svg>';

    // Renk aciklamasi
    $lgn = '<ul class="legend">';
    foreach ($veri as $i => $d) {
        $lgn .= '<li><i style="background:' . $renkler[$i % count($renkler)] . '"></i>'
            . htmlspecialchars((string) $d['etiket'], ENT_QUOTES, 'UTF-8')
            . '<b>' . (int) round(((int) $d['deger'] / $toplam) * 100) . '%</b></li>';
    }
    return '<div class="donut">' . $svg . $lgn . '</ul></div>';
}

/**
 * Huni: her adimda kac kisi kaldi.
 *
 * @param array<int,array{etiket:string,deger:int}> $adimlar
 */
function mt_chart_funnel(array $adimlar): string
{
    if ($adimlar === [] || (int) $adimlar[0]['deger'] === 0) {
        return '<p class="empty">Huni icin yeterli veri yok.</p>';
    }
    $bas = (int) $adimlar[0]['deger'];
    $renkler = ['#5b8cff', '#8b5cf6', '#34d399'];

    $out = '<div class="funnel">';
    foreach ($adimlar as $i => $a) {
        $deger = (int) $a['deger'];
        $pct   = $bas > 0 ? ($deger / $bas) * 100 : 0;
        $onceki = $i > 0 ? (int) $adimlar[$i - 1]['deger'] : $deger;
        $adimPct = $onceki > 0 ? (int) round(($deger / $onceki) * 100) : 0;

        $out .= '<div class="fn-row">'
            . '<span class="fn-label">' . htmlspecialchars((string) $a['etiket'], ENT_QUOTES, 'UTF-8') . '</span>'
            . '<span class="fn-track"><span class="fn-fill" style="width:' . max(2, round($pct, 1))
            . '%;background:' . $renkler[$i % count($renkler)] . '"></span></span>'
            . '<span class="fn-val">' . mt_n($deger)
            . ($i > 0 ? ' <em>' . $adimPct . '%</em>' : '') . '</span></div>';
    }
    return $out . '</div>';
}
