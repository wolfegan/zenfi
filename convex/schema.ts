import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    users: defineTable({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      onboardingCompleted: v.optional(v.boolean()),
      // Financial profile
      monthlyIncome: v.optional(v.number()),
      financialGoal: v.optional(v.string()),
    }).index("email", ["email"]),

    categories: defineTable({
      userId: v.id("users"),
      name: v.string(),
      type: v.union(v.literal("income"), v.literal("expense")),
      icon: v.string(),
      color: v.string(),
      isFixed: v.boolean(),
      order: v.optional(v.number()),
    }).index("userId", ["userId"]),

    transactions: defineTable({
      userId: v.id("users"),
      categoryId: v.id("categories"),
      amount: v.number(),
      date: v.string(),
      type: v.union(v.literal("income"), v.literal("expense")),
      description: v.optional(v.string()),
      isFixed: v.boolean(),
      isCreditCard: v.boolean(),
      creditCardId: v.optional(v.id("creditCards")),
      createdAt: v.number(),
    })
      .index("userId", ["userId"])
      .index("userId_date", ["userId", "date"])
      .index("userId_type", ["userId", "type"])
      .index("userId_category", ["userId", "categoryId"])
      .index("creditCardId", ["creditCardId"]),

    monthlyBudgets: defineTable({
      userId: v.id("users"),
      categoryId: v.id("categories"),
      month: v.string(), // YYYY-MM
      amount: v.number(),
    })
      .index("userId_month", ["userId", "month"])
      .index("userId_category_month", ["userId", "categoryId", "month"]),

    creditCards: defineTable({
      userId: v.id("users"),
      name: v.string(),
      limit: v.number(),
      closingDay: v.number(), // 1-31
      dueDay: v.number(), // 1-31
      color: v.string(),
      createdAt: v.number(),
    }).index("userId", ["userId"]),

    creditCardBills: defineTable({
      userId: v.id("users"),
      creditCardId: v.id("creditCards"),
      month: v.string(), // YYYY-MM
      totalAmount: v.number(),
      isPaid: v.boolean(),
      dueDate: v.string(),
      closingDate: v.string(),
      createdAt: v.number(),
    })
      .index("creditCardId", ["creditCardId"])
      .index("userId_month", ["userId", "month"]),

    investments: defineTable({
      userId: v.id("users"),
      name: v.string(),
      type: v.union(
        v.literal("stocks"),
        v.literal("crypto"),
        v.literal("real_estate"),
        v.literal("fixed_income"),
        v.literal("other"),
      ),
      amount: v.number(), // total invested
      currentValue: v.number(), // current market value
      monthlyContribution: v.number(),
      createdAt: v.number(),
    }).index("userId", ["userId"]),
  },
  { schemaValidation: true },
);
