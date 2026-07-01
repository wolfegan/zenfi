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

    const cards = await ctx.db
      .query("creditCards")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    // Attach latest bill info
    const cardsWithBills = await Promise.all(
      cards.map(async (card) => {
        const bills = await ctx.db
          .query("creditCardBills")
          .withIndex("creditCardId", (q) => q.eq("creditCardId", card._id))
          .order("desc")
          .take(3);
        return { ...card, bills };
      }),
    );

    return cardsWithBills;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    limit: v.number(),
    closingDay: v.number(),
    dueDay: v.number(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("creditCards", {
      userId: user._id,
      name: args.name,
      limit: args.limit,
      closingDay: args.closingDay,
      dueDay: args.dueDay,
      color: args.color,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("creditCards"),
    name: v.optional(v.string()),
    limit: v.optional(v.number()),
    closingDay: v.optional(v.number()),
    dueDay: v.optional(v.number()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("creditCards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Delete associated transactions and bills
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("creditCardId", (q) => q.eq("creditCardId", args.id))
      .collect();
    for (const t of transactions) {
      await ctx.db.delete(t._id);
    }

    const bills = await ctx.db
      .query("creditCardBills")
      .withIndex("creditCardId", (q) => q.eq("creditCardId", args.id))
      .collect();
    for (const b of bills) {
      await ctx.db.delete(b._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Bill management
export const getBills = query({
  args: { creditCardId: v.id("creditCards") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creditCardBills")
      .withIndex("creditCardId", (q) => q.eq("creditCardId", args.creditCardId))
      .order("desc")
      .collect();
  },
});

export const createBill = mutation({
  args: {
    creditCardId: v.id("creditCards"),
    month: v.string(),
    totalAmount: v.number(),
    dueDate: v.string(),
    closingDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const card = await ctx.db.get(args.creditCardId);
    if (!card) throw new Error("Credit card not found");

    return await ctx.db.insert("creditCardBills", {
      userId: card.userId,
      creditCardId: args.creditCardId,
      month: args.month,
      totalAmount: args.totalAmount,
      isPaid: false,
      dueDate: args.dueDate,
      closingDate: args.closingDate,
      createdAt: Date.now(),
    });
  },
});

export const toggleBillPaid = mutation({
  args: { id: v.id("creditCardBills"), isPaid: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, { isPaid: args.isPaid });
  },
});

export const deleteBill = mutation({
  args: { id: v.id("creditCardBills") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
