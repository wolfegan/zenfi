import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove
      role: v.optional(roleValidator), // role of the user. do not remove
      monthlyIncome: v.optional(v.number()),
      financialGoal: v.optional(v.string()),
      onboardingCompleted: v.optional(v.boolean()),
    }).index("email", ["email"]),

    // Financial categories
    categories: defineTable({
      userId: v.id("users"),
      name: v.string(),
      type: v.union(v.literal("income"), v.literal("expense")),
      icon: v.string(),
      color: v.string(),
      isFixed: v.boolean(),
      order: v.optional(v.number()),
    }).index("userId", ["userId"]),

    // Transactions (income and expenses)
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
      .index("userId_category", ["userId", "categoryId"])
      .index("creditCardId", ["creditCardId"]),

    // Monthly budgets per category
    monthlyBudgets: defineTable({
      userId: v.id("users"),
      categoryId: v.id("categories"),
      month: v.string(), // YYYY-MM
      amount: v.number(),
    })
      .index("userId_month", ["userId", "month"])
      .index("userId_category_month", ["userId", "categoryId", "month"]),

    // Credit cards
    creditCards: defineTable({
      userId: v.id("users"),
      name: v.string(),
      limit: v.number(),
      closingDay: v.number(),
      dueDay: v.number(),
      color: v.string(),
      createdAt: v.number(),
    }).index("userId", ["userId"]),

    // Credit card bills
    creditCardBills: defineTable({
      userId: v.id("users"),
      creditCardId: v.id("creditCards"),
      month: v.string(),
      totalAmount: v.number(),
      isPaid: v.boolean(),
      dueDate: v.string(),
      closingDate: v.string(),
      createdAt: v.number(),
    })
      .index("creditCardId", ["creditCardId"])
      .index("userId_month", ["userId", "month"]),

    // Investments
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
      amount: v.number(),
      currentValue: v.number(),
      monthlyContribution: v.number(),
      createdAt: v.number(),
    }).index("userId", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
