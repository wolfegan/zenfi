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
      .query("investments")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return null;

    const investments = await ctx.db
      .query("investments")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
    const totalCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalReturn = totalCurrentValue - totalInvested;
    const returnPercentage = totalInvested > 0
      ? (totalReturn / totalInvested) * 100
      : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalReturn,
      returnPercentage,
      count: investments.length,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("stocks"),
      v.literal("crypto"),
      v.literal("real_estate"),
      v.literal("fixed_income"),
      v.literal("other"),
    ),
    amount: v.number(),
    currentValue: v.number(),
    monthlyContribution: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("investments", {
      userId: user._id,
      name: args.name,
      type: args.type,
      amount: args.amount,
      currentValue: args.currentValue,
      monthlyContribution: args.monthlyContribution,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("investments"),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("stocks"),
        v.literal("crypto"),
        v.literal("real_estate"),
        v.literal("fixed_income"),
        v.literal("other"),
      ),
    ),
    amount: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    monthlyContribution: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("investments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
