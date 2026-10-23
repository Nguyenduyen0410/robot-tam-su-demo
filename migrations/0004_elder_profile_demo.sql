CREATE TABLE IF NOT EXISTS elder_profiles (
  elder_id TEXT PRIMARY KEY,
  age INTEGER,
  address TEXT NOT NULL DEFAULT '',
  health_notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO elder_profiles (elder_id, age, address, health_notes, updated_at)
VALUES (
  'E001',
  72,
  '12 Đường Hoa Mai, Phường Hòa Xuân, Đà Nẵng (địa chỉ giả)',
  'Tăng huyết áp (tình trạng minh họa)',
  '2026-10-24T00:00:00.000Z'
);
