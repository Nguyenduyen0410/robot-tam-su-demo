-- timestamp remains the source measurement time. Do not backfill receipt times:
-- historical receipt events were not logged by previous releases.
-- The Pages API also applies this additive migration lazily for existing demos.
-- Run this file only on databases where received_at has not been added yet.
ALTER TABLE blood_pressure ADD COLUMN received_at TEXT;
