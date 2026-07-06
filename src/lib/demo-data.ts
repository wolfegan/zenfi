// Demo data for visualization without Supabase backend
// Uses snake_case to match Supabase column naming

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
  {
    id: "cat-1",
    user_id: "user-1",
    name: "Alimentação",
    type: "expense" as const,
    icon: "ShoppingCart",
    color: "#0a0a0a",
    is_fixed: false,
    order: 0,
    created_at: Date.now(),
  },
  {
    id: "cat-2",
    user_id: "user-1",
    name: "Transporte",
    type: "expense" as const,
    icon: "Car",
    color: "#444444",
    is_fixed: false,
    order: 1,
    created_at: Date.now(),
  },
  {
    id: "cat-3",
    user_id: "user-1",
    name: "Moradia",
    type: "expense" as const,
    icon: "Home",
    color: "#666666",
    is_fixed: true,
    order: 2,
    created_at: Date.now(),
  },
  {
    id: "cat-4",
    user_id: "user-1",
    name: "Lazer",
    type: "expense" as const,
    icon: "Coffee",
    color: "#888888",
    is_fixed: false,
    order: 3,
    created_at: Date.now(),
  },
  {
    id: "cat-5",
    user_id: "user-1",
    name: "Assinaturas",
    type: "expense" as const,
    icon: "Wifi",
    color: "#aaaaaa",
    is_fixed: true,
    order: 4,
    created_at: Date.now(),
  },
  {
    id: "cat-6",
    user_id: "user-1",
    name: "Saúde",
    type: "expense" as const,
    icon: "Heart",
    color: "#c44",
    is_fixed: false,
    order: 5,
    created_at: Date.now(),
  },
  {
    id: "cat-7",
    user_id: "user-1",
    name: "Salário",
    type: "income" as const,
    icon: "Briefcase",
    color: "#2a7",
    is_fixed: true,
    order: 6,
    created_at: Date.now(),
  },
  {
    id: "cat-8",
    user_id: "user-1",
    name: "Freelance",
    type: "income" as const,
    icon: "PiggyBank",
    color: "#27a",
    is_fixed: false,
    order: 7,
    created_at: Date.now(),
  },
];

export const demoBudgets = [
  {
    id: "budget-1",
    user_id: "user-1",
    category_id: "cat-1",
    month: currentMonth,
    amount: 1200,
    created_at: Date.now(),
  },
  {
    id: "budget-2",
    user_id: "user-1",
    category_id: "cat-2",
    month: currentMonth,
    amount: 500,
    created_at: Date.now(),
  },
  {
    id: "budget-3",
    user_id: "user-1",
    category_id: "cat-3",
    month: currentMonth,
    amount: 2500,
    created_at: Date.now(),
  },
  {
    id: "budget-4",
    user_id: "user-1",
    category_id: "cat-4",
    month: currentMonth,
    amount: 800,
    created_at: Date.now(),
  },
];

export const demoTransactions = [
  {
    id: "tx-1",
    user_id: "user-1",
    category_id: "cat-7",
    amount: 8000,
    date: `${currentMonth}-05`,
    type: "income" as const,
    description: "Salário mensal",
    is_fixed: true,
    is_credit_card: false,
    credit_card_id: null,
    created_at: Date.now() - 86400000 * 25,
  },
  {
    id: "tx-2",
    user_id: "user-1",
    category_id: "cat-8",
    amount: 1500,
    date: `${currentMonth}-12`,
    type: "income" as const,
    description: "Projeto de design",
    is_fixed: false,
    is_credit_card: false,
    credit_card_id: null,
    created_at: Date.now() - 86400000 * 18,
  },
  {
    id: "tx-3",
    user_id: "user-1",
    category_id: "cat-3",
    amount: 2200,
    date: `${currentMonth}-01`,
    type: "expense" as const,
    description: "Aluguel",
    is_fixed: true,
    is_credit_card: false,
    credit_card_id: null,
    created_at: Date.now() - 86400000 * 29,
  },
  {
    id: "tx-4",
    user_id: "user-1",
    category_id: "cat-5",
    amount: 89.9,
    date: `${currentMonth}-03`,
    type: "expense" as const,
    description: "Streaming",
    is_fixed: true,
    is_credit_card: true,
    credit_card_id: "card-1",
    created_at: Date.now() - 86400000 * 27,
  },
  {
    id: "tx-5",
    user_id: "user-1",
    category_id: "cat-1",
    amount: 356.5,
    date: `${currentMonth}-08`,
    type: "expense" as const,
    description: "Supermercado",
    is_fixed: false,
    is_credit_card: false,
    credit_card_id: null,
    created_at: Date.now() - 86400000 * 22,
  },
  {
    id: "tx-6",
    user_id: "user-1",
    category_id: "cat-1",
    amount: 89.0,
    date: `${currentMonth}-10`,
    type: "expense" as const,
    description: "Restaurante",
    is_fixed: false,
    is_credit_card: true,
    credit_card_id: "card-1",
    created_at: Date.now() - 86400000 * 20,
  },
  {
    id: "tx-7",
    user_id: "user-1",
    category_id: "cat-2",
    amount: 45.0,
    date: `${currentMonth}-11`,
    type: "expense" as const,
    description: "Uber",
    is_fixed: false,
    is_credit_card: false,
    credit_card_id: null,
    created_at: Date.now() - 86400000 * 19,
  },
  {
    id: "tx-8",
    user_id: "user-1",
    category_id: "cat-2",
    amount: 250.0,
    date: `${currentMonth}-15`,
    type: "expense" as const,
    description: "Gasolina",
    is_fixed: false,
    is_credit_card: false,
    credit_card_id: null,
    created_at: Date.now() - 86400000 * 15,
  },
  {
    id: "tx-9",
    user_id: "user-1",
    category_id: "cat-4",
    amount: 180.0,
    date: `${currentMonth}-14`,
    type: "expense" as const,
    description: "Cinema e jantar",
    is_fixed: false,
    is_credit_card: true,
    credit_card_id: "card-1",
    created_at: Date.now() - 86400000 * 16,
  },
  {
    id: "tx-10",
    user_id: "user-1",
    category_id: "cat-6",
    amount: 300.0,
    date: `${currentMonth}-18`,
    type: "expense" as const,
    description: "Plano de saúde",
    is_fixed: true,
    is_credit_card: false,
    credit_card_id: null,
    created_at: Date.now() - 86400000 * 12,
  },
  {
    id: "tx-11",
    user_id: "user-1",
    category_id: "cat-1",
    amount: 215.0,
    date: `${currentMonth}-20`,
    type: "expense" as const,
    description: "Feira",
    is_fixed: false,
    is_credit_card: false,
    credit_card_id: null,
    created_at: Date.now() - 86400000 * 10,
  },
  {
    id: "tx-12",
    user_id: "user-1",
    category_id: "cat-4",
    amount: 50.0,
    date: `${currentMonth}-22`,
    type: "expense" as const,
    description: "Cerveja com amigos",
    is_fixed: false,
    is_credit_card: false,
    credit_card_id: null,
    created_at: Date.now() - 86400000 * 8,
  },
];

export const demoCreditCards = [
  {
    id: "card-1",
    user_id: "user-1",
    name: "Nubank",
    limit: 8000,
    closing_day: 3,
    due_day: 10,
    color: "#666666",
    created_at: Date.now(),
    bills: [
      {
        id: "bill-1",
        user_id: "user-1",
        credit_card_id: "card-1",
        month: currentMonth,
        total_amount: 320.9,
        is_paid: false,
        due_date: `${currentMonth}-10`,
        closing_date: `${previousMonth(0)}-03`,
        created_at: Date.now(),
      },
      {
        id: "bill-2",
        user_id: "user-1",
        credit_card_id: "card-1",
        month: previousMonth(1),
        total_amount: 450.0,
        is_paid: true,
        due_date: `${previousMonth(1)}-10`,
        closing_date: `${previousMonth(2)}-03`,
        created_at: Date.now() - 86400000 * 30,
      },
    ],
  },
  {
    id: "card-2",
    user_id: "user-1",
    name: "Inter",
    limit: 5000,
    closing_day: 15,
    due_day: 22,
    color: "#c44",
    created_at: Date.now(),
    bills: [
      {
        id: "bill-3",
        user_id: "user-1",
        credit_card_id: "card-2",
        month: currentMonth,
        total_amount: 0,
        is_paid: false,
        due_date: `${currentMonth}-22`,
        closing_date: `${currentMonth}-15`,
        created_at: Date.now(),
      },
    ],
  },
];

export const demoInvestments = [
  {
    id: "inv-1",
    user_id: "user-1",
    name: "Tesouro Selic",
    type: "fixed_income" as const,
    amount: 10000,
    current_value: 10450,
    monthly_contribution: 500,
    created_at: Date.now() - 86400000 * 180,
  },
  {
    id: "inv-2",
    user_id: "user-1",
    name: "FIIs",
    type: "real_estate" as const,
    amount: 5000,
    current_value: 5320,
    monthly_contribution: 200,
    created_at: Date.now() - 86400000 * 90,
  },
  {
    id: "inv-3",
    user_id: "user-1",
    name: "Bitcoin",
    type: "crypto" as const,
    amount: 2000,
    current_value: 2680,
    monthly_contribution: 100,
    created_at: Date.now() - 86400000 * 45,
  },
];

export const demoDebts = [
  {
    id: "debt-1",
    user_id: "user-1",
    creditor: "Fulano",
    description: "Empréstimo pessoal",
    total_amount: 3000,
    remaining_amount: 1200,
    monthly_payment: 300,
    due_date: `${currentMonth}-15`,
    start_date: previousMonth(5),
    is_paid: false,
    created_at: Date.now() - 86400000 * 150,
  },
  {
    id: "debt-2",
    user_id: "user-1",
    creditor: "Crediário Y",
    description: "Compra de sofá parcelado",
    total_amount: 2400,
    remaining_amount: 800,
    monthly_payment: 200,
    due_date: `${currentMonth}-10`,
    start_date: previousMonth(3),
    is_paid: false,
    created_at: Date.now() - 86400000 * 90,
  },
  {
    id: "debt-3",
    user_id: "user-1",
    creditor: "Cartão Magalu",
    description: "Compra de notebook",
    total_amount: 3500,
    remaining_amount: 0,
    monthly_payment: 0,
    due_date: `${previousMonth(1)}-20`,
    start_date: previousMonth(6),
    is_paid: true,
    created_at: Date.now() - 86400000 * 180,
  },
  {
    id: "debt-4",
    user_id: "user-1",
    creditor: "Empréstimo Bancário",
    description: "Financiamento veicular",
    total_amount: 15000,
    remaining_amount: 8800,
    monthly_payment: 620,
    due_date: `${currentMonth}-05`,
    start_date: previousMonth(10),
    is_paid: false,
    created_at: Date.now() - 86400000 * 300,
  },
];

export const demoDebtsSummary = {
  totalOwed: 23900,
  totalRemaining: 10800,
  totalPaid: 13100,
  totalMonthly: 1120,
  activeCount: 3,
  paidCount: 1,
  count: 4,
};

export const demoAccounts = [
  {
    id: "acc-1",
    user_id: "user-1",
    name: "Conta Corrente",
    type: "checking" as const,
    balance: 5240.6,
    color: "#0a0a0a",
    created_at: Date.now() - 86400000 * 365,
  },
  {
    id: "acc-2",
    user_id: "user-1",
    name: "Poupança",
    type: "savings" as const,
    balance: 12000,
    color: "#2a7",
    created_at: Date.now() - 86400000 * 180,
  },
  {
    id: "acc-3",
    user_id: "user-1",
    name: "Carteira",
    type: "cash" as const,
    balance: 350,
    color: "#a72",
    created_at: Date.now() - 86400000 * 60,
  },
];

export const demoGoals = [
  {
    id: "goal-1",
    user_id: "user-1",
    name: "Reserva de Emergência",
    target_amount: 15000,
    current_amount: 8500,
    monthly_contribution: 1000,
    target_date: `${now.getFullYear() + 1}-06`,
    category: "emergency" as const,
    is_achieved: false,
    created_at: Date.now() - 86400000 * 200,
  },
  {
    id: "goal-2",
    user_id: "user-1",
    name: "Viagem para Europa",
    target_amount: 12000,
    current_amount: 3200,
    monthly_contribution: 600,
    target_date: `${now.getFullYear() + 1}-12`,
    category: "travel" as const,
    is_achieved: false,
    created_at: Date.now() - 86400000 * 120,
  },
  {
    id: "goal-3",
    user_id: "user-1",
    name: "Carro Novo",
    target_amount: 35000,
    current_amount: 5000,
    monthly_contribution: 800,
    target_date: `${now.getFullYear() + 2}-06`,
    category: "purchase" as const,
    is_achieved: false,
    created_at: Date.now() - 86400000 * 90,
  },
  {
    id: "goal-4",
    user_id: "user-1",
    name: "Curso de Especialização",
    target_amount: 5000,
    current_amount: 5000,
    monthly_contribution: 0,
    target_date: `${currentMonth}-01`,
    category: "education" as const,
    is_achieved: true,
    created_at: Date.now() - 86400000 * 60,
  },
];

export const demoGoalsSummary = {
  totalTarget: 67000,
  totalCurrent: 21700,
  totalProgress: 32.4,
  activeGoals: 3,
  achievedGoals: 1,
  count: 4,
};

export const demoMonthlySummary = () => {
  const expenses = demoTransactions.filter((t) => t.type === "expense");
  const incomes = demoTransactions.filter((t) => t.type === "income");
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  const expensesByCategory = demoCategories
    .filter((c) => c.type === "expense")
    .map((cat) => ({
      category: cat,
      total: expenses
        .filter((t) => t.category_id === cat.id)
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter((c) => c.total > 0);

  const incomeByCategory = demoCategories
    .filter((c) => c.type === "income")
    .map((cat) => ({
      category: cat,
      total: incomes
        .filter((t) => t.category_id === cat.id)
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter((c) => c.total > 0);

  const budgetComparisons = demoBudgets.map((budget) => {
    const spent = expenses
      .filter((t) => t.category_id === budget.category_id)
      .reduce((s, t) => s + t.amount, 0);
    return {
      budget,
      spent,
      remaining: budget.amount - spent,
      percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
    };
  });

  return {
    totalIncome,
    totalExpenses,
    fixedExpenses: expenses
      .filter((t) => t.is_fixed)
      .reduce((s, t) => s + t.amount, 0),
    variableExpenses: expenses
      .filter((t) => !t.is_fixed)
      .reduce((s, t) => s + t.amount, 0),
    creditCardExpenses: expenses
      .filter((t) => t.is_credit_card)
      .reduce((s, t) => s + t.amount, 0),
    balance: totalIncome - totalExpenses,
    savingsRate:
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    expensesByCategory,
    incomeByCategory,
    budgetComparisons,
    transactionCount: demoTransactions.length,
  };
};

export const demoEvolution = [
  {
    month: previousMonth(5),
    label: monthLabel(5),
    income: 7500,
    expenses: 4200,
    balance: 3300,
  },
  {
    month: previousMonth(4),
    label: monthLabel(4),
    income: 7500,
    expenses: 4800,
    balance: 2700,
  },
  {
    month: previousMonth(3),
    label: monthLabel(3),
    income: 8500,
    expenses: 5100,
    balance: 3400,
  },
  {
    month: previousMonth(2),
    label: monthLabel(2),
    income: 7500,
    expenses: 3800,
    balance: 3700,
  },
  {
    month: previousMonth(1),
    label: monthLabel(1),
    income: 8000,
    expenses: 4600,
    balance: 3400,
  },
  {
    month: currentMonth,
    label: monthLabel(0),
    income: 9500,
    expenses: 3775.4,
    balance: 5724.6,
  },
];

export const demoHealthScore = {
  score: 72,
  status: "good" as const,
  message:
    "Saldo positivo! Mas ainda não dá pra gastar tudo em compras aleatórias na internet à meia-noite. Segura o 'eu mereço' no fim de semana! 👍",
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
