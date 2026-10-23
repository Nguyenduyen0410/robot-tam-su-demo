CREATE TABLE IF NOT EXISTS family_preferences (
  elder_id TEXT PRIMARY KEY,
  dnd_mode TEXT NOT NULL DEFAULT 'off',
  dnd_until TEXT,
  voice_profile TEXT NOT NULL DEFAULT 'female_young_sweet',
  robot_name TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO family_preferences (elder_id, dnd_mode, dnd_until, voice_profile, robot_name, updated_at)
VALUES ('E001', 'off', NULL, 'female_young_sweet', '', '2026-10-23T00:00:00.000Z');
