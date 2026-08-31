-- =============================================================================
-- Migração 2026-09-01 — Rotativo do cartão + saldo de conta centralizado
--
-- Rode UMA VEZ no Supabase → SQL Editor → New Query. Idempotente.
-- =============================================================================

-- ─── credit_card_bills: marca faturas cujo saldo foi levado ao rotativo ──────
ALTER TABLE credit_card_bills
  ADD COLUMN IF NOT EXISTS rolled_forward BOOLEAN NOT NULL DEFAULT false;

-- ─── RPC atômica para ajustar saldo de conta ────────────────────────────────
-- Evita a condição de corrida do "ler saldo → somar no app → gravar".
CREATE OR REPLACE FUNCTION public.increment_account_balance(
  p_account_id UUID,
  p_delta NUMERIC
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  UPDATE public.accounts
  SET balance = balance + p_delta
  WHERE id = p_account_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_account_balance(UUID, NUMERIC) TO authenticated;
