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
      .query("debts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("debts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isPaid"), false))
      .order("desc")
      .collect();
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const debts = await ctx.db
      .query("debts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    const totalOwed = debts.reduce((s, d) => s + d.totalAmount, 0);
    const totalRemaining = debts.reduce((s, d) => s + d.remainingAmount, 0);
    const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);
    const activeCount = debts.filter((d) => !d.isPaid).length;
    const paidCount = debts.filter((d) => d.isPaid).length;
    return {
      totalOwed,
      totalRemaining,
      totalPaid: totalOwed - totalRemaining,
      totalMonthly,
      activeCount,
      paidCount,
      count: debts.length,
    };
  },
});

export const create = mutation({
  args: {
    creditor: v.string(),
    description: v.optional(v.string()),
    totalAmount: v.number(),
    remainingAmount: v.number(),
    monthlyPayment: v.number(),
    dueDate: v.string(),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("debts", {
      userId,
      creditor: args.creditor,
      description: args.description,
      totalAmount: args.totalAmount,
      remainingAmount: args.remainingAmount,
      monthlyPayment: args.monthlyPayment,
      dueDate: args.dueDate,
      startDate: args.startDate,
      isPaid: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("debts"),
    creditor: v.optional(v.string()),
    description: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    remainingAmount: v.optional(v.number()),
    monthlyPayment: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    startDate: v.optional(v.string()),
    isPaid: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const markAsPaid = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, { isPaid: true, remainingAmount: 0 });
  },
});

export const payInstallment = mutation({
  args: { id: v.id("debts"), amount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const debt = await ctx.db.get(args.id);
    if (!debt) throw new Error("Debt not found");
    const newRemaining = Math.max(0, debt.remainingAmount - args.amount);
    await ctx.db.patch(args.id, {
      remainingAmount: newRemaining,
      isPaid: newRemaining <= 0,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
