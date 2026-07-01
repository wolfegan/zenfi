// @ts-nocheck
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("transactions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const txs = await ctx.db
      .query("transactions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return txs.filter((t) => t.date.startsWith(args.month));
  },
});

export const getByCreditCard = query({
  args: { creditCardId: v.id("creditCards"), month: v.string() },
  handler: async (ctx, args) => {
    const txs = await ctx.db
      .query("transactions")
      .withIndex("creditCardId", (q) => q.eq("creditCardId", args.creditCardId))
      .collect();
    return txs.filter((t) => t.date.startsWith(args.month));
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("transactions", {
      userId,
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});

export const getMonthlySummary = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const txs = await ctx.db.query("transactions").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    const monthTx = txs.filter((t) => t.date.startsWith(args.month));
    const totalIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const fixedExpenses = monthTx.filter((t) => t.type === "expense" && t.isFixed).reduce((s, t) => s + t.amount, 0);
    const variableExpenses = monthTx.filter((t) => t.type === "expense" && !t.isFixed).reduce((s, t) => s + t.amount, 0);
    const creditCardExpenses = monthTx.filter((t) => t.isCreditCard).reduce((s, t) => s + t.amount, 0);
    const categories = await ctx.db.query("categories").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    const expensesByCategory = categories.map((cat) => ({
      category: cat,
      total: monthTx.filter((t) => t.categoryId === cat._id && t.type === "expense").reduce((s, t) => s + t.amount, 0),
    })).filter((c) => c.total > 0);
    const incomeByCategory = categories.map((cat) => ({
      category: cat,
      total: monthTx.filter((t) => t.categoryId === cat._id && t.type === "income").reduce((s, t) => s + t.amount, 0),
    })).filter((c) => c.total > 0);
    const budgets = await ctx.db.query("monthlyBudgets").withIndex("userId_month", (q) => q.eq("userId", userId).eq("month", args.month)).collect();
    const budgetComparisons = budgets.map((budget) => {
      const spent = monthTx.filter((t) => t.categoryId === budget.categoryId && t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return { budget, spent, remaining: budget.amount - spent, percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0 };
    });
    return {
      totalIncome, totalExpenses, fixedExpenses, variableExpenses, creditCardExpenses,
      balance: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      expensesByCategory, incomeByCategory, budgetComparisons, transactionCount: monthTx.length,
    };
  },
});

export const getFinancialHealthScore = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const txs = await ctx.db.query("transactions").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    const monthTx = txs.filter((t) => t.date.startsWith(currentMonth));
    const totalIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const savingsRate = totalIncome > 0 ? Math.min((totalIncome - totalExpenses) / totalIncome, 1) : 0;
    const savingsScore = savingsRate * 100;
    const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 1;
    const expenseScore = Math.max(0, (1 - expenseRatio) * 100);
    const budgets = await ctx.db.query("monthlyBudgets").withIndex("userId_month", (q) => q.eq("userId", userId).eq("month", currentMonth)).collect();
    let budgetScore = 100;
    if (budgets.length > 0) {
      let totalAdherence = 0;
      for (const budget of budgets) {
        const spent = monthTx.filter((t) => t.categoryId === budget.categoryId && t.type === "expense").reduce((s, t) => s + t.amount, 0);
        totalAdherence += Math.min(budget.amount > 0 ? Math.max(0, 1 - (spent - budget.amount) / budget.amount) : 1, 1);
      }
      budgetScore = (totalAdherence / budgets.length) * 100;
    }
    const creditCards = await ctx.db.query("creditCards").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    let creditScore = 100;
    if (creditCards.length > 0) {
      let totalUtil = 0;
      for (const card of creditCards) {
        const cardTotal = monthTx.filter((t) => t.creditCardId === card._id).reduce((s, t) => s + t.amount, 0);
        const util = card.limit > 0 ? cardTotal / card.limit : 0;
        if (util > 0.5) totalUtil += Math.max(0, 1 - (util - 0.3) / 0.7);
        else if (util < 0.1) totalUtil += util / 0.1;
        else totalUtil += 1;
      }
      creditScore = (totalUtil / creditCards.length) * 100;
    }
    const investments = await ctx.db.query("investments").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    const totalInvested = investments.reduce((s, i) => s + i.currentValue, 0);
    const invScore = Math.min(totalIncome > 0 ? (totalInvested / (totalIncome * 12)) * 100 : 0, 100);
    const finalScore = Math.round(savingsScore * 0.25 + expenseScore * 0.25 + budgetScore * 0.25 + creditScore * 0.125 + invScore * 0.125);
    let status;
    if (finalScore >= 80) status = "excellent";
    else if (finalScore >= 60) status = "good";
    else if (finalScore >= 40) status = "fair";
    else status = "poor";
    const messages = {
      excellent: "Sua saúde financeira está excelente! Continue assim!",
      good: "Você está no caminho certo. Alguns ajustes podem melhorar ainda mais.",
      fair: "Atenção! Reveja seus gastos e crie um orçamento.",
      poor: "É hora de agir! Vamos reorganizar suas finanças juntos.",
    };
    return {
      score: Math.min(Math.max(finalScore, 0), 100), status, message: messages[status],
      components: {
        savings: { score: Math.round(savingsScore), weight: 25 },
        expenses: { score: Math.round(expenseScore), weight: 25 },
        budget: { score: Math.round(budgetScore), weight: 25 },
        credit: { score: Math.round(creditScore), weight: 12.5 },
        investment: { score: Math.round(invScore), weight: 12.5 },
      },
    };
  },
});
