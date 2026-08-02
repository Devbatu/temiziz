#!/usr/bin/env bash
# Yonetim paneli giris bilgilerini (kullanici adi + parola) belirler.
#
# Parola ekranda gorunmez, kabuk gecmisine yazilmaz ve yalnizca hash'i saklanir.
# Kullanim:  bash ~/parola-belirle.sh

set -euo pipefail

CONFIG="$HOME/domains/celaning.com/mt-config.php"

if [ ! -f "$CONFIG" ]; then
  echo "HATA: $CONFIG bulunamadi." >&2
  exit 1
fi

echo "Yonetim paneli giris bilgileri belirleniyor."
echo "(parola en az 10 karakter onerilir; yazarken ekranda gorunmez)"
echo

read -rp "Kullanici adi: " KUL
if [ ${#KUL} -lt 3 ]; then
  echo "HATA: Kullanici adi en az 3 karakter olmali." >&2
  exit 1
fi
if [ "$KUL" = "admin" ]; then
  echo "UYARI: 'admin' otomatik deneme araclarinin ilk denedigi kullanici adidir."
  read -rp "Yine de kullanilsin mi? (e/H): " ONAY
  case "$ONAY" in
    e|E) ;;
    *) echo "Iptal edildi."; exit 1 ;;
  esac
fi

read -rsp "Yeni parola  : " P1; echo
read -rsp "Tekrar       : " P2; echo

if [ "$P1" != "$P2" ]; then
  echo "HATA: Parolalar eslesmiyor." >&2
  exit 1
fi
if [ ${#P1} -lt 8 ]; then
  echo "HATA: Parola en az 8 karakter olmali." >&2
  exit 1
fi

# PHP kodunu ayri bir gecici dosyaya yaziyoruz.
#
# NEDEN `php -r '...'` degil: kod icinde hem tek hem cift tirnak, hem de regex
# kacislari var; bunlari tek tirnakli bir kabuk dizesine sigdirmak kacinilmaz
# sekilde bozuluyor. Gecici dosya bu sorun sinifini tamamen ortadan kaldirir.
YAZICI="$(mktemp -t mt-giris-XXXXXX.php)"
trap 'rm -f "$YAZICI"' EXIT

cat > "$YAZICI" <<'PHPKODU'
<?php
/** mt-config.php icindeki admin_user ve admin_hash alanlarini gunceller. */
declare(strict_types=1);

$config    = $argv[1];
$parola    = getenv('MT_NEW_PASS');
$kullanici = getenv('MT_NEW_USER');
$src = file_get_contents($config);
$new = $src;

/*
 * DIKKAT: duz preg_replace kullanmayin. bcrypt hash'i "$2y$..." ile baslar ve
 * degistirme metnindeki $2 geri-referans sanilip yutulur; sonucta parola
 * dogrulamasi sessizce basarisiz olur. Callback bicimi degistirme metnini
 * yorumlamaz, bu yuzden guvenlidir.
 */
$hash = password_hash($parola, PASSWORD_DEFAULT);
$new = preg_replace_callback(
    '/([\'"]admin_hash[\'"]\s*=>\s*)[\'"][^\'"]*[\'"]/',
    static fn (array $m): string => $m[1] . var_export($hash, true),
    $new,
    1,
    $sayi
);
if ($sayi !== 1) {
    fwrite(STDERR, "HATA: admin_hash alani bulunamadi.\n");
    exit(1);
}

// Kullanici adi: alan varsa guncellenir, yoksa admin_hash satirinin ustune eklenir.
if (preg_match('/[\'"]admin_user[\'"]\s*=>/', $new)) {
    $new = preg_replace_callback(
        '/([\'"]admin_user[\'"]\s*=>\s*)[\'"][^\'"]*[\'"]/',
        static fn (array $m): string => $m[1] . var_export($kullanici, true),
        $new,
        1
    );
} else {
    $new = preg_replace_callback(
        '/^([ \t]*)([\'"]admin_hash[\'"]\s*=>)/m',
        static fn (array $m): string =>
            $m[1] . "'admin_user' => " . var_export($kullanici, true) . ",\n" . $m[1] . $m[2],
        $new,
        1
    );
}

file_put_contents($config, $new);

// Yazdiktan sonra dogrula - sessiz bozulmayi burada yakalariz.
$kontrol = require $config;
if (!password_verify($parola, $kontrol['admin_hash'])
    || ($kontrol['admin_user'] ?? null) !== $kullanici) {
    fwrite(STDERR, "HATA: Bilgiler yazildi ama dogrulanamadi. Degisiklik geri alindi.\n");
    file_put_contents($config, $src);
    exit(1);
}

echo "Kullanici adi ve parola guncellendi, dogrulandi.\n";
PHPKODU

# Degerleri ortam degiskeniyle veriyoruz; komut satirinda gorunmezler,
# boylece 'ps' ciktisina ve kabuk gecmisine dusmezler.
MT_NEW_PASS="$P1" MT_NEW_USER="$KUL" php "$YAZICI" "$CONFIG"

unset MT_NEW_PASS MT_NEW_USER
chmod 600 "$CONFIG"

echo
echo "Tamam. Panel: https://celaning.com/mt/admin.php"
echo "Kullanici adi: $KUL"
echo "Bu dosyayi silebilirsiniz: rm ~/parola-belirle.sh"
