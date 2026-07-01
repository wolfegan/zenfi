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
      .query("categories")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();
  },
});

export const getByType = query({
  args: { type: v.union(v.literal("income"), v.literal("expense")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return [];

    const categories = await ctx.db
      .query("categories")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    return categories.filter((c) => c.type === args.type);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    icon: v.string(),
    color: v.string(),
    isFixed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const count = await ctx.db
      .query("categories")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    return await ctx.db.insert("categories", {
      userId: user._id,
      name: args.name,
      type: args.type,
      icon: args.icon,
      color: args.color,
      isFixed: args.isFixed,
      order: count.length,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isFixed: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, args);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Delete all transactions in this category
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("userId_category", (q) => q.eq("categoryId", args.id))
      .collect();

    for (const t of transactions) {
      await ctx.db.delete(t._id);
    }

    // Delete budgets for this category
    const budgets = await ctx.db
      .query("monthlyBudgets")
      .filter((q) => q.eq(q.field("categoryId"), args.id))
      .collect();

    for (const b of budgets) {
      await ctx.db.delete(b._id);
    }

    await ctx.db.delete(args.id);
  },
});
