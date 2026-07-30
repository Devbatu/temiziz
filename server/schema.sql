-- MultiTools analitik semasi
-- Kurulum: phpMyAdmin > veritabanini sec > SQL sekmesi > bu dosyayi calistir.

CREATE TABLE IF NOT EXISTS mt_events (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type    VARCHAR(32)     NOT NULL,
  path          VARCHAR(255)    NOT NULL,
  tool_slug     VARCHAR(80)     DEFAULT NULL,
  label         VARCHAR(120)    DEFAULT NULL,
  referrer_host VARCHAR(120)    DEFAULT NULL,
  device        ENUM('desktop','mobile','tablet','bot','other') NOT NULL DEFAULT 'other',
  country       CHAR(2)         DEFAULT NULL,
  -- Ziyaretci IP'si HAM olarak saklanmaz; gunluk degisen bir salt ile
  -- hashlenir. Tekil ziyaretci sayimi mumkun olur, kisisel veri tutulmaz.
  visitor_hash  CHAR(16)        NOT NULL,
  created_at    DATETIME        NOT NULL,
  PRIMARY KEY (id),
  KEY idx_created (created_at),
  KEY idx_type_created (event_type, created_at),
  KEY idx_tool (tool_slug, created_at),
  KEY idx_visitor (visitor_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Basit hiz siniri sayaci (IP hash basina dakikalik istek adedi).
CREATE TABLE IF NOT EXISTS mt_rate (
  visitor_hash CHAR(16)         NOT NULL,
  window_start INT UNSIGNED     NOT NULL,
  hits         SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (visitor_hash, window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin giris denemeleri (kaba kuvvet saldirisini yavaslatmak icin).
CREATE TABLE IF NOT EXISTS mt_login_attempts (
  ip_hash     CHAR(16)     NOT NULL,
  attempted_at DATETIME    NOT NULL,
  success     TINYINT(1)   NOT NULL DEFAULT 0,
  KEY idx_ip_time (ip_hash, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
