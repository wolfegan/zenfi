// =============================================================================
// Lógica de dívidas / crediários: cronograma de parcelas e vencimentos.
// =============================================================================
import { addMonthsToDate, lastDayOfMonth } from "./credit-card.ts";
import type { Debt } from "./supabase-types.ts";

function withDay(dateStr: string, day: number): string {
  const [y, m] = dateStr.split("-").map(Number);
  const d = Math.min(day, lastDayOfMonth(y, m));
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayStr(ref: Date): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}-${String(ref.getDate()).padStart(2, "0")}`;
}

/** Dia de vencimento mensal da dívida (day_due, senão o dia do due_date). */
export function debtDueDay(debt: Pick<Debt, "day_due" | "due_date">): number {
  if (debt.day_due && debt.day_due >= 1 && debt.day_due <= 31)
    return debt.day_due;
  const tail = (debt.due_date || "").match(/(\d{1,2})$/);
  return tail ? Number(tail[1]) : 1;
}

/**
 * Vencimento da PRÓXIMA parcela em aberto.
 * Base = start_date + (parcelas já pagas) meses, no dia de vencimento.
 * Cai para due_date quando não há cronograma.
 */
export function debtNextDue(
  debt: Pick<
    Debt,
    | "day_due"
    | "due_date"
    | "start_date"
    | "installments_paid"
    | "installments_total"
    | "is_paid"
  >,
  ref: Date = new Date(),
): { date: string; overdue: boolean; daysUntil: number } {
  const day = debtDueDay(debt);
  const paid = debt.installments_paid ?? 0;
  let date: string;
  if (debt.start_date) {
    date = addMonthsToDate(withDay(debt.start_date, day), paid);
  } else {
    date = debt.due_date;
  }
  const today = todayStr(ref);
  const daysUntil = Math.ceil(
    (new Date(date + "T00:00:00").getTime() -
      new Date(today + "T00:00:00").getTime()) /
      86400000,
  );
  return { date, overdue: !debt.is_paid && daysUntil < 0, daysUntil };
}

/** Progresso por parcela (0..1) quando há cronograma, senão por valor. */
export function debtProgress(
  debt: Pick<
    Debt,
    | "installments_total"
    | "installments_paid"
    | "total_amount"
    | "remaining_amount"
  >,
): number {
  if (debt.installments_total && debt.installments_total > 0) {
    return Math.min(
      1,
      (debt.installments_paid ?? 0) / debt.installments_total,
    );
  }
  const total = Number(debt.total_amount) || 0;
  if (total <= 0) return 0;
  return Math.min(1, (total - Number(debt.remaining_amount)) / total);
}

/** Rótulo "parcela 3 de 12" quando aplicável. */
export function debtInstallmentLabel(
  debt: Pick<Debt, "installments_total" | "installments_paid" | "is_paid">,
): string | null {
  const total = debt.installments_total;
  if (!total || total <= 1) return null;
  const paid = debt.installments_paid ?? 0;
  if (debt.is_paid) return `${total}/${total} quitado`;
  return `parcela ${Math.min(paid + 1, total)} de ${total}`;
}
