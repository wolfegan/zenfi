// @ts-nocheck
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 8:00 AM to check for debts due within 7 days
crons.interval("check-due-debts", { hours: 24 }, internal.debts.sendDueReminders, {});

export default crons;
