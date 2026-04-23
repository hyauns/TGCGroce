-- ============================================================
-- 14: Feed Configurations — 3-State Pre-order Filter
-- ============================================================
-- Adds a preorder_status column ('all', 'exclude', 'only') to
-- replace the boolean exclude_preorders.
-- Safe backfill: existing exclude_preorders=true → 'exclude',
-- otherwise → 'all'.
-- The old boolean column is kept but no longer read by the app.
-- ============================================================

-- 1. Add the new column (idempotent)
ALTER TABLE feed_configurations
  ADD COLUMN IF NOT EXISTS preorder_status VARCHAR(20) DEFAULT 'all';

-- 2. Add CHECK constraint (wrapped in DO block for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feed_configurations_preorder_status_check'
  ) THEN
    ALTER TABLE feed_configurations
      ADD CONSTRAINT feed_configurations_preorder_status_check
      CHECK (preorder_status IN ('all', 'exclude', 'only'));
  END IF;
END $$;

-- 3. Backfill from old boolean column
UPDATE feed_configurations
  SET preorder_status = CASE
    WHEN exclude_preorders = true THEN 'exclude'
    ELSE 'all'
  END
  WHERE preorder_status IS NULL OR preorder_status = 'all';

SELECT 'preorder_status column added and backfilled successfully!' AS result;
