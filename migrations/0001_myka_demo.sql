CREATE TABLE IF NOT EXISTS blood_pressure (
  id TEXT PRIMARY KEY,
  elder_id TEXT NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  heart_rate INTEGER NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bp_elder_time ON blood_pressure(elder_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  elder_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  responded_by TEXT,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS care_schedule (
  id TEXT PRIMARY KEY,
  elder_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  scheduled_at TEXT NOT NULL,
  confirmed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS maintenance_notifications (
  id TEXT PRIMARY KEY,
  elder_id TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS service_payments (
  id TEXT PRIMARY KEY,
  elder_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  status TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  paid_at TEXT
);

CREATE TABLE IF NOT EXISTS device_connectivity (
  elder_id TEXT PRIMARY KEY,
  wifi_ssid TEXT,
  wifi_ip TEXT,
  wifi_signal INTEGER,
  wifi_frequency TEXT,
  wifi_status TEXT,
  bluetooth_status TEXT,
  paired_devices TEXT NOT NULL DEFAULT '[]',
  last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS telegram_consultation (
  elder_id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  members_summary TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  group_chat_url TEXT
);

-- Entirely synthetic records for a public demo. Do not store real patient data here.
INSERT OR IGNORE INTO blood_pressure VALUES
('DEMO-001','E001',126,78,72,'normal','Dữ liệu minh họa', '2026-10-16T08:00:00.000Z'),
('DEMO-002','E001',128,79,73,'normal','Dữ liệu minh họa', '2026-10-17T08:00:00.000Z'),
('DEMO-003','E001',131,82,75,'warning','Dữ liệu minh họa', '2026-10-18T08:00:00.000Z'),
('DEMO-004','E001',129,80,74,'normal','Dữ liệu minh họa', '2026-10-19T08:00:00.000Z'),
('DEMO-005','E001',134,84,77,'warning','Dữ liệu minh họa', '2026-10-20T08:00:00.000Z'),
('DEMO-006','E001',128,79,72,'normal','Dữ liệu minh họa', '2026-10-21T08:00:00.000Z'),
('DEMO-007','E001',127,78,71,'normal','Dữ liệu minh họa', '2026-10-22T08:00:00.000Z');

INSERT OR IGNORE INTO care_schedule VALUES
('SCH-DEMO-1','E001','medication','Thuốc theo lịch gia đình','Dữ liệu lịch chăm sóc minh họa; xác nhận với nhân viên y tế.','2026-10-22T08:00:00.000Z',0),
('SCH-DEMO-2','E001','checkup','Lịch tái khám minh họa','Cập nhật theo lịch do cơ sở y tế cung cấp.','2026-10-28T09:00:00.000Z',0);
INSERT OR IGNORE INTO maintenance_notifications VALUES
('MNT-DEMO-1','E001','Kiểm tra thiết bị minh họa','Nhắc bảo trì thiết bị demo.','pending','2026-10-30','2026-10-20T09:00:00.000Z');
INSERT OR IGNORE INTO service_payments VALUES
('PAY-DEMO-1','E001','Myka Care · Gói demo',0,'VND','demo','2026-10-01','2026-10-31',NULL);
INSERT OR IGNORE INTO device_connectivity VALUES
('E001','Wi-Fi minh họa',NULL,0,'2.4GHz','demo','demo','[]','2026-10-22T00:00:00.000Z');
INSERT OR IGNORE INTO telegram_consultation VALUES
('E001','Nhóm trao đổi chăm sóc (chưa cấu hình)','Chỉ mở nhóm chính thức khi được cấu hình.',0,NULL);
