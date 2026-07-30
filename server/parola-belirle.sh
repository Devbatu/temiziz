#!/usr/bin/env bash
# Yonetim paneli parolasini belirler.
#
# Parola ekranda gorunmez, gecmise yazilmaz ve yalnizca hash'i saklanir.
# Kullanim:  bash ~/parola-belirle.sh

set -euo pipefail

CONFIG="$HOME/domains/celaning.com/mt-config.php"

if [ ! -f "$CONFIG" ]; then
  echo "HATA: $CONFIG bulunamadi." >&2
  exit 1
fi

echo "Yonetim paneli parolasi belirleniyor."
echo "(en az 10 karakter onerilir; yazarken ekranda gorunmez)"
echo

read -rsp "Yeni parola: " P1; echo
read -rsp "Tekrar     : " P2; echo

if [ "$P1" != "$P2" ]; then
  echo "HATA: Parolalar eslesmiyor." >&2
  exit 1
fi
if [ ${#P1} -lt 8 ]; then
  echo "HATA: Parola en az 8 karakter olmali." >&2
  exit 1
fi

# Parolayi PHP'ye ortam degiskeniyle veriyoruz; komut satirinda gorunmez,
# boylece 'ps' ciktisina ve kabuk gecmisine dusmez.
MT_NEW_PASS="$P1" php -r '
$config = $argv[1];
$hash   = password_hash(getenv("MT_NEW_PASS"), PASSWORD_DEFAULT);
$src    = file_get_contents($config);

// DIKKAT: preg_replace kullanmayin. bcrypt hash i "$2y$..." ile baslar ve
// degistirme metnindeki $2 geri-referans sanilip yutulur. Callback bicimi
// degistirme metnini yorumlamaz, bu yuzden guvenlidir.
$new = preg_replace_callback(
    "/([\"\x27]admin_hash[\"\x27]\s*=>\s*)[\"\x27][^\"\x27]*[\"\x27]/",
    static fn (array $m): string => $m[1] . var_export($hash, true),
    $src,
    1,
    $count
);
if ($count !== 1) {
    fwrite(STDERR, "HATA: admin_hash alani bulunamadi.\n");
    exit(1);
}
file_put_contents($config, $new);

// Yazdiktan sonra dogrula - sessiz bozulmayi burada yakalariz.
$check = require $config;
if (!password_verify(getenv("MT_NEW_PASS"), $check["admin_hash"])) {
    fwrite(STDERR, "HATA: Parola yazildi ama dogrulanamadi. Degisiklik geri alinmali.\n");
    file_put_contents($config, $src);
    exit(1);
}
echo "Parola guncellendi ve dogrulandi.\n";
' "$CONFIG"

unset MT_NEW_PASS
chmod 600 "$CONFIG"

echo
echo "Tamam. Panel: https://celaning.com/mt/admin.php"
echo "Bu dosyayi silebilirsiniz: rm ~/parola-belirle.sh"
