export interface Json {
  [key: string]: unknown;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at">;
        Update: Partial<Omit<Transaction, "id" | "created_at">>;
      };
      monthly_budgets: {
        Row: MonthlyBudget;
        Insert: Omit<MonthlyBudget, "id" | "created_at">;
        Update: Partial<Omit<MonthlyBudget, "id" | "created_at">>;
      };
      credit_cards: {
        Row: CreditCard;
        Insert: Omit<CreditCard, "id" | "created_at">;
        Update: Partial<Omit<CreditCard, "id" | "created_at">>;
      };
      credit_card_bills: {
        Row: CreditCardBill;
        Insert: Omit<CreditCardBill, "id" | "created_at">;
        Update: Partial<Omit<CreditCardBill, "id" | "created_at">>;
      };
      debts: {
        Row: Debt;
        Insert: Omit<Debt, "id" | "created_at">;
        Update: Partial<Omit<Debt, "id" | "created_at">>;
      };
      investments: {
        Row: Investment;
        Insert: Omit<Investment, "id" | "created_at">;
        Update: Partial<Omit<Investment, "id" | "created_at">>;
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, "id" | "created_at">;
        Update: Partial<Omit<Account, "id" | "created_at">>;
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, "id" | "created_at">;
        Update: Partial<Omit<Goal, "id" | "created_at">>;
      };
    };
  };
}

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  is_anonymous: boolean;
  monthly_income: number | null;
  financial_goal: string | null;
  onboarding_completed: boolean | null;
  created_at: number;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  is_fixed: boolean;
  order?: number | null;
  created_at: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  description: string | null;
  is_fixed: boolean;
  is_credit_card: boolean;
  credit_card_id: string | null;
  created_at: number;
}

export interface MonthlyBudget {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  amount: number;
  created_at: number;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  limit: number;
  closing_day: number;
  due_day: number;
  color: string;
  created_at: number;
}

export interface CreditCardBill {
  id: string;
  user_id: string;
  credit_card_id: string;
  month: string;
  total_amount: number;
  is_paid: boolean;
  due_date: string;
  closing_date: string;
  created_at: number;
}

export interface Debt {
  id: string;
  user_id: string;
  creditor: string;
  description: string | null;
  total_amount: number;
  remaining_amount: number;
  monthly_payment: number;
  due_date: string;
  start_date: string;
  is_paid: boolean;
  created_at: number;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: "stocks" | "crypto" | "real_estate" | "fixed_income" | "other";
  amount: number;
  current_value: number;
  monthly_contribution: number;
  created_at: number;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: "checking" | "savings" | "cash" | "other";
  balance: number;
  color: string;
  created_at: number;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string | null;
  category: "emergency" | "travel" | "purchase" | "investment" | "education" | "retirement" | "other";
  is_achieved: boolean;
  created_at: number;
}

// Helper types for frontend use
export interface CreditCardWithBills extends CreditCard {
  bills: CreditCardBill[];
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  creditCardExpenses: number;
  balance: number;
  savingsRate: number;
  expensesByCategory: Array<{
    category: Category;
    total: number;
  }>;
  incomeByCategory: Array<{
    category: Category;
    total: number;
  }>;
  budgetComparisons: Array<{
    budget: MonthlyBudget;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
  transactionCount: number;
}

export interface MonthlyEvolution {
  month: string;
  label: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface HealthScore {
  score: number;
  status: "excellent" | "good" | "fair" | "poor";
  message: string;
  components: {
    savings: { score: number; weight: number };
    expenses: { score: number; weight: number };
    budget: { score: number; weight: number };
    credit: { score: number; weight: number };
    investment: { score: number; weight: number };
  };
}

export interface DebtsSummary {
  totalOwed: number;
  totalRemaining: number;
  totalPaid: number;
  totalMonthly: number;
  activeCount: number;
  paidCount: number;
  count: number;
}

export interface GoalsSummary {
  totalTarget: number;
  totalCurrent: number;
  totalProgress: number;
  activeGoals: number;
  achievedGoals: number;
  count: number;
}

export interface InvestmentsSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturn: number;
  returnPercentage: number;
  count: number;
}
