// @ts-nocheck
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, action } from "./_generated/server";
import { vly } from "../lib/vly-integrations";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("debts")
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
      .query("debts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isPaid"), false))
      .order("desc")
      .collect();
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const debts = await ctx.db
      .query("debts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    const totalOwed = debts.reduce((s, d) => s + d.totalAmount, 0);
    const totalRemaining = debts.reduce((s, d) => s + d.remainingAmount, 0);
    const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);
    const activeCount = debts.filter((d) => !d.isPaid).length;
    const paidCount = debts.filter((d) => d.isPaid).length;
    return {
      totalOwed,
      totalRemaining,
      totalPaid: totalOwed - totalRemaining,
      totalMonthly,
      activeCount,
      paidCount,
      count: debts.length,
    };
  },
});

export const create = mutation({
  args: {
    creditor: v.string(),
    description: v.optional(v.string()),
    totalAmount: v.number(),
    remainingAmount: v.number(),
    monthlyPayment: v.number(),
    dueDate: v.string(),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("debts", {
      userId,
      creditor: args.creditor,
      description: args.description,
      totalAmount: args.totalAmount,
      remainingAmount: args.remainingAmount,
      monthlyPayment: args.monthlyPayment,
      dueDate: args.dueDate,
      startDate: args.startDate,
      isPaid: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("debts"),
    creditor: v.optional(v.string()),
    description: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    remainingAmount: v.optional(v.number()),
    monthlyPayment: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    startDate: v.optional(v.string()),
    isPaid: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const markAsPaid = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, { isPaid: true, remainingAmount: 0 });
  },
});

export const payInstallment = mutation({
  args: { id: v.id("debts"), amount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const debt = await ctx.db.get(args.id);
    if (!debt) throw new Error("Debt not found");
    const newRemaining = Math.max(0, debt.remainingAmount - args.amount);
    await ctx.db.patch(args.id, {
      remainingAmount: newRemaining,
      isPaid: newRemaining <= 0,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});

export const sendDueReminders = action({
  args: {},
  handler: async (ctx) => {
    // Get all users with debts that are due within 7 days or overdue
    const debts = await ctx.runQuery(api.debts.getAll);
    const now = new Date();

    for (const debt of debts) {
      if (debt.isPaid) continue;

      const dueDate = new Date(debt.dueDate + (debt.dueDate.includes("T") ? "" : "T00:00:00"));
      const diff = dueDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));

      const shouldNotify = daysUntil <= 7; // includes overdue (negative) and upcoming

      if (!shouldNotify) continue;

      // Get user email
      const user = await ctx.runQuery(api.users.currentUser);
      if (!user?.email) continue;

      const formattedAmount = debt.remainingAmount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      let subject: string;
      let message: string;

      if (daysUntil < 0) {
        subject = `🔴 Dívida atrasada: ${debt.creditor}`;
        message = `Sua dívida com ${debt.creditor} no valor de ${formattedAmount} está atrasada. Regularize o quanto antes para evitar juros.`;
      } else if (daysUntil === 0) {
        subject = `📅 ${debt.creditor} vence hoje!`;
        message = `Sua dívida com ${debt.creditor} no valor de ${formattedAmount} vence hoje. Não se esqueça de pagar!`;
      } else if (daysUntil === 1) {
        subject = `📅 ${debt.creditor} vence amanhã!`;
        message = `Sua dívida com ${debt.creditor} no valor de ${formattedAmount} vence amanhã.`;
      } else {
        subject = `📅 ${debt.creditor} vence em ${daysUntil} dias`;
        message = `Sua dívida com ${debt.creditor} no valor de ${formattedAmount} vence em ${daysUntil} dias. Programe-se para o pagamento.`;
      }

      const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="font-size: 18px; margin-bottom: 12px;">${subject}</h2>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">${message}</p>
          <div style="background: #f5f5f5; border-radius: 4px; padding: 12px; margin: 16px 0;">
            <table style="width: 100%; font-size: 13px;">
              <tr><td style="color: #888; padding: 4px 0;">Credor</td><td style="text-align: right; font-weight: 500;">${debt.creditor}</td></tr>
              <tr><td style="color: #888; padding: 4px 0;">Valor restante</td><td style="text-align: right; font-weight: 500;">${formattedAmount}</td></tr>
              <tr><td style="color: #888; padding: 4px 0;">Vencimento</td><td style="text-align: right;">${dueDate.toLocaleDateString("pt-BR")}</td></tr>
            </table>
          </div>
          <a href="${process.env.VLY_APP_URL || ""}/debts"
             style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 13px;">
            Ver no app
          </a>
        </div>
      `;

      try {
        const result = await vly.email.send({
          to: user.email,
          subject,
          html,
          text: `${subject}\n\n${message}\n\nAcesse o app para mais detalhes.`,
        });
        console.log(`Notification sent for debt ${debt._id} to ${user.email}:`, result);
      } catch (error) {
        console.error(`Failed to send notification for debt ${debt._id}:`, error);
      }
    }
  },
});
