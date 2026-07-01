import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    return await ctx.db
      .query("monthlyBudgets")
      .withIndex("userId_month", (q) =>
        q.eq("userId", user._id).eq("month", args.month),
      )
      .collect();
  },
});

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
      .query("monthlyBudgets")
      .withIndex("userId_month", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const setBudget = mutation({
  args: {
    categoryId: v.id("categories"),
    month: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    // Check if budget already exists for this category/month
    const existing = await ctx.db
      .query("monthlyBudgets")
      .withIndex("userId_category_month", (q) =>
        q
          .eq("userId", user._id)
          .eq("categoryId", args.categoryId)
          .eq("month", args.month),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { amount: args.amount });
      return existing._id;
    }

    return await ctx.db.insert("monthlyBudgets", {
      userId: user._id,
      categoryId: args.categoryId,
      month: args.month,
      amount: args.amount,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("monthlyBudgets") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
