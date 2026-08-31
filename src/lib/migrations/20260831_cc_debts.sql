-- =============================================================================
-- Migração 2026-08-31 — Cartão de crédito (parcelamento, limite, fatura parcial)
--                       e Dívidas/Crediários (parcelas + histórico em tabela)
--
-- Rode este arquivo UMA VEZ no Supabase → SQL Editor → New Query.
-- É idempotente (pode rodar de novo sem quebrar).
-- =============================================================================

-- ─── transactions: vínculo real com conta + método + parcelamento ────────────
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installments_total INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_number INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS purchase_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_purchase_group ON transactions(purchase_group_id);

-- Backfill: account_id a partir do prefixo "[Conta: NOME]" na descrição
UPDATE transactions t
SET account_id = a.id
FROM accounts a
WHERE t.account_id IS NULL
  AND a.user_id = t.user_id
  AND t.description ~ '\[Conta:\s*[^\]]+\]'
  AND lower(trim(substring(t.description from '\[Conta:\s*([^\]]+)\]'))) = lower(trim(a.name));

-- Backfill: payment_method a partir dos prefixos existentes
UPDATE transactions SET payment_method = 'PIX'      WHERE payment_method IS NULL AND description ~ '^\[PIX\]';
UPDATE transactions SET payment_method = 'Débito'   WHERE payment_method IS NULL AND description ~ '^\[Débito\]';
UPDATE transactions SET payment_method = 'Dinheiro' WHERE payment_method IS NULL AND description ~ '^\[Dinheiro\]';
UPDATE transactions SET payment_method = 'Cartão'   WHERE payment_method IS NULL AND is_credit_card = true;

-- ─── credit_cards: taxa do rotativo (juros simples ao mês, opcional) ──────────
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(6,3) NOT NULL DEFAULT 0;

-- ─── credit_card_bills: pagamento parcial + rotativo ─────────────────────────
ALTER TABLE credit_card_bills ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE credit_card_bills ADD COLUMN IF NOT EXISTS paid_at TEXT;
ALTER TABLE credit_card_bills ADD COLUMN IF NOT EXISTS rollover_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE credit_card_bills ADD COLUMN IF NOT EXISTS minimum_payment NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Faturas já marcadas como pagas → considera valor quitado integralmente
UPDATE credit_card_bills SET paid_amount = total_amount WHERE is_paid = true AND paid_amount = 0;

-- ─── debts: modelo de parcelas + campos que estavam embutidos no texto ───────
ALTER TABLE debts ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12,2);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(6,3);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS installments_total INTEGER;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS installments_paid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS day_due INTEGER;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_debts_credit_card ON debts(credit_card_id);

-- Backfill: dia de vencimento a partir do fim de due_date (YYYY-MM-DD)
UPDATE debts SET day_due = CAST(substring(due_date from '(\d{1,2})$') AS INTEGER)
WHERE day_due IS NULL AND due_date ~ '\d{1,2}$';

-- Backfill: valor original a partir da tag "[Original: X]" (aceita "1.234,56" ou "1234.56")
DO $$
DECLARE
  r RECORD;
  norm text;
  val numeric;
BEGIN
  FOR r IN
    SELECT id, trim(substring(description from '\[Original:\s*([^\]]+)\]')) AS raw
    FROM debts
    WHERE description ~ '\[Original:' AND original_amount IS NULL
  LOOP
    IF r.raw !~ '^[0-9.,]+$' THEN CONTINUE; END IF;
    IF r.raw ~ ',' THEN
      norm := replace(replace(r.raw, '.', ''), ',', '.');
    ELSE
      norm := r.raw;
    END IF;
    BEGIN
      val := norm::numeric;
    EXCEPTION WHEN others THEN
      CONTINUE;
    END;
    UPDATE debts SET original_amount = val WHERE id = r.id;
  END LOOP;
END $$;

-- ─── debt_payments: histórico de pagamentos (substitui o JSON na descrição) ──
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_at TEXT NOT NULL,
  method TEXT,
  source_name TEXT,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_user ON debt_payments(user_id);

ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own debt_payments" ON debt_payments FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own debt_payments" ON debt_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own debt_payments" ON debt_payments FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own debt_payments" ON debt_payments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill: extrai a lista JSON "[Payments: [...]]" da descrição para linhas reais.
-- Faz por linha, ignorando dívidas cujo JSON esteja corrompido (sem abortar a migração).
DO $$
DECLARE
  r RECORD;
  arr jsonb;
  p jsonb;
BEGIN
  FOR r IN
    SELECT id, user_id,
           substring(description from '\[Payments:\s*(\[.*\])\]') AS raw
    FROM debts
    WHERE description ~ '\[Payments:\s*\['
      AND NOT EXISTS (SELECT 1 FROM debt_payments dp WHERE dp.debt_id = debts.id)
  LOOP
    BEGIN
      arr := r.raw::jsonb;
    EXCEPTION WHEN others THEN
      CONTINUE;
    END;
    IF arr IS NULL OR jsonb_typeof(arr) <> 'array' THEN
      CONTINUE;
    END IF;
    FOR p IN SELECT * FROM jsonb_array_elements(arr)
    LOOP
      INSERT INTO debt_payments (user_id, debt_id, amount, discount, paid_at, method, source_name)
      VALUES (
        r.user_id, r.id,
        COALESCE((p->>'amount')::numeric, 0),
        COALESCE((p->>'discount')::numeric, 0),
        COALESCE(NULLIF(p->>'date', ''), to_char(now(), 'YYYY-MM-DD')),
        p->>'method',
        p->>'accountName'
      );
    END LOOP;
  END LOOP;
END $$;

-- installments_paid = nº de pagamentos registrados
UPDATE debts d
SET installments_paid = (SELECT count(*) FROM debt_payments dp WHERE dp.debt_id = d.id)
WHERE EXISTS (SELECT 1 FROM debt_payments dp WHERE dp.debt_id = d.id);

-- Limpa as tags "[Original: ...]" e "[Payments: ...]" da descrição
UPDATE debts
SET description = NULLIF(trim(
  regexp_replace(
    regexp_replace(description, '\[Payments:\s*\[.*\]\]', '', 'g'),
    '\[Original:\s*[^\]]+\]', '', 'g'
  )
), '')
WHERE description ~ '\[Original:' OR description ~ '\[Payments:';
