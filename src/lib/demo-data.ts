// Demo data for visualization without Convex backend
// These match the shapes returned by the Convex queries

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const previousMonth = (offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
};

export const demoCategories = [
  { _id: "cat-1" as any, userId: "user-1" as any, name: "Alimentação", type: "expense" as const, icon: "ShoppingCart", color: "#0a0a0a", isFixed: false, order: 0 },
  { _id: "cat-2" as any, userId: "user-1" as any, name: "Transporte", type: "expense" as const, icon: "Car", color: "#444444", isFixed: false, order: 1 },
  { _id: "cat-3" as any, userId: "user-1" as any, name: "Moradia", type: "expense" as const, icon: "Home", color: "#666666", isFixed: true, order: 2 },
  { _id: "cat-4" as any, userId: "user-1" as any, name: "Lazer", type: "expense" as const, icon: "Coffee", color: "#888888", isFixed: false, order: 3 },
  { _id: "cat-5" as any, userId: "user-1" as any, name: "Assinaturas", type: "expense" as const, icon: "Wifi", color: "#aaaaaa", isFixed: true, order: 4 },
  { _id: "cat-6" as any, userId: "user-1" as any, name: "Saúde", type: "expense" as const, icon: "Heart", color: "#c44", isFixed: false, order: 5 },
  { _id: "cat-7" as any, userId: "user-1" as any, name: "Salário", type: "income" as const, icon: "Briefcase", color: "#2a7", isFixed: true, order: 6 },
  { _id: "cat-8" as any, userId: "user-1" as any, name: "Freelance", type: "income" as const, icon: "PiggyBank", color: "#27a", isFixed: false, order: 7 },
];

export const demoBudgets = [
  { _id: "budget-1" as any, userId: "user-1" as any, categoryId: "cat-1" as any, month: currentMonth, amount: 1200 },
  { _id: "budget-2" as any, userId: "user-1" as any, categoryId: "cat-2" as any, month: currentMonth, amount: 500 },
  { _id: "budget-3" as any, userId: "user-1" as any, categoryId: "cat-3" as any, month: currentMonth, amount: 2500 },
  { _id: "budget-4" as any, userId: "user-1" as any, categoryId: "cat-4" as any, month: currentMonth, amount: 800 },
];

export const demoTransactions = [
  { _id: "tx-1" as any, userId: "user-1" as any, categoryId: "cat-7" as any, amount: 8000, date: `${currentMonth}-05`, type: "income" as const, description: "Salário mensal", isFixed: true, isCreditCard: false, createdAt: Date.now() - 86400000 * 25 },
  { _id: "tx-2" as any, userId: "user-1" as any, categoryId: "cat-8" as any, amount: 1500, date: `${currentMonth}-12`, type: "income" as const, description: "Projeto de design", isFixed: false, isCreditCard: false, createdAt: Date.now() - 86400000 * 18 },
  { _id: "tx-3" as any, userId: "user-1" as any, categoryId: "cat-3" as any, amount: 2200, date: `${currentMonth}-01`, type: "expense" as const, description: "Aluguel", isFixed: true, isCreditCard: false, createdAt: Date.now() - 86400000 * 29 },
  { _id: "tx-4" as any, userId: "user-1" as any, categoryId: "cat-5" as any, amount: 89.90, date: `${currentMonth}-03`, type: "expense" as const, description: "Streaming", isFixed: true, isCreditCard: true, creditCardId: "card-1" as any, createdAt: Date.now() - 86400000 * 27 },
  { _id: "tx-5" as any, userId: "user-1" as any, categoryId: "cat-1" as any, amount: 356.50, date: `${currentMonth}-08`, type: "expense" as const, description: "Supermercado", isFixed: false, isCreditCard: false, createdAt: Date.now() - 86400000 * 22 },
  { _id: "tx-6" as any, userId: "user-1" as any, categoryId: "cat-1" as any, amount: 89.00, date: `${currentMonth}-10`, type: "expense" as const, description: "Restaurante", isFixed: false, isCreditCard: true, creditCardId: "card-1" as any, createdAt: Date.now() - 86400000 * 20 },
  { _id: "tx-7" as any, userId: "user-1" as any, categoryId: "cat-2" as any, amount: 45.00, date: `${currentMonth}-11`, type: "expense" as const, description: "Uber", isFixed: false, isCreditCard: false, createdAt: Date.now() - 86400000 * 19 },
  { _id: "tx-8" as any, userId: "user-1" as any, categoryId: "cat-2" as any, amount: 250.00, date: `${currentMonth}-15`, type: "expense" as const, description: "Gasolina", isFixed: false, isCreditCard: false, createdAt: Date.now() - 86400000 * 15 },
  { _id: "tx-9" as any, userId: "user-1" as any, categoryId: "cat-4" as any, amount: 180.00, date: `${currentMonth}-14`, type: "expense" as const, description: "Cinema e jantar", isFixed: false, isCreditCard: true, creditCardId: "card-1" as any, createdAt: Date.now() - 86400000 * 16 },
  { _id: "tx-10" as any, userId: "user-1" as any, categoryId: "cat-6" as any, amount: 300.00, date: `${currentMonth}-18`, type: "expense" as const, description: "Plano de saúde", isFixed: true, isCreditCard: false, createdAt: Date.now() - 86400000 * 12 },
  { _id: "tx-11" as any, userId: "user-1" as any, categoryId: "cat-1" as any, amount: 215.00, date: `${currentMonth}-20`, type: "expense" as const, description: "Feira", isFixed: false, isCreditCard: false, createdAt: Date.now() - 86400000 * 10 },
  { _id: "tx-12" as any, userId: "user-1" as any, categoryId: "cat-4" as any, amount: 50.00, date: `${currentMonth}-22`, type: "expense" as const, description: "Cerveja com amigos", isFixed: false, isCreditCard: false, createdAt: Date.now() - 86400000 * 8 },
];

export const demoCreditCards = [
  {
    _id: "card-1" as any, userId: "user-1" as any, name: "Nubank", limit: 8000, closingDay: 3, dueDay: 10, color: "#666666", createdAt: Date.now(),
    bills: [
      { _id: "bill-1" as any, userId: "user-1" as any, creditCardId: "card-1" as any, month: currentMonth, totalAmount: 320.90, isPaid: false, dueDate: `${currentMonth}-10`, closingDate: `${previousMonth(0)}-03`, createdAt: Date.now() },
      { _id: "bill-2" as any, userId: "user-1" as any, creditCardId: "card-1" as any, month: previousMonth(1), totalAmount: 450.00, isPaid: true, dueDate: `${previousMonth(1)}-10`, closingDate: `${previousMonth(2)}-03`, createdAt: Date.now() - 86400000 * 30 },
    ],
  },
  {
    _id: "card-2" as any, userId: "user-1" as any, name: "Inter", limit: 5000, closingDay: 15, dueDay: 22, color: "#c44", createdAt: Date.now(),
    bills: [
      { _id: "bill-3" as any, userId: "user-1" as any, creditCardId: "card-2" as any, month: currentMonth, totalAmount: 0, isPaid: false, dueDate: `${currentMonth}-22`, closingDate: `${currentMonth}-15`, createdAt: Date.now() },
    ],
  },
];

export const demoInvestments = [
  { _id: "inv-1" as any, userId: "user-1" as any, name: "Tesouro Selic", type: "fixed_income" as const, amount: 10000, currentValue: 10450, monthlyContribution: 500, createdAt: Date.now() - 86400000 * 180 },
  { _id: "inv-2" as any, userId: "user-1" as any, name: "FIIs", type: "real_estate" as const, amount: 5000, currentValue: 5320, monthlyContribution: 200, createdAt: Date.now() - 86400000 * 90 },
  { _id: "inv-3" as any, userId: "user-1" as any, name: "Bitcoin", type: "crypto" as const, amount: 2000, currentValue: 2680, monthlyContribution: 100, createdAt: Date.now() - 86400000 * 45 },
];

export const demoMonthlySummary = () => {
  const expenses = demoTransactions.filter((t) => t.type === "expense");
  const incomes = demoTransactions.filter((t) => t.type === "income");
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  const expensesByCategory = demoCategories
    .filter((c) => c.type === "expense")
    .map((cat) => ({
      category: cat,
      total: expenses.filter((t) => t.categoryId === cat._id).reduce((s, t) => s + t.amount, 0),
    }))
    .filter((c) => c.total > 0);

  const incomeByCategory = demoCategories
    .filter((c) => c.type === "income")
    .map((cat) => ({
      category: cat,
      total: incomes.filter((t) => t.categoryId === cat._id).reduce((s, t) => s + t.amount, 0),
    }))
    .filter((c) => c.total > 0);

  const budgetComparisons = demoBudgets.map((budget) => {
    const spent = expenses.filter((t) => t.categoryId === budget.categoryId).reduce((s, t) => s + t.amount, 0);
    return { budget, spent, remaining: budget.amount - spent, percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0 };
  });

  return {
    totalIncome,
    totalExpenses,
    fixedExpenses: expenses.filter((t) => t.isFixed).reduce((s, t) => s + t.amount, 0),
    variableExpenses: expenses.filter((t) => !t.isFixed).reduce((s, t) => s + t.amount, 0),
    creditCardExpenses: expenses.filter((t) => t.isCreditCard).reduce((s, t) => s + t.amount, 0),
    balance: totalIncome - totalExpenses,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    expensesByCategory,
    incomeByCategory,
    budgetComparisons,
    transactionCount: demoTransactions.length,
  };
};

export const demoEvolution = [
  { month: previousMonth(5), label: monthLabel(5), income: 7500, expenses: 4200, balance: 3300 },
  { month: previousMonth(4), label: monthLabel(4), income: 7500, expenses: 4800, balance: 2700 },
  { month: previousMonth(3), label: monthLabel(3), income: 8500, expenses: 5100, balance: 3400 },
  { month: previousMonth(2), label: monthLabel(2), income: 7500, expenses: 3800, balance: 3700 },
  { month: previousMonth(1), label: monthLabel(1), income: 8000, expenses: 4600, balance: 3400 },
  { month: currentMonth, label: monthLabel(0), income: 9500, expenses: 3775.40, balance: 5724.60 },
];

export const demoHealthScore = {
  score: 72,
  status: "good" as const,
  message: "Você está no caminho certo. Alguns ajustes podem melhorar ainda mais.",
  components: {
    savings: { score: 60, weight: 25 },
    expenses: { score: 65, weight: 25 },
    budget: { score: 78, weight: 25 },
    credit: { score: 85, weight: 12.5 },
    investment: { score: 70, weight: 12.5 },
  },
};

export const demoInvestmentsSummary = {
  totalInvested: 17000,
  totalCurrentValue: 18450,
  totalReturn: 1450,
  returnPercentage: 8.5,
  count: 3,
};
