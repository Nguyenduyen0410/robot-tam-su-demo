CREATE TABLE IF NOT EXISTS conversation_logs (
  id TEXT PRIMARY KEY,
  elder_id TEXT NOT NULL,
  speaker TEXT NOT NULL,
  message_text TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'demo',
  review_flag TEXT NOT NULL DEFAULT 'none'
);

CREATE INDEX IF NOT EXISTS idx_conversation_elder_time
ON conversation_logs (elder_id, timestamp DESC);
