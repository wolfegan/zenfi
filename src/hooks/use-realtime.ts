// =============================================================================
// Realtime: mantém as telas 100% sincronizadas com o banco sem precisar de F5.
//
// Abre UM canal do Supabase Realtime por usuário, ouvindo mudanças em todas as
// tabelas do app (filtradas por user_id). Cada mudança incrementa um "tick" da
// tabela; os hooks de dados dependem desse tick e refazem o fetch sozinhos.
//
// Pré-requisito no Supabase (uma vez): habilitar Realtime nessas tabelas —
// ver src/lib/migrations/20260831_realtime.sql
// =============================================================================
import { useEffect, useSyncExternalStore } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const REALTIME_TABLES = [
  "categories",
  "transactions",
  "monthly_budgets",
  "credit_cards",
  "credit_card_bills",
  "debts",
  "debt_payments",
  "investments",
  "accounts",
  "goals",
  "profiles",
] as const;

export type RealtimeTable = (typeof REALTIME_TABLES)[number];

type Ticks = Record<RealtimeTable, number>;

let ticks: Ticks = REALTIME_TABLES.reduce(
  (acc, t) => ({ ...acc, [t]: 0 }),
  {} as Ticks,
);

const listeners = new Set<() => void>();
let channel: ReturnType<typeof supabase.channel> | null = null;
let channelUserId: string | null = null;
let authWatcher: { unsubscribe: () => void } | null = null;
let started = false;

const pending = new Set<RealtimeTable>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  flushTimer = null;
  if (pending.size === 0) return;
  const next = { ...ticks };
  for (const t of pending) next[t] = (next[t] ?? 0) + 1;
  pending.clear();
  ticks = next;
  for (const l of listeners) l();
}

function bump(table: RealtimeTable) {
  pending.add(table);
  if (flushTimer == null) flushTimer = setTimeout(flush, 120);
}

/** Marca todas as tabelas como alteradas — usado ao trocar de usuário. */
function bumpAll() {
  for (const t of REALTIME_TABLES) pending.add(t);
  if (flushTimer == null) flushTimer = setTimeout(flush, 0);
}

async function openChannelForCurrentUser() {
  if (!isSupabaseConfigured()) return;
  if (typeof (supabase as any).channel !== "function") return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id ?? null;

  if (uid === channelUserId && channel) return;

  if (channel) {
    try {
      await supabase.removeChannel(channel);
    } catch {
      // ignore
    }
    channel = null;
  }
  channelUserId = uid;
  if (!uid) return;

  const ch = supabase.channel(`zenfi-rt-${uid}`);
  for (const table of REALTIME_TABLES) {
    ch.on(
      "postgres_changes" as any,
      {
        event: "*",
        schema: "public",
        table,
        filter: table === "profiles" ? `id=eq.${uid}` : `user_id=eq.${uid}`,
      },
      () => bump(table),
    );
  }
  ch.subscribe();
  channel = ch;
}

function start() {
  if (started) return;
  started = true;
  if (!isSupabaseConfigured()) return;

  void openChannelForCurrentUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    bumpAll(); // força todo mundo a refazer o fetch ao (des)logar
    void openChannelForCurrentUser();
  });
  authWatcher = subscription;
}

// Mantido para simetria; o canal vive enquanto a aba estiver aberta.
export function stopRealtime() {
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
  authWatcher?.unsubscribe();
  authWatcher = null;
  started = false;
  channelUserId = null;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  start();
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return ticks;
}

/**
 * Retorna um número que muda sempre que qualquer uma das `tables` sofre
 * INSERT/UPDATE/DELETE no banco. Use nas deps de um useEffect para refazer
 * o fetch automaticamente.
 */
export function useRealtimeTick(...tables: RealtimeTable[]): number {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    start();
  }, []);
  let sum = 0;
  for (const t of tables) sum += all[t] ?? 0;
  return sum;
}
