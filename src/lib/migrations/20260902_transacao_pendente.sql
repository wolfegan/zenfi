-- =============================================================================
-- Migração 2026-09-02 — Transações previstas / pendentes
--
-- Rode UMA VEZ no Supabase → SQL Editor → New Query. Idempotente.
-- =============================================================================

-- 'confirmed' = já aconteceu, afeta o saldo.
-- 'pending'   = lançamento previsto/futuro, NÃO afeta o saldo até ser confirmado.
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed';

DO $$ BEGIN
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_status_check
    CHECK (status IN ('confirmed', 'pending'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user_status
  ON transactions(user_id, status);
