-- =============================================================================
-- Migração 2026-08-31 (parte 2) — habilita Supabase Realtime
--
-- Faz as telas se atualizarem sozinhas (sem F5) quando os dados mudam.
-- Rode UMA VEZ no Supabase → SQL Editor → New Query. Idempotente.
-- =============================================================================

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'categories','transactions','monthly_budgets','credit_cards',
    'credit_card_bills','debts','debt_payments','investments','accounts','goals','profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- adiciona a tabela à publicação de realtime, se ainda não estiver
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;

    -- REPLICA IDENTITY FULL: garante que eventos de DELETE tragam o user_id
    -- (necessário para o filtro user_id=eq.<id> funcionar em exclusões)
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
  END LOOP;
END $$;
