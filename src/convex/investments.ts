// @ts-nocheck
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("investments").withIndex("userId", (q) => q.eq("userId", userId)).collect();
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const investments = await ctx.db.query("investments").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
    const totalCurrentValue = investments.reduce((s, i) => s + i.currentValue, 0);
    const totalReturn = totalCurrentValue - totalInvested;
    return { totalInvested, totalCurrentValue, totalReturn, returnPercentage: totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0, count: investments.length };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("stocks"), v.literal("crypto"), v.literal("real_estate"), v.literal("fixed_income"), v.literal("other")),
    amount: v.number(), currentValue: v.number(), monthlyContribution: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("investments", { userId, name: args.name, type: args.type, amount: args.amount, currentValue: args.currentValue, monthlyContribution: args.monthlyContribution, createdAt: Date.now() });
  },
});

export const update = mutation({
  args: {
    id: v.id("investments"), name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("stocks"), v.literal("crypto"), v.literal("real_estate"), v.literal("fixed_income"), v.literal("other"))),
    amount: v.optional(v.number()), currentValue: v.optional(v.number()), monthlyContribution: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("investments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
