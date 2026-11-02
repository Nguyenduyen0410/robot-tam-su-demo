CREATE TABLE IF NOT EXISTS research_raw (id TEXT PRIMARY KEY, version TEXT NOT NULL, elder_id TEXT NOT NULL, metric TEXT NOT NULL, payload TEXT NOT NULL, is_synthetic INTEGER NOT NULL CHECK(is_synthetic=1));
CREATE TABLE IF NOT EXISTS health_measurements (id TEXT PRIMARY KEY, elder_id TEXT NOT NULL, metric TEXT NOT NULL, value REAL, unit TEXT NOT NULL, context TEXT, measured_at TEXT NOT NULL, received_at TEXT NOT NULL, source TEXT NOT NULL, is_synthetic INTEGER NOT NULL CHECK(is_synthetic=1), payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS alert_feedback (id TEXT PRIMARY KEY, elder_id TEXT NOT NULL, alert_id TEXT NOT NULL, feedback TEXT NOT NULL, created_at TEXT NOT NULL, is_synthetic INTEGER NOT NULL CHECK(is_synthetic=1));
CREATE INDEX IF NOT EXISTS idx_health_demo ON health_measurements(elder_id,metric,measured_at);
CREATE INDEX IF NOT EXISTS idx_raw_demo ON research_raw(version,elder_id);
