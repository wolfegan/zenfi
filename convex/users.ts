import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Try to find by email first (for email-otp users)
    if (identity.email) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), identity.email))
        .first();
      if (user) return user;
    }

    // Fallback: find by tokenSubject (works for anonymous and other auth methods)
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenSubject"), identity.subject))
      .first();
    return user || null;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    monthlyIncome: v.optional(v.number()),
    financialGoal: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.monthlyIncome !== undefined) updates.monthlyIncome = args.monthlyIncome;
    if (args.financialGoal !== undefined) updates.financialGoal = args.financialGoal;
    if (args.onboardingCompleted !== undefined) updates.onboardingCompleted = args.onboardingCompleted;

    await ctx.db.patch(user._id, updates);
  },
});
