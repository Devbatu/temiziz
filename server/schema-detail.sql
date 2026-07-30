-- Davranis analitigi icin ek alanlar.
-- Amac: "kim geldi, ne yapti, nerede takildi" sorularini yanitlamak.
-- Karakter/tuş kaydi YOK: araclara girilen metin hicbir zaman gonderilmez.

ALTER TABLE mt_events
  -- Sayfada gecirilen sure (sayfadan ayrilirken gonderilir).
  ADD COLUMN IF NOT EXISTS duration_ms INT UNSIGNED DEFAULT NULL AFTER label,
  -- En derin kaydirma yuzdesi: icerigin ne kadari goruldu.
  ADD COLUMN IF NOT EXISTS scroll_pct TINYINT UNSIGNED DEFAULT NULL AFTER duration_ms,
  -- Tarayici ve isletim sistemi (User-Agent'tan kaba siniflandirma).
  ADD COLUMN IF NOT EXISTS browser VARCHAR(24) DEFAULT NULL AFTER scroll_pct,
  ADD COLUMN IF NOT EXISTS os VARCHAR(24) DEFAULT NULL AFTER browser,
  -- Ekran genisligi (yalnizca kirilim noktasi; parmak izi olusturmaz).
  ADD COLUMN IF NOT EXISTS viewport_w SMALLINT UNSIGNED DEFAULT NULL AFTER os;

-- Yolculuk sorgusu ziyaretci + zaman siralar; bu indeks onu hizlandirir.
CREATE INDEX IF NOT EXISTS idx_journey ON mt_events (visitor_hash, created_at, id);
