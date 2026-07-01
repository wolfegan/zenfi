// @ts-nocheck
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";

export const getByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("monthlyBudgets")
      .withIndex("userId_month", (q) => q.eq("userId", userId).eq("month", args.month))
      .collect();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("monthlyBudgets")
      .withIndex("userId_month", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const setBudget = mutation({
  args: { categoryId: v.id("categories"), month: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("monthlyBudgets")
      .withIndex("userId_category_month", (q) => q.eq("userId", userId).eq("categoryId", args.categoryId).eq("month", args.month))
      .first();
    if (existing) { await ctx.db.patch(existing._id, { amount: args.amount }); return existing._id; }
    return await ctx.db.insert("monthlyBudgets", { userId, categoryId: args.categoryId, month: args.month, amount: args.amount });
  },
});

export const remove = mutation({
  args: { id: v.id("monthlyBudgets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
