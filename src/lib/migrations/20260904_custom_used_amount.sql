-- ─── credit_cards: adiciona custom_used_amount se não existir ────────────────
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS custom_used_amount NUMERIC(12,2);
