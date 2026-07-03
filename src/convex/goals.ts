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
      .query("goals")
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
      .query("goals")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isAchieved"), false))
      .order("desc")
      .collect();
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const goals = await ctx.db
      .query("goals")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
    const activeGoals = goals.filter((g) => !g.isAchieved).length;
    const achievedGoals = goals.filter((g) => g.isAchieved).length;
    return {
      totalTarget,
      totalCurrent,
      totalProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
      activeGoals,
      achievedGoals,
      count: goals.length,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    monthlyContribution: v.number(),
    targetDate: v.optional(v.string()),
    category: v.union(
      v.literal("emergency"),
      v.literal("travel"),
      v.literal("purchase"),
      v.literal("investment"),
      v.literal("education"),
      v.literal("retirement"),
      v.literal("other"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("goals", {
      userId,
      name: args.name,
      targetAmount: args.targetAmount,
      currentAmount: args.currentAmount,
      monthlyContribution: args.monthlyContribution,
      targetDate: args.targetDate,
      category: args.category,
      isAchieved: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("goals"),
    name: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    monthlyContribution: v.optional(v.number()),
    targetDate: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("emergency"),
      v.literal("travel"),
      v.literal("purchase"),
      v.literal("investment"),
      v.literal("education"),
      v.literal("retirement"),
      v.literal("other"),
    )),
    isAchieved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const markAsAchieved = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, { isAchieved: true, currentAmount: (await ctx.db.get(args.id)).targetAmount });
  },
});

export const contribute = mutation({
  args: { id: v.id("goals"), amount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error("Goal not found");
    const newCurrent = Math.min(goal.currentAmount + args.amount, goal.targetAmount);
    await ctx.db.patch(args.id, {
      currentAmount: newCurrent,
      isAchieved: newCurrent >= goal.targetAmount,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
