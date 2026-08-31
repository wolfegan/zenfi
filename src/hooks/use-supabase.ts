import { supabase } from "@/lib/supabase";
import type {
  Category,
  Transaction,
  MonthlyBudget,
  CreditCard,
  CreditCardBill,
  Debt,
  DebtPayment,
  Investment,
  Account,
  Goal,
  CreditCardWithBills,
  MonthlySummary,
  MonthlyEvolution,
  HealthScore,
  DebtsSummary,
  GoalsSummary,
  InvestmentsSummary,
} from "@/lib/supabase-types";
import {
  billMonthForDate,
  billDatesForMonth,
  buildInstallmentRows,
  currentBillMonth,
} from "@/lib/credit-card";
import { useRealtimeTick } from "@/hooks/use-realtime";
import { useCallback, useEffect, useState } from "react";

// =============================================================================
// Helpers
// =============================================================================

function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  return userId;
}

// =============================================================================
// Categories
// =============================================================================

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    const { data: result } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("order", { ascending: true });
    setData(result ?? []);
    setLoading(false);
  }, [userId]);

  const rt = useRealtimeTick("categories");
  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  const create = useCallback(
    async (cat: Omit<Category, "id" | "user_id" | "created_at">) => {
      if (!userId) return null;
      const { count } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      const { data: result } = await supabase
        .from("categories")
        .insert({ user_id: userId, ...cat, order: count ?? 0 })
        .select()
        .single();
      if (result) setData((prev) => [...prev, result]);
      return result;
    },
    [userId],
  );

  const update = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Category, "id" | "user_id" | "created_at">>,
    ) => {
      await supabase.from("categories").update(updates).eq("id", id);
      setData((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    // Also delete related transactions and budgets
    await supabase.from("transactions").delete().eq("category_id", id);
    await supabase.from("monthly_budgets").delete().eq("category_id", id);
    await supabase.from("categories").delete().eq("id", id);
    setData((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { data, loading, create, update, remove, refetch: fetch };
}

export function useCategoriesByType(type: "income" | "expense") {
  const { data } = useCategories();
  return data.filter((c) => c.type === type);
}

// =============================================================================
// Recálculo idempotente das faturas de um cartão.
//
// Em vez de acumular (fatura += valor), recomputa CADA fatura a partir da soma
// das transações daquele ciclo. Isso elimina o "drift" causado por edições,
// exclusões e condições de corrida do modelo anterior (syncCreditCardBill).
// Preserva paid_amount / is_paid / paid_at das faturas existentes.
// =============================================================================
export async function recalcCreditCardBills(userId: string, creditCardId: string) {
  if (!userId || !creditCardId) return;
  try {
    const [{ data: card }, { data: txs }, { data: existing }] =
      await Promise.all([
        supabase.from("credit_cards").select("*").eq("id", creditCardId).single(),
        supabase
          .from("transactions")
          .select("id, amount, date")
          .eq("credit_card_id", creditCardId)
          .eq("is_credit_card", true),
        supabase
          .from("credit_card_bills")
          .select("*")
          .eq("credit_card_id", creditCardId),
      ]);

    if (!card) return;
    const closingDay = card.closing_day || 5;
    const dueDay = card.due_day || 10;

    // soma por mês de fatura (rótulo = mês de vencimento)
    const totals = new Map<string, number>();
    for (const t of txs ?? []) {
      const bm = billMonthForDate(t.date, closingDay, dueDay);
      totals.set(bm, (totals.get(bm) ?? 0) + Number(t.amount));
    }

    const existingByMonth = new Map<string, CreditCardBill>();
    for (const b of existing ?? []) existingByMonth.set(b.month, b);

    // upsert das faturas que têm transações
    for (const [month, total] of totals) {
      const rounded = Math.round(total * 100) / 100;
      const prev = existingByMonth.get(month);
      if (prev) {
        if (Math.abs(Number(prev.total_amount) - rounded) > 0.005) {
          await supabase
            .from("credit_card_bills")
            .update({
              total_amount: rounded,
              is_paid: Number(prev.paid_amount) >= rounded - 0.005 && rounded > 0,
            })
            .eq("id", prev.id);
        }
      } else {
        const { closingDate, dueDate } = billDatesForMonth(
          month,
          closingDay,
          dueDay,
        );
        await supabase.from("credit_card_bills").insert({
          user_id: userId,
          credit_card_id: creditCardId,
          month,
          total_amount: rounded,
          is_paid: false,
          paid_amount: 0,
          due_date: dueDate,
          closing_date: closingDate,
        });
      }
    }

    // remove faturas que ficaram sem transações e sem pagamento registrado
    for (const b of existing ?? []) {
      if (!totals.has(b.month) && Number(b.paid_amount) === 0) {
        await supabase.from("credit_card_bills").delete().eq("id", b.id);
      }
    }
  } catch (err) {
    console.error("Erro ao recalcular faturas do cartão:", err);
  }
}

/** @deprecated use recalcCreditCardBills — mantido para compatibilidade. */
export async function syncCreditCardBill(
  creditCardId: string,
  _dateStr: string,
  _amountChange: number,
  userId: string,
) {
  await recalcCreditCardBills(userId, creditCardId);
}

// =============================================================================
// Transactions
// =============================================================================

export function useTransactions() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick("transactions");

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    const { data: result } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setData(result ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  const getByMonth = useCallback(
    async (month: string) => {
      if (!userId) return [];
      const { data: result } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return (result ?? []).filter((t) => t.date.startsWith(month));
    },
    [userId],
  );

  const getByCreditCard = useCallback(
    async (creditCardId: string, month: string) => {
      const { data: result } = await supabase
        .from("transactions")
        .select("*")
        .eq("credit_card_id", creditCardId);
      return (result ?? []).filter((t) => t.date.startsWith(month));
    },
    [],
  );

  const create = useCallback(
    async (tx: Omit<Transaction, "id" | "user_id" | "created_at">) => {
      if (!userId) return null;
      const { data: result } = await supabase
        .from("transactions")
        .insert({ user_id: userId, ...tx })
        .select()
        .single();
      if (result) {
        setData((prev) => [result, ...prev]);
        if (result.is_credit_card && result.credit_card_id) {
          await recalcCreditCardBills(userId, result.credit_card_id);
        }
      }
      return result;
    },
    [userId],
  );

  /**
   * Cria uma compra parcelada no cartão: gera N linhas de transação
   * (uma por parcela) compartilhando o mesmo purchase_group_id.
   * A parcela 1 cai na data da compra; as demais, mês a mês.
   */
  const createInstallments = useCallback(
    async (params: {
      creditCardId: string;
      categoryId: string;
      total: number;
      count: number;
      purchaseDate: string;
      description?: string | null;
      isFixed?: boolean;
    }) => {
      if (!userId) return null;
      const groupId = crypto.randomUUID();
      const rows = buildInstallmentRows({
        purchaseDate: params.purchaseDate,
        total: params.total,
        count: params.count,
      });
      const baseDesc = (params.description || "").trim();
      const payload = rows.map((r) => ({
        user_id: userId,
        category_id: params.categoryId,
        amount: r.amount,
        date: r.date,
        type: "expense" as const,
        description: baseDesc
          ? `${baseDesc} (${r.installment_number}/${params.count})`
          : `Parcela ${r.installment_number}/${params.count}`,
        is_fixed: params.isFixed ?? false,
        is_credit_card: true,
        credit_card_id: params.creditCardId,
        payment_method: "Cartão",
        installments_total: params.count,
        installment_number: r.installment_number,
        purchase_group_id: groupId,
      }));
      const { data: inserted } = await supabase
        .from("transactions")
        .insert(payload)
        .select();
      if (inserted?.length) {
        setData((prev) => [...inserted, ...prev]);
        await recalcCreditCardBills(userId, params.creditCardId);
      }
      return groupId;
    },
    [userId],
  );

  const update = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Transaction, "id" | "user_id" | "created_at">>,
    ) => {
      if (!userId) return;

      const { data: oldTx } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

      await supabase.from("transactions").update(updates).eq("id", id);

      const cardsToRecalc = new Set<string>();
      if (oldTx?.is_credit_card && oldTx.credit_card_id)
        cardsToRecalc.add(oldTx.credit_card_id);
      const updatedTx = { ...oldTx, ...updates };
      if (updatedTx?.is_credit_card && updatedTx.credit_card_id)
        cardsToRecalc.add(updatedTx.credit_card_id);
      for (const cardId of cardsToRecalc) {
        await recalcCreditCardBills(userId, cardId);
      }

      setData((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );
    },
    [userId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;

      const { data: oldTx } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

      await supabase.from("transactions").delete().eq("id", id);
      setData((prev) => prev.filter((t) => t.id !== id));

      if (oldTx?.is_credit_card && oldTx.credit_card_id) {
        await recalcCreditCardBills(userId, oldTx.credit_card_id);
      }
    },
    [userId],
  );

  /** Remove todas as parcelas de uma compra parcelada. */
  const removeGroup = useCallback(
    async (purchaseGroupId: string) => {
      if (!userId) return;
      const { data: rows } = await supabase
        .from("transactions")
        .select("credit_card_id")
        .eq("purchase_group_id", purchaseGroupId);
      await supabase
        .from("transactions")
        .delete()
        .eq("purchase_group_id", purchaseGroupId);
      setData((prev) =>
        prev.filter((t) => t.purchase_group_id !== purchaseGroupId),
      );
      const cardId = rows?.[0]?.credit_card_id;
      if (cardId) await recalcCreditCardBills(userId, cardId);
    },
    [userId],
  );

  return {
    data,
    loading,
    getByMonth,
    getByCreditCard,
    create,
    createInstallments,
    removeGroup,
    update,
    remove,
    refetch: fetch,
  };
}

// =============================================================================
// Monthly Summary
// =============================================================================

export function useMonthlySummary(month: string) {
  const [data, setData] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick(
    "transactions",
    "monthly_budgets",
    "categories",
  );

  const calc = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    // Fetch everything in parallel
    const [txRes, catRes, budgetRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId),
      supabase.from("categories").select("*").eq("user_id", userId),
      supabase
        .from("monthly_budgets")
        .select("*")
        .eq("user_id", userId)
        .eq("month", month),
    ]);

    const txs = txRes.data ?? [];
    const categories = catRes.data ?? [];
    const budgets = budgetRes.data ?? [];
    const monthTx = txs.filter((t) => t.date.startsWith(month));

    const totalIncome = monthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const totalExpenses = monthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const fixedExpenses = monthTx
      .filter((t) => t.type === "expense" && t.is_fixed)
      .reduce((s, t) => s + t.amount, 0);
    const variableExpenses = monthTx
      .filter((t) => t.type === "expense" && !t.is_fixed)
      .reduce((s, t) => s + t.amount, 0);
    const creditCardExpenses = monthTx
      .filter((t) => t.is_credit_card)
      .reduce((s, t) => s + t.amount, 0);

    const expensesByCategory = categories
      .map((cat) => ({
        category: cat,
        total: monthTx
          .filter((t) => t.category_id === cat.id && t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
      }))
      .filter((c) => c.total > 0);

    const incomeByCategory = categories
      .map((cat) => ({
        category: cat,
        total: monthTx
          .filter((t) => t.category_id === cat.id && t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
      }))
      .filter((c) => c.total > 0);

    const budgetComparisons = budgets.map((budget) => {
      const spent = monthTx
        .filter(
          (t) => t.category_id === budget.category_id && t.type === "expense",
        )
        .reduce((s, t) => s + t.amount, 0);
      return {
        budget,
        spent,
        remaining: budget.amount - spent,
        percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      };
    });

    setData({
      totalIncome,
      totalExpenses,
      fixedExpenses,
      variableExpenses,
      creditCardExpenses,
      balance: totalIncome - totalExpenses,
      savingsRate:
        totalIncome > 0
          ? ((totalIncome - totalExpenses) / totalIncome) * 100
          : 0,
      expensesByCategory,
      incomeByCategory,
      budgetComparisons,
      transactionCount: monthTx.length,
    });
    setLoading(false);
  }, [userId, month]);

  useEffect(() => {
    calc();
  }, [calc, rt]);

  return { data, loading, refetch: calc };
}

// =============================================================================
// Monthly Evolution
// =============================================================================

export function useMonthlyEvolution(months: number) {
  const [data, setData] = useState<MonthlyEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick("transactions");

  const calc = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId);

    const now = new Date();
    const monthLabels: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      );
    }

    const result = monthLabels.map((month) => {
      const monthTx = (txs ?? []).filter((t) => t.date.startsWith(month));
      const income = monthTx
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expenses = monthTx
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      return {
        month,
        label: new Date(month + "-01").toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        income,
        expenses,
        balance: income - expenses,
      };
    });

    setData(result);
    setLoading(false);
  }, [userId, months]);

  useEffect(() => {
    calc();
  }, [calc, rt]);

  return { data, loading, refetch: calc };
}

// =============================================================================
// Financial Health Score
// =============================================================================

export function useFinancialHealthScore() {
  const [data, setData] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick(
    "transactions",
    "monthly_budgets",
    "credit_cards",
    "credit_card_bills",
    "investments",
  );

  const calc = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [txRes, budgetRes, ccRes, invRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId),
      supabase
        .from("monthly_budgets")
        .select("*")
        .eq("user_id", userId)
        .eq("month", currentMonth),
      supabase.from("credit_cards").select("*").eq("user_id", userId),
      supabase.from("investments").select("*").eq("user_id", userId),
    ]);

    const txs = txRes.data ?? [];
    const budgets = budgetRes.data ?? [];
    const creditCards = ccRes.data ?? [];
    const investments = invRes.data ?? [];

    const monthTx = txs.filter((t) => t.date.startsWith(currentMonth));
    const totalIncome = monthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const totalExpenses = monthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    // Savings score
    const savingsRate =
      totalIncome > 0
        ? Math.min((totalIncome - totalExpenses) / totalIncome, 1)
        : 0;
    const savingsScore = savingsRate * 100;

    // Expense score
    const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 1;
    const expenseScore = Math.max(0, (1 - expenseRatio) * 100);

    // Budget score
    let budgetScore = 100;
    if (budgets.length > 0) {
      let totalAdherence = 0;
      for (const budget of budgets) {
        const spent = monthTx
          .filter(
            (t) => t.category_id === budget.category_id && t.type === "expense",
          )
          .reduce((s, t) => s + t.amount, 0);
        totalAdherence += Math.min(
          budget.amount > 0
            ? Math.max(0, 1 - (spent - budget.amount) / budget.amount)
            : 1,
          1,
        );
      }
      budgetScore = (totalAdherence / budgets.length) * 100;
    }

    // Credit score
    let creditScore = 100;
    if (creditCards.length > 0) {
      let totalUtil = 0;
      for (const card of creditCards) {
        const cardTotal = monthTx
          .filter((t) => t.credit_card_id === card.id)
          .reduce((s, t) => s + t.amount, 0);
        const util = card.limit > 0 ? cardTotal / card.limit : 0;
        if (util > 0.5) totalUtil += Math.max(0, 1 - (util - 0.3) / 0.7);
        else if (util < 0.1) totalUtil += util / 0.1;
        else totalUtil += 1;
      }
      creditScore = (totalUtil / creditCards.length) * 100;
    }

    // Investment score
    const totalInvested = investments.reduce((s, i) => s + i.current_value, 0);
    const invScore = Math.min(
      totalIncome > 0 ? (totalInvested / (totalIncome * 12)) * 100 : 0,
      100,
    );

    const finalScore = Math.round(
      savingsScore * 0.25 +
        expenseScore * 0.25 +
        budgetScore * 0.25 +
        creditScore * 0.125 +
        invScore * 0.125,
    );

    let status: HealthScore["status"];
    if (finalScore >= 80) status = "excellent";
    else if (finalScore >= 60) status = "good";
    else if (finalScore >= 40) status = "fair";
    else status = "poor";

    const messages: Record<string, string> = {
      excellent:
        "Você é o orgulho da família! Suas finanças estão tão saudáveis que até o gerente do banco chora de emoção ao ver seu saldo. Já pode pagar o almoço da firma! 💸",
      good: "Saldo positivo! Mas ainda não dá pra gastar tudo em compras aleatórias na internet à meia-noite. Segura o 'eu mereço' no fim de semana! 👍",
      fair: "Seu dinheiro está sumindo mais rápido que folga no meio da semana. A luz amarela acendeu, hora de dar férias para o seu cartão de crédito! ⚠️",
      poor: "S.O.S! Seu extrato bancário está parecendo um filme de terror. Se continuar assim, o Serasa vai te mandar presente de aniversário. Bora fechar a torneira! 🚨",
    };

    setData({
      score: Math.min(Math.max(finalScore, 0), 100),
      status,
      message: messages[status],
      components: {
        savings: { score: Math.round(savingsScore), weight: 25 },
        expenses: { score: Math.round(expenseScore), weight: 25 },
        budget: { score: Math.round(budgetScore), weight: 25 },
        credit: { score: Math.round(creditScore), weight: 12.5 },
        investment: { score: Math.round(invScore), weight: 12.5 },
      },
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    calc();
  }, [calc, rt]);

  return { data, loading, refetch: calc };
}

// =============================================================================
// Budgets
// =============================================================================

export function useBudgets() {
  const [data, setData] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick("monthly_budgets");

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    const { data: result } = await supabase
      .from("monthly_budgets")
      .select("*")
      .eq("user_id", userId);
    setData(result ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  const getByMonth = useCallback(
    async (month: string) => {
      if (!userId) return [];
      const { data: result } = await supabase
        .from("monthly_budgets")
        .select("*")
        .eq("user_id", userId)
        .eq("month", month);
      return result ?? [];
    },
    [userId],
  );

  const setBudget = useCallback(
    async (categoryId: string, month: string, amount: number) => {
      if (!userId) return null;
      // Check if exists
      const { data: existing } = await supabase
        .from("monthly_budgets")
        .select("*")
        .eq("user_id", userId)
        .eq("category_id", categoryId)
        .eq("month", month)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("monthly_budgets")
          .update({ amount })
          .eq("id", existing.id);
        setData((prev) =>
          prev.map((b) => (b.id === existing.id ? { ...b, amount } : b)),
        );
        return existing.id;
      }

      const { data: result } = await supabase
        .from("monthly_budgets")
        .insert({ user_id: userId, category_id: categoryId, month, amount })
        .select()
        .single();
      if (result) setData((prev) => [...prev, result]);
      return result?.id ?? null;
    },
    [userId],
  );

  const remove = useCallback(async (id: string) => {
    await supabase.from("monthly_budgets").delete().eq("id", id);
    setData((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { data, loading, getByMonth, setBudget, remove, refetch: fetch };
}

// =============================================================================
// Credit Cards
// =============================================================================

// Valor em aberto de uma fatura (fatura + rotativo − já pago).
export function billOutstanding(b: CreditCardBill): number {
  if (b.is_paid) return 0;
  return Math.max(
    0,
    Number(b.total_amount) + Number(b.rollover_amount ?? 0) - Number(b.paid_amount ?? 0),
  );
}

export function computeCardStats(
  card: CreditCard,
  bills: CreditCardBill[],
): Omit<CreditCardWithBills, keyof CreditCard | "bills"> {
  const used = bills.reduce((s, b) => s + billOutstanding(b), 0);
  const limit = Number(card.limit) || 0;
  const available = Math.max(0, limit - used);
  const utilization = limit > 0 ? (used / limit) * 100 : 0;
  const curMonth = currentBillMonth(card.closing_day, card.due_day);
  const currentBill = bills.find((b) => b.month === curMonth) ?? null;
  return { used, available, utilization, currentBill };
}

export function useCreditCards() {
  const [data, setData] = useState<CreditCardWithBills[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick("credit_cards", "credit_card_bills");

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    const [{ data: cards }, { data: allBills }] = await Promise.all([
      supabase.from("credit_cards").select("*").eq("user_id", userId),
      supabase.from("credit_card_bills").select("*").eq("user_id", userId),
    ]);

    if (!cards) {
      setData([]);
      setLoading(false);
      return;
    }

    const cardsWithBills: CreditCardWithBills[] = cards.map((card) => {
      const bills = (allBills ?? [])
        .filter((b) => b.credit_card_id === card.id)
        .sort((a, b) => b.month.localeCompare(a.month));
      return { ...card, bills, ...computeCardStats(card, bills) };
    });

    setData(cardsWithBills);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  const create = useCallback(
    async (card: Omit<CreditCard, "id" | "user_id" | "created_at">) => {
      if (!userId) return null;
      const { data: result } = await supabase
        .from("credit_cards")
        .insert({ user_id: userId, ...card })
        .select()
        .single();
      if (result) setData((prev) => [...prev, { ...result, bills: [] }]);
      return result;
    },
    [userId],
  );

  const update = useCallback(
    async (
      id: string,
      updates: Partial<Omit<CreditCard, "id" | "user_id" | "created_at">>,
    ) => {
      await supabase.from("credit_cards").update(updates).eq("id", id);
      setData((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await supabase.from("transactions").delete().eq("credit_card_id", id);
    await supabase.from("credit_card_bills").delete().eq("credit_card_id", id);
    await supabase.from("credit_cards").delete().eq("id", id);
    setData((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const createBill = useCallback(
    async (bill: Omit<CreditCardBill, "id" | "user_id" | "created_at">) => {
      if (!userId) return null;
      const { data: result } = await supabase
        .from("credit_card_bills")
        .insert({ user_id: userId, ...bill })
        .select()
        .single();
      return result;
    },
    [userId],
  );

  const toggleBillPaid = useCallback(async (id: string, isPaid: boolean) => {
    const bill = data
      .flatMap((c) => c.bills)
      .find((b) => b.id === id);
    const total = bill
      ? Number(bill.total_amount) + Number(bill.rollover_amount ?? 0)
      : 0;
    await supabase
      .from("credit_card_bills")
      .update({
        is_paid: isPaid,
        paid_amount: isPaid ? total : 0,
        paid_at: isPaid ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("id", id);
  }, [data]);

  /** Registra um pagamento (total ou parcial) de fatura. */
  const payBill = useCallback(async (id: string, amount: number) => {
    const bill = data.flatMap((c) => c.bills).find((b) => b.id === id);
    if (!bill) return;
    const total = Number(bill.total_amount) + Number(bill.rollover_amount ?? 0);
    const newPaid = Math.min(total, Number(bill.paid_amount ?? 0) + amount);
    await supabase
      .from("credit_card_bills")
      .update({
        paid_amount: newPaid,
        is_paid: newPaid >= total - 0.005,
        paid_at: new Date().toISOString().split("T")[0],
      })
      .eq("id", id);
  }, [data]);

  const deleteBill = useCallback(async (id: string) => {
    await supabase.from("credit_card_bills").delete().eq("id", id);
  }, []);

  return {
    data,
    loading,
    create,
    update,
    remove,
    createBill,
    toggleBillPaid,
    payBill,
    deleteBill,
    refetch: fetch,
  };
}

// =============================================================================
// Investments
// =============================================================================

export function useInvestments() {
  const [data, setData] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick("investments");

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    const { data: result } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", userId);
    setData(result ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  const getSummary =
    useCallback(async (): Promise<InvestmentsSummary | null> => {
      if (!userId) return null;
      const { data: investments } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", userId);
      if (!investments) return null;
      const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
      const totalCurrentValue = investments.reduce(
        (s, i) => s + i.current_value,
        0,
      );
      const totalReturn = totalCurrentValue - totalInvested;
      return {
        totalInvested,
        totalCurrentValue,
        totalReturn,
        returnPercentage:
          totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0,
        count: investments.length,
      };
    }, [userId]);

  const create = useCallback(
    async (inv: Omit<Investment, "id" | "user_id" | "created_at">) => {
      if (!userId) return null;
      const { data: result } = await supabase
        .from("investments")
        .insert({ user_id: userId, ...inv })
        .select()
        .single();
      if (result) setData((prev) => [...prev, result]);
      return result;
    },
    [userId],
  );

  const update = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Investment, "id" | "user_id" | "created_at">>,
    ) => {
      await supabase.from("investments").update(updates).eq("id", id);
      setData((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      );
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await supabase.from("investments").delete().eq("id", id);
    setData((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { data, loading, getSummary, create, update, remove, refetch: fetch };
}

// =============================================================================
// Debts
// =============================================================================

export function summarizeDebts(debts: Debt[]): DebtsSummary {
  const totalOwed = debts.reduce((s, d) => s + Number(d.total_amount), 0);
  const totalRemaining = debts.reduce(
    (s, d) => s + Number(d.remaining_amount),
    0,
  );
  const totalMonthly = debts
    .filter((d) => !d.is_paid)
    .reduce((s, d) => s + Number(d.monthly_payment), 0);
  const onCard = debts.filter((d) => !d.is_paid && d.credit_card_id);
  const totalRemainingOnCard = onCard.reduce(
    (s, d) => s + Number(d.remaining_amount),
    0,
  );
  return {
    totalOwed,
    totalRemaining,
    totalPaid: totalOwed - totalRemaining,
    totalMonthly,
    totalRemainingOnCard,
    totalRemainingStandalone: debts
      .filter((d) => !d.is_paid && !d.credit_card_id)
      .reduce((s, d) => s + Number(d.remaining_amount), 0),
    activeCount: debts.filter((d) => !d.is_paid).length,
    paidCount: debts.filter((d) => d.is_paid).length,
    count: debts.length,
  };
}

export function useDebts() {
  const [data, setData] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick("debts");

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    const { data: result } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setData(result ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  const getActive = useCallback(async () => {
    if (!userId) return [];
    const { data: result } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_paid", false)
      .order("created_at", { ascending: false });
    return result ?? [];
  }, [userId]);

  // Deriva o resumo dos dados já carregados (sem novo fetch).
  const getSummary = useCallback(
    async (): Promise<DebtsSummary | null> => {
      if (!userId) return null;
      return summarizeDebts(data);
    },
    [userId, data],
  );

  const create = useCallback(
    async (debt: Omit<Debt, "id" | "user_id" | "is_paid" | "created_at">) => {
      if (!userId) return null;
      const { data: result } = await supabase
        .from("debts")
        .insert({ user_id: userId, is_paid: false, ...debt })
        .select()
        .single();
      if (result) setData((prev) => [result, ...prev]);
      return result;
    },
    [userId],
  );

  const update = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Debt, "id" | "user_id" | "created_at">>,
    ) => {
      await supabase.from("debts").update(updates).eq("id", id);
      setData((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      );
    },
    [],
  );

  const markAsPaid = useCallback(
    async (id: string) => {
      const debt = data.find((d) => d.id === id);
      const patch: Partial<Debt> = {
        is_paid: true,
        remaining_amount: 0,
        installments_paid: debt?.installments_total ?? debt?.installments_paid ?? 0,
      };
      await supabase.from("debts").update(patch).eq("id", id);
      setData((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      );
    },
    [data],
  );

  const payInstallment = useCallback(
    async (id: string, amount: number) => {
      const debt = data.find((d) => d.id === id);
      if (!debt) return;
      const newRemaining = Math.max(0, Number(debt.remaining_amount) - amount);
      const paid = newRemaining <= 0.005;
      const donePaid = (debt.installments_paid ?? 0) + 1;
      const patch: Partial<Debt> = {
        remaining_amount: newRemaining,
        is_paid: paid,
        installments_paid: paid
          ? debt.installments_total ?? donePaid
          : Math.min(donePaid, debt.installments_total ?? donePaid),
      };
      await supabase.from("debts").update(patch).eq("id", id);
      setData((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      );
    },
    [data],
  );

  /**
   * Registra um pagamento na tabela debt_payments e abate o saldo da dívida.
   * `deduction` = valor pago + desconto (o que sai do saldo devedor).
   */
  const recordPayment = useCallback(
    async (
      debtId: string,
      p: {
        amount: number;
        discount?: number;
        paidAt?: string;
        method?: string | null;
        sourceName?: string | null;
        transactionId?: string | null;
      },
    ) => {
      if (!userId) return;
      const discount = p.discount ?? 0;
      await supabase.from("debt_payments").insert({
        user_id: userId,
        debt_id: debtId,
        amount: p.amount,
        discount,
        paid_at: p.paidAt ?? new Date().toISOString().split("T")[0],
        method: p.method ?? null,
        source_name: p.sourceName ?? null,
        transaction_id: p.transactionId ?? null,
      });
      const debt = data.find((d) => d.id === debtId);
      if (!debt) return;
      const deduction = p.amount + discount;
      if (deduction >= Number(debt.remaining_amount) - 0.005) {
        await markAsPaid(debtId);
      } else {
        await payInstallment(debtId, deduction);
      }
    },
    [userId, data, markAsPaid, payInstallment],
  );

  const remove = useCallback(async (id: string) => {
    await supabase.from("debts").delete().eq("id", id);
    setData((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return {
    data,
    loading,
    getActive,
    getSummary,
    summary: summarizeDebts(data),
    create,
    update,
    markAsPaid,
    payInstallment,
    recordPayment,
    remove,
    refetch: fetch,
  };
}

// =============================================================================
// Debt Payments (histórico)
// =============================================================================

export function useDebtPayments(debtId: string | null) {
  const [data, setData] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const rt = useRealtimeTick("debt_payments");

  const fetch = useCallback(async () => {
    if (!debtId) {
      setData([]);
      setLoading(false);
      return;
    }
    const { data: result } = await supabase
      .from("debt_payments")
      .select("*")
      .eq("debt_id", debtId)
      .order("paid_at", { ascending: true });
    setData(result ?? []);
    setLoading(false);
  }, [debtId]);

  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  return { data, loading, refetch: fetch };
}

/** Todos os pagamentos de dívida do usuário, agrupados por debt_id. */
export function useAllDebtPayments() {
  const [byDebt, setByDebt] = useState<Record<string, DebtPayment[]>>({});
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick("debt_payments", "debts");

  const fetch = useCallback(async () => {
    if (!userId) {
      setByDebt({});
      setLoading(false);
      return;
    }
    const { data: rows } = await supabase
      .from("debt_payments")
      .select("*")
      .eq("user_id", userId)
      .order("paid_at", { ascending: true });
    const grouped: Record<string, DebtPayment[]> = {};
    for (const r of rows ?? []) {
      (grouped[r.debt_id] ??= []).push(r);
    }
    setByDebt(grouped);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  return { byDebt, loading, refetch: fetch };
}

// =============================================================================
// Goals
// =============================================================================

export function useGoals() {
  const [data, setData] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick("goals");

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    const { data: result } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setData(result ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  const getActive = useCallback(async () => {
    if (!userId) return [];
    const { data: result } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("is_achieved", false)
      .order("created_at", { ascending: false });
    return result ?? [];
  }, [userId]);

  const getSummary = useCallback(async (): Promise<GoalsSummary | null> => {
    if (!userId) return null;
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId);
    if (!goals) return null;
    const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
    const totalCurrent = goals.reduce((s, g) => s + g.current_amount, 0);
    const activeGoals = goals.filter((g) => !g.is_achieved).length;
    const achievedGoals = goals.filter((g) => g.is_achieved).length;
    return {
      totalTarget,
      totalCurrent,
      totalProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
      activeGoals,
      achievedGoals,
      count: goals.length,
    };
  }, [userId]);

  const create = useCallback(
    async (
      goal: Omit<Goal, "id" | "user_id" | "is_achieved" | "created_at">,
    ) => {
      if (!userId) return null;
      const { data: result } = await supabase
        .from("goals")
        .insert({ user_id: userId, is_achieved: false, ...goal })
        .select()
        .single();
      if (result) setData((prev) => [result, ...prev]);
      return result;
    },
    [userId],
  );

  const update = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Goal, "id" | "user_id" | "created_at">>,
    ) => {
      await supabase.from("goals").update(updates).eq("id", id);
      setData((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      );
    },
    [],
  );

  const markAsAchieved = useCallback(
    async (id: string) => {
      const goal = data.find((g) => g.id === id);
      if (!goal) return;
      await supabase
        .from("goals")
        .update({ is_achieved: true, current_amount: goal.target_amount })
        .eq("id", id);
      setData((prev) =>
        prev.map((g) =>
          g.id === id
            ? { ...g, is_achieved: true, current_amount: g.target_amount }
            : g,
        ),
      );
    },
    [data],
  );

  const contribute = useCallback(
    async (id: string, amount: number) => {
      const goal = data.find((g) => g.id === id);
      if (!goal) return;
      const newCurrent = Math.min(
        goal.current_amount + amount,
        goal.target_amount,
      );
      await supabase
        .from("goals")
        .update({
          current_amount: newCurrent,
          is_achieved: newCurrent >= goal.target_amount,
        })
        .eq("id", id);
      setData((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                current_amount: newCurrent,
                is_achieved: newCurrent >= goal.target_amount,
              }
            : g,
        ),
      );
    },
    [data],
  );

  const remove = useCallback(async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    setData((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return {
    data,
    loading,
    getActive,
    getSummary,
    create,
    update,
    markAsAchieved,
    contribute,
    remove,
    refetch: fetch,
  };
}

// =============================================================================
// Accounts
// =============================================================================

export function useAccounts() {
  const [data, setData] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const rt = useRealtimeTick("accounts");

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    const { data: result } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setData(result ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch, rt]);

  const getTotalBalance = useCallback(async () => {
    if (!userId) return 0;
    const { data: accounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId);
    return (accounts ?? []).reduce((s, a) => s + a.balance, 0);
  }, [userId]);

  const create = useCallback(
    async (acc: Omit<Account, "id" | "user_id" | "created_at">) => {
      if (!userId) return null;
      const { data: result } = await supabase
        .from("accounts")
        .insert({ user_id: userId, ...acc })
        .select()
        .single();
      if (result) setData((prev) => [result, ...prev]);
      return result;
    },
    [userId],
  );

  const update = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Account, "id" | "user_id" | "created_at">>,
    ) => {
      await supabase.from("accounts").update(updates).eq("id", id);
      setData((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await supabase.from("accounts").delete().eq("id", id);
    setData((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    data,
    loading,
    getTotalBalance,
    create,
    update,
    remove,
    refetch: fetch,
  };
}

// =============================================================================
// Reset Account Helper
// =============================================================================

export async function resetUserAccountData(userId: string) {
  if (!userId) return;

  try {
    // 1. Get user's credit cards to delete their bills
    const { data: cards } = await supabase
      .from("credit_cards")
      .select("id")
      .eq("user_id", userId);

    if (cards && cards.length > 0) {
      const cardIds = cards.map((c) => c.id);
      await supabase.from("credit_card_bills").delete().in("card_id", cardIds);
    }

    // 2. Delete all user records from dependent tables
    await Promise.all([
      supabase.from("transactions").delete().eq("user_id", userId),
      supabase.from("credit_cards").delete().eq("user_id", userId),
      supabase.from("debts").delete().eq("user_id", userId),
      supabase.from("investments").delete().eq("user_id", userId),
      supabase.from("goals").delete().eq("user_id", userId),
      supabase.from("monthly_budgets").delete().eq("user_id", userId),
      supabase.from("accounts").delete().eq("user_id", userId),
      supabase.from("categories").delete().eq("user_id", userId),
    ]);

    // 3. Reset profile onboarding status and goals
    await supabase
      .from("profiles")
      .update({
        onboarding_completed: false,
        monthly_income: null,
        financial_goal: null,
      })
      .eq("id", userId);

    // 4. Clear local storage flags
    if (typeof window !== "undefined") {
      localStorage.removeItem("onboarding-dismissed");
    }
  } catch (err) {
    console.error("Error resetting account data:", err);
    throw err;
  }
}
