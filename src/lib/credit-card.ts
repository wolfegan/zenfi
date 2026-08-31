// =============================================================================
// Lógica de ciclo de fatura de cartão de crédito e parcelamento.
// Tudo baseado em strings "YYYY-MM" / "YYYY-MM-DD" para evitar bugs de timezone.
// =============================================================================

export function ymParts(ym: string): { y: number; m: number } {
  const [y, m] = ym.split("-").map(Number);
  return { y, m };
}

export function ym(y: number, m: number): string {
  // normaliza mês para o range 1..12
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function addMonthsYm(month: string, delta: number): string {
  const { y, m } = ymParts(month);
  return ym(y, m + delta);
}

export function lastDayOfMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/**
 * Soma `n` meses a uma data YYYY-MM-DD, mantendo o dia (limitado ao último
 * dia do mês de destino). Usado para gerar as datas das parcelas.
 */
export function addMonthsToDate(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = ym(y, m + n);
  const { y: ty, m: tm } = ymParts(target);
  const day = Math.min(d, lastDayOfMonth(ty, tm));
  return `${target}-${String(day).padStart(2, "0")}`;
}

/**
 * Dado o dia da compra + dia de fechamento + dia de vencimento, retorna o
 * rótulo da fatura (YYYY-MM) — que corresponde ao MÊS DE VENCIMENTO da fatura.
 *
 * Regra:
 *  - compras com dia <= fechamento entram na fatura que fecha neste mês;
 *    dia > fechamento entram na fatura que fecha no mês seguinte.
 *  - se vencimento > fechamento, a fatura vence no mesmo mês em que fecha;
 *    caso contrário, vence no mês seguinte ao fechamento.
 */
export function billMonthForDate(
  dateStr: string,
  closingDay: number,
  dueDay: number,
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  let closeMonth = ym(y, m);
  if (d > closingDay) closeMonth = addMonthsYm(closeMonth, 1);
  return dueDay > closingDay ? closeMonth : addMonthsYm(closeMonth, 1);
}

/**
 * Inverso de billMonthForDate: dado o rótulo (mês de vencimento) da fatura,
 * retorna as datas de fechamento e vencimento.
 */
export function billDatesForMonth(
  billMonth: string,
  closingDay: number,
  dueDay: number,
): { closingDate: string; dueDate: string } {
  const safeDue = Math.min(Math.max(dueDay, 1), 28);
  const safeClose = Math.min(Math.max(closingDay, 1), 28);
  const dueDate = `${billMonth}-${String(safeDue).padStart(2, "0")}`;
  const closeMonth =
    dueDay > closingDay ? billMonth : addMonthsYm(billMonth, -1);
  const closingDate = `${closeMonth}-${String(safeClose).padStart(2, "0")}`;
  return { closingDate, dueDate };
}

/** Mês de vencimento da fatura em aberto "atual" para a data de referência. */
export function currentBillMonth(
  closingDay: number,
  dueDay: number,
  ref: Date = new Date(),
): string {
  const today = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}-${String(ref.getDate()).padStart(2, "0")}`;
  return billMonthForDate(today, closingDay, dueDay);
}

/**
 * Divide um valor total em `count` parcelas inteiras em centavos.
 * O resto de centavos é somado às primeiras parcelas (padrão brasileiro:
 * a 1ª parcela costuma ser a maior).
 */
export function splitInstallments(total: number, count: number): number[] {
  const n = Math.max(1, Math.floor(count));
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const arr = new Array(n).fill(base);
  const remainder = cents - base * n;
  for (let i = 0; i < remainder; i++) arr[i] += 1;
  return arr.map((c) => c / 100);
}

/**
 * Gera as linhas de parcela para uma compra parcelada no cartão.
 * A parcela 1 cai na data da compra; as demais, mês a mês.
 */
export function buildInstallmentRows(params: {
  purchaseDate: string;
  total: number;
  count: number;
}): Array<{ date: string; amount: number; installment_number: number }> {
  const { purchaseDate, total, count } = params;
  const amounts = splitInstallments(total, count);
  return amounts.map((amount, i) => ({
    date: addMonthsToDate(purchaseDate, i),
    amount,
    installment_number: i + 1,
  }));
}

/** Formata "3/12" para exibição. */
export function installmentLabel(
  number?: number | null,
  total?: number | null,
): string | null {
  if (!number || !total || total <= 1) return null;
  return `${number}/${total}`;
}
