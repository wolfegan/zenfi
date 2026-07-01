import { DocId } from "convex/server";

export const api: {
  users: {
    currentUser: any;
    updateProfile: any;
  };
  categories: {
    getAll: any;
    getByType: any;
    create: any;
    update: any;
    remove: any;
  };
  transactions: {
    getAll: any;
    getByMonth: any;
    getByDateRange: any;
    getByCreditCard: any;
    create: any;
    update: any;
    remove: any;
    getMonthlySummary: any;
    getFinancialHealthScore: any;
  };
  budgets: {
    getByMonth: any;
    getAll: any;
    setBudget: any;
    remove: any;
  };
  creditCards: {
    getAll: any;
    create: any;
    update: any;
    remove: any;
    getBills: any;
    createBill: any;
    toggleBillPaid: any;
    deleteBill: any;
  };
  investments: {
    getAll: any;
    getSummary: any;
    create: any;
    update: any;
    remove: any;
  };
};

export type ApiType = typeof api;
