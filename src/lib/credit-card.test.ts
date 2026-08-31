// Testes das funções puras de ciclo de fatura / parcelamento e de dívidas.
// Rode com:  npm test   (usa o runner nativo do Node)
import test from "node:test";
import assert from "node:assert/strict";
import {
  ym,
  addMonthsYm,
  addMonthsToDate,
  billMonthForDate,
  billDatesForMonth,
  currentBillMonth,
  splitInstallments,
  buildInstallmentRows,
  installmentLabel,
  applyRotativo,
} from "./credit-card.ts";
import { debtNextDue, debtProgress, debtInstallmentLabel } from "./debt.ts";

test("ym normaliza mês fora do intervalo", () => {
  assert.equal(ym(2026, 13), "2027-01");
  assert.equal(ym(2026, 0), "2025-12");
  assert.equal(ym(2026, 25), "2028-01");
  assert.equal(ym(2026, -1), "2025-11");
});

test("addMonthsYm", () => {
  assert.equal(addMonthsYm("2026-11", 3), "2027-02");
  assert.equal(addMonthsYm("2026-01", -2), "2025-11");
});

test("addMonthsToDate limita ao último dia do mês", () => {
  assert.equal(addMonthsToDate("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonthsToDate("2024-01-31", 1), "2024-02-29"); // bissexto
  assert.equal(addMonthsToDate("2026-01-15", 2), "2026-03-15");
  assert.equal(addMonthsToDate("2026-12-10", 1), "2027-01-10");
});

test("billMonthForDate — fecha dia 5, vence dia 10 (vencimento no mesmo mês do fechamento)", () => {
  // compra antes do fechamento → fatura fecha neste mês, vence neste mês
  assert.equal(billMonthForDate("2026-03-03", 5, 10), "2026-03");
  // compra no dia do fechamento → ainda entra nesta fatura
  assert.equal(billMonthForDate("2026-03-05", 5, 10), "2026-03");
  // compra depois do fechamento → próxima fatura
  assert.equal(billMonthForDate("2026-03-06", 5, 10), "2026-04");
  assert.equal(billMonthForDate("2026-03-20", 5, 10), "2026-04");
});

test("billMonthForDate — fecha dia 25, vence dia 5 do mês seguinte", () => {
  // vencimento <= fechamento → fatura vence no mês seguinte ao fechamento
  assert.equal(billMonthForDate("2026-03-20", 25, 5), "2026-04");
  assert.equal(billMonthForDate("2026-03-26", 25, 5), "2026-05");
  // virada de ano
  assert.equal(billMonthForDate("2026-12-28", 25, 5), "2027-02");
});

test("billDatesForMonth é inverso coerente de billMonthForDate", () => {
  const closing = 5;
  const due = 10;
  const { closingDate, dueDate } = billDatesForMonth("2026-04", closing, due);
  assert.equal(dueDate, "2026-04-10");
  assert.equal(closingDate, "2026-04-05");
  // compra até o fechamento → nesta fatura; depois → próxima
  assert.equal(billMonthForDate("2026-04-04", closing, due), "2026-04");
  assert.equal(billMonthForDate("2026-04-06", closing, due), "2026-05");
});

test("billDatesForMonth — fecha 25 / vence 5", () => {
  const { closingDate, dueDate } = billDatesForMonth("2026-04", 25, 5);
  assert.equal(dueDate, "2026-04-05");
  assert.equal(closingDate, "2026-03-25");
});

test("currentBillMonth usa a data de referência", () => {
  const ref = new Date(2026, 2, 3); // 03/03/2026
  assert.equal(currentBillMonth(5, 10, ref), "2026-03");
  const ref2 = new Date(2026, 2, 15);
  assert.equal(currentBillMonth(5, 10, ref2), "2026-04");
});

const sumCents = (arr: number[]) =>
  Math.round(arr.reduce((s, x) => s + x, 0) * 100);

test("splitInstallments soma exatamente o total e distribui os centavos", () => {
  const a = splitInstallments(100, 3);
  assert.deepEqual(a, [33.34, 33.33, 33.33]);
  assert.equal(sumCents(a), 10000);

  assert.equal(sumCents(splitInstallments(1000, 7)), 100000);
  assert.equal(sumCents(splitInstallments(999.97, 13)), 99997);

  assert.deepEqual(splitInstallments(50, 1), [50]);
});

test("buildInstallmentRows gera datas mês a mês a partir da compra", () => {
  const rows = buildInstallmentRows({
    purchaseDate: "2026-01-31",
    total: 300,
    count: 3,
  });
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((r) => r.date),
    ["2026-01-31", "2026-02-28", "2026-03-31"],
  );
  assert.deepEqual(
    rows.map((r) => r.installment_number),
    [1, 2, 3],
  );
  assert.equal(sumCents(rows.map((r) => r.amount)), 30000);
});

test("installmentLabel", () => {
  assert.equal(installmentLabel(3, 12), "3/12");
  assert.equal(installmentLabel(1, 1), null);
  assert.equal(installmentLabel(null, 12), null);
});

// ─── rotativo ───────────────────────────────────────────────────────────────

test("applyRotativo — sem juros (taxa 0): faturas independentes, nada rola", () => {
  const { patches, carryoverTail } = applyRotativo(
    [
      { month: "2026-01", total_amount: 500, paid_amount: 0, due_date: "2026-01-10" },
      { month: "2026-02", total_amount: 300, paid_amount: 0, due_date: "2026-02-10" },
    ],
    0,
    "2026-03-01",
  );
  assert.equal(carryoverTail, 0);
  assert.equal(patches[0].rolled_forward, false);
  assert.equal(patches[0].outstanding, 500);
  assert.equal(patches[1].rollover_amount, 0);
  assert.equal(patches[1].outstanding, 300);
});

test("applyRotativo — fatura vencida e não paga rola com juros para a próxima", () => {
  const { patches } = applyRotativo(
    [
      // vencida em 10/01, hoje é 20/02, nada pago → rola
      { month: "2026-01", total_amount: 1000, paid_amount: 0, due_date: "2026-01-10" },
      { month: "2026-02", total_amount: 200, paid_amount: 0, due_date: "2026-02-25" },
    ],
    10, // 10% a.m.
    "2026-02-20",
  );
  assert.equal(patches[0].rolled_forward, true);
  assert.equal(patches[0].outstanding, 0);
  // 1000 + 10% = 1100 vai para fevereiro
  assert.equal(patches[1].rollover_amount, 1100);
  assert.equal(patches[1].rolled_forward, false); // fev ainda não venceu
  assert.equal(patches[1].effectiveTotal, 1300);
  assert.equal(patches[1].outstanding, 1300);
});

test("applyRotativo — pagamento parcial: só o saldo rola", () => {
  const { patches } = applyRotativo(
    [
      { month: "2026-01", total_amount: 1000, paid_amount: 600, due_date: "2026-01-10" },
      { month: "2026-02", total_amount: 0, paid_amount: 0, due_date: "2026-02-25" },
    ],
    10,
    "2026-02-20",
  );
  // saldo 400 + 10% = 440
  assert.equal(patches[1].rollover_amount, 440);
});

test("applyRotativo — última fatura vencida e não paga vira carryoverTail", () => {
  const { patches, carryoverTail } = applyRotativo(
    [
      { month: "2026-01", total_amount: 500, paid_amount: 0, due_date: "2026-01-10" },
    ],
    10,
    "2026-02-20",
  );
  assert.equal(patches[0].rolled_forward, true);
  assert.equal(carryoverTail, 550); // 500 + 10%
});

test("applyRotativo — compounding mês a mês em duas faturas vencidas", () => {
  const { patches, carryoverTail } = applyRotativo(
    [
      { month: "2026-01", total_amount: 1000, paid_amount: 0, due_date: "2026-01-10" },
      { month: "2026-02", total_amount: 0, paid_amount: 0, due_date: "2026-02-10" },
    ],
    10,
    "2026-03-20",
  );
  // jan: 1000 → 1100 rola pra fev
  // fev: 0 + 1100 = 1100, vencida → 1100 * 1.1 = 1210 vira tail
  assert.equal(patches[0].rolled_forward, true);
  assert.equal(patches[1].rollover_amount, 1100);
  assert.equal(patches[1].rolled_forward, true);
  assert.equal(carryoverTail, 1210);
});

test("applyRotativo é idempotente (rodar de novo dá o mesmo resultado)", () => {
  const bills = [
    { month: "2026-01", total_amount: 1000, paid_amount: 200, due_date: "2026-01-10" },
    { month: "2026-02", total_amount: 300, paid_amount: 0, due_date: "2026-02-25" },
  ];
  const a = applyRotativo(bills, 8, "2026-02-15");
  const b = applyRotativo(bills, 8, "2026-02-15");
  assert.deepEqual(a, b);
});

// ─── debt.ts ────────────────────────────────────────────────────────────────

test("debtNextDue — sem parcelas pagas cai no start_date", () => {
  const ref = new Date(2026, 0, 1); // 01/01/2026
  const r = debtNextDue(
    {
      day_due: 10,
      due_date: "2026-01-10",
      start_date: "2026-01-10",
      installments_paid: 0,
      installments_total: 12,
      is_paid: false,
    },
    ref,
  );
  assert.equal(r.date, "2026-01-10");
  assert.equal(r.overdue, false);
  assert.equal(r.daysUntil, 9);
});

test("debtNextDue — avança conforme parcelas pagas", () => {
  const ref = new Date(2026, 3, 15); // 15/04/2026
  const r = debtNextDue(
    {
      day_due: 10,
      due_date: "2026-01-10",
      start_date: "2026-01-10",
      installments_paid: 3, // pagou jan, fev, mar → próxima é abr/10
      installments_total: 12,
      is_paid: false,
    },
    ref,
  );
  assert.equal(r.date, "2026-04-10");
  assert.equal(r.overdue, true); // 10/04 já passou em 15/04
  assert.ok(r.daysUntil < 0);
});

test("debtNextDue — dívida quitada nunca fica em atraso", () => {
  const ref = new Date(2027, 0, 1);
  const r = debtNextDue(
    {
      day_due: 10,
      due_date: "2026-01-10",
      start_date: "2026-01-10",
      installments_paid: 12,
      installments_total: 12,
      is_paid: true,
    },
    ref,
  );
  assert.equal(r.overdue, false);
});

test("debtProgress — por parcela quando há cronograma, senão por valor", () => {
  assert.equal(
    debtProgress({
      installments_total: 12,
      installments_paid: 3,
      total_amount: 1200,
      remaining_amount: 900,
    }),
    0.25,
  );
  assert.equal(
    debtProgress({
      installments_total: null,
      installments_paid: 0,
      total_amount: 1000,
      remaining_amount: 250,
    }),
    0.75,
  );
});

test("debtInstallmentLabel", () => {
  assert.equal(
    debtInstallmentLabel({
      installments_total: 12,
      installments_paid: 3,
      is_paid: false,
    }),
    "parcela 4 de 12",
  );
  assert.equal(
    debtInstallmentLabel({
      installments_total: 12,
      installments_paid: 12,
      is_paid: true,
    }),
    "12/12 quitado",
  );
  assert.equal(
    debtInstallmentLabel({
      installments_total: null,
      installments_paid: 0,
      is_paid: false,
    }),
    null,
  );
});
