import { DocId } from "convex/server";

export type DataModel = {
  users: {
    _id: DocId<"users">;
    name?: string;
    image?: string;
    email?: string;
    emailVerificationTime?: number;
    isAnonymous?: boolean;
    role?: string;
    monthlyIncome?: number;
    financialGoal?: string;
    onboardingCompleted?: boolean;
  };
  categories: {
    _id: DocId<"categories">;
    userId: DocId<"users">;
    name: string;
    type: "income" | "expense";
    icon: string;
    color: string;
    isFixed: boolean;
    order?: number;
  };
  transactions: {
    _id: DocId<"transactions">;
    userId: DocId<"users">;
    categoryId: DocId<"categories">;
    amount: number;
    date: string;
    type: "income" | "expense";
    description?: string;
    isFixed: boolean;
    isCreditCard: boolean;
    creditCardId?: DocId<"creditCards">;
    createdAt: number;
  };
  monthlyBudgets: {
    _id: DocId<"monthlyBudgets">;
    userId: DocId<"users">;
    categoryId: DocId<"categories">;
    month: string;
    amount: number;
  };
  creditCards: {
    _id: DocId<"creditCards">;
    userId: DocId<"users">;
    name: string;
    limit: number;
    closingDay: number;
    dueDay: number;
    color: string;
    createdAt: number;
  };
  creditCardBills: {
    _id: DocId<"creditCardBills">;
    userId: DocId<"users">;
    creditCardId: DocId<"creditCards">;
    month: string;
    totalAmount: number;
    isPaid: boolean;
    dueDate: string;
    closingDate: string;
    createdAt: number;
  };
  investments: {
    _id: DocId<"investments">;
    userId: DocId<"users">;
    name: string;
    type: "stocks" | "crypto" | "real_estate" | "fixed_income" | "other";
    amount: number;
    currentValue: number;
    monthlyContribution: number;
    createdAt: number;
  };
  // Auth tables from convex-auth
  authAccounts: { _id: DocId<"authAccounts"> };
  authSessions: { _id: DocId<"authSessions"> };
  authVerificationTokens: { _id: DocId<"authVerificationTokens"> };
};

export type TableNames = keyof DataModel;
export type Doc<T extends TableNames> = DataModel[T];
