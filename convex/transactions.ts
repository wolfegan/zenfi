import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return [];

    return await ctx.db
      .query("transactions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const getByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return [];

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return transactions.filter((t) => t.date.startsWith(args.month));
  },
});

export const getByDateRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return [];

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return transactions.filter(
      (t) => t.date >= args.startDate && t.date <= args.endDate,
    );
  },
});

export const getByCreditCard = query({
  args: { creditCardId: v.id("creditCards"), month: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("creditCardId", (q) => q.eq("creditCardId", args.creditCardId))
      .collect();

    return transactions.filter((t) => t.date.startsWith(args.month));
  },
});

export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    amount: v.number(),
    date: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    description: v.optional(v.string()),
    isFixed: v.boolean(),
    isCreditCard: v.boolean(),
    creditCardId: v.optional(v.id("creditCards")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("transactions", {
      userId: user._id,
      categoryId: args.categoryId,
      amount: args.amount,
      date: args.date,
      type: args.type,
      description: args.description,
      isFixed: args.isFixed,
      isCreditCard: args.isCreditCard,
      creditCardId: args.creditCardId,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    categoryId: v.optional(v.id("categories")),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    description: v.optional(v.string()),
    isFixed: v.optional(v.boolean()),
    isCreditCard: v.optional(v.boolean()),
    creditCardId: v.optional(v.id("creditCards")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});

// Dashboard summary data
export const getMonthlySummary = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return null;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const monthTx = transactions.filter((t) => t.date.startsWith(args.month));

    const totalIncome = monthTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthTx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const fixedExpenses = monthTx
      .filter((t) => t.type === "expense" && t.isFixed)
      .reduce((sum, t) => sum + t.amount, 0);

    const variableExpenses = monthTx
      .filter((t) => t.type === "expense" && !t.isFixed)
      .reduce((sum, t) => sum + t.amount, 0);

    const creditCardExpenses = monthTx
      .filter((t) => t.isCreditCard)
      .reduce((sum, t) => sum + t.amount, 0);

    // Expenses by category
    const categories = await ctx.db
      .query("categories")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const expensesByCategory = categories
      .map((cat) => {
        const total = monthTx
          .filter((t) => t.categoryId === cat._id && t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);
        return { category: cat, total };
      })
      .filter((c) => c.total > 0);

    const incomeByCategory = categories
      .map((cat) => {
        const total = monthTx
          .filter((t) => t.categoryId === cat._id && t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        return { category: cat, total };
      })
      .filter((c) => c.total > 0);

    // Budget comparisons
    const budgets = await ctx.db
      .query("monthlyBudgets")
      .withIndex("userId_month", (q) =>
        q.eq("userId", user._id).eq("month", args.month),
      )
      .collect();

    const budgetComparisons = budgets.map((budget) => {
      const spent = monthTx
        .filter(
          (t) => t.categoryId === budget.categoryId && t.type === "expense",
        )
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        budget,
        spent,
        remaining: budget.amount - spent,
        percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      };
    });

    return {
      totalIncome,
      totalExpenses,
      fixedExpenses,
      variableExpenses,
      creditCardExpenses,
      balance: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      expensesByCategory,
      incomeByCategory,
      budgetComparisons,
      transactionCount: monthTx.length,
    };
  },
});

// Financial health score calculation
export const getFinancialHealthScore = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return null;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const monthTx = transactions.filter((t) => t.date.startsWith(currentMonth));

    const totalIncome = monthTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthTx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Score components (each 0-100, weighted)
    // 1. Savings Rate (25%) - higher savings = better
    const savingsRate = totalIncome > 0
      ? Math.min((totalIncome - totalExpenses) / totalIncome, 1)
      : 0;
    const savingsScore = savingsRate * 100;

    // 2. Expense-to-Income ratio (25%) - lower expenses = better
    const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 1;
    const expenseScore = Math.max(0, (1 - expenseRatio) * 100);

    // 3. Budget adherence (25%)
    const budgets = await ctx.db
      .query("monthlyBudgets")
      .withIndex("userId_month", (q) =>
        q.eq("userId", user._id).eq("month", currentMonth),
      )
      .collect();

    let budgetScore = 100;
    if (budgets.length > 0) {
      let totalBudgetAdherence = 0;
      for (const budget of budgets) {
        const spent = monthTx
          .filter((t) => t.categoryId === budget.categoryId && t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);
        const adherence = budget.amount > 0
          ? Math.max(0, 1 - (spent - budget.amount) / budget.amount)
          : 1;
        totalBudgetAdherence += Math.min(adherence, 1);
      }
      budgetScore = (totalBudgetAdherence / budgets.length) * 100;
    }

    // 4. Credit card utilization (12.5%)
    const creditCards = await ctx.db
      .query("creditCards")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    let creditScore = 100;
    if (creditCards.length > 0) {
      let totalUtilization = 0;
      for (const card of creditCards) {
        const cardTx = monthTx.filter(
          (t) => t.creditCardId === card._id,
        );
        const cardTotal = cardTx.reduce((sum, t) => sum + t.amount, 0);
        const utilization = card.limit > 0 ? cardTotal / card.limit : 0;
        // Ideal: 10-30% utilization
        if (utilization > 0.5) {
          totalUtilization += Math.max(0, 1 - (utilization - 0.3) / 0.7);
        } else if (utilization < 0.1) {
          totalUtilization += utilization / 0.1;
        } else {
          totalUtilization += 1;
        }
      }
      creditScore = (totalUtilization / creditCards.length) * 100;
    }

    // 5. Investment ratio (12.5%)
    const investments = await ctx.db
      .query("investments")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const totalInvested = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const investmentRatio = totalIncome > 0
      ? totalInvested / (totalIncome * 12) // compare to annual income
      : 0;
    const investmentScore = Math.min(investmentRatio * 100, 100);

    // Calculate weighted score
    const finalScore = Math.round(
      savingsScore * 0.25 +
      expenseScore * 0.25 +
      budgetScore * 0.25 +
      creditScore * 0.125 +
      investmentScore * 0.125
    );

    // Status
    let status: "excellent" | "good" | "fair" | "poor";
    if (finalScore >= 80) status = "excellent";
    else if (finalScore >= 60) status = "good";
    else if (finalScore >= 40) status = "fair";
    else status = "poor";

    let message = "";
    if (status === "excellent") message = "Sua saúde financeira está excelente! Continue assim!";
    else if (status === "good") message = "Você está no caminho certo. Alguns ajustes podem melhorar ainda mais.";
    else if (status === "fair") message = "Atenção! Reveja seus gastos e crie um orçamento.";
    else message = "É hora de agir! Vamos reorganizar suas finanças juntos.";

    return {
      score: Math.min(Math.max(finalScore, 0), 100),
      status,
      message,
      components: {
        savings: { score: Math.round(savingsScore), weight: 25 },
        expenses: { score: Math.round(expenseScore), weight: 25 },
        budget: { score: Math.round(budgetScore), weight: 25 },
        credit: { score: Math.round(creditScore), weight: 12.5 },
        investment: { score: Math.round(investmentScore), weight: 12.5 },
      },
    };
  },
});
