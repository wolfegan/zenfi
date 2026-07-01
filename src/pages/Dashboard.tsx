import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  ArrowDown,
  ArrowUp,
  Wallet,
  PiggyBank,
  Info,
  TrendingUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  demoMonthlySummary,
  demoHealthScore,
  demoEvolution,
  demoCategories,
  demoTransactions,
} from "@/lib/demo-data";

function HealthScoreGauge({ score, status, message }: { score: number; status: string; message: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * 80;

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedScore((prev) => {
          if (prev >= score) {
            clearInterval(interval);
            return score;
          }
          return prev + 1;
        });
      }, 25);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "oklch(0.45 0.13 145)";
    if (s >= 60) return "oklch(0.65 0.14 100)";
    if (s >= 40) return "oklch(0.75 0.14 75)";
    return "oklch(0.58 0.19 27.33)";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44 sm:w-52 sm:h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="80" fill="none" stroke="oklch(0.92 0 0)" strokeWidth="6" className="dark:stroke-[oklch(0.22 0 0)]" />
          <circle cx="90" cy="90" r="80" fill="none" stroke={getScoreColor(animatedScore)} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-200 ease-out" style={{ filter: `drop-shadow(0 0 4px ${getScoreColor(animatedScore)}44)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl sm:text-5xl font-light tabular-nums" style={{ color: getScoreColor(animatedScore) }}>{animatedScore}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase">
            {status === "excellent" ? "Excelente" : status === "good" ? "Bom" : status === "fair" ? "Atenção" : "Crítico"}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-4 max-w-[220px] leading-relaxed">{message}</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, format = "currency" }: {
  title: string; value: number; icon: any; trend?: "up" | "down" | "neutral"; format?: "currency" | "percentage";
}) {
  const formatted = format === "currency"
    ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : `${value.toFixed(1)}%`;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-sm border bg-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${trend === "up" ? "bg-success/10" : trend === "down" ? "bg-destructive/10" : "bg-secondary"}`}>
          <Icon className={`w-4 h-4 ${trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`} />
        </div>
      </div>
      <div className="text-xl font-medium tracking-tight">{formatted}</div>
    </motion.div>
  );
}

function BudgetProgress({ categoryName, spent, budgetAmount, percentage }: {
  categoryName: string; spent: number; budgetAmount: number; percentage: number;
}) {
  const spentFormatted = spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const budgetFormatted = budgetAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const isOver = percentage > 100;
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs">{categoryName}</span>
        <span className={`text-xs ${isOver ? "text-destructive" : "text-muted-foreground"}`}>{spentFormatted} / {budgetFormatted}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-destructive" : percentage > 80 ? "bg-warning" : "bg-success"}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Real queries
  const realSummary = useQuery(api.transactions.getMonthlySummary, { month: currentMonth });
  const realHealth = useQuery(api.transactions.getFinancialHealthScore);
  const realEvolution = useQuery(api.transactions.getMonthlyEvolution, { months: 6 });
  const realCategories = useQuery(api.categories.getAll);

  // Demo data fallback: use demo when all real queries resolve to undefined (server error)
  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      const allFailed = realSummary === undefined && realHealth === undefined && realEvolution === undefined && realCategories === undefined;
      setUseDemo(allFailed);
    }
  }, [isLoading, realSummary, realHealth, realEvolution, realCategories]);

  const summary = useDemo ? demoMonthlySummary() : (realSummary ?? undefined);
  const health = useDemo ? demoHealthScore : (realHealth ?? undefined);
  const evolution = useDemo ? demoEvolution : (realEvolution ?? undefined);
  const categories = useDemo ? demoCategories : (realCategories ?? undefined);

  if (isLoading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const getCategoryName = (categoryId: string) => {
    return categories?.find((c: any) => c._id === categoryId)?.name || "Sem categoria";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Demo mode badge */}
        {useDemo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3" />
            Modo demonstração — dados de exemplo.{" "}
            <button onClick={() => window.location.reload()} className="underline hover:text-foreground">Recarregar</button> após fazer deploy.
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-lg font-medium tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">Resumo financeiro de {currentMonth}</p>
        </div>

        {/* Health Score + Stats Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 p-6 rounded-sm border bg-card flex flex-col items-center justify-center">
            {health ? <HealthScoreGauge score={health.score} status={health.status} message={health.message} /> : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3"><Info className="w-5 h-5 text-muted-foreground" /></div>
                <p className="text-xs text-muted-foreground">Adicione transações para ver seu score</p>
              </div>
            )}
          </motion.div>
          <div className="lg:col-span-3 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <StatCard title="Receitas do Mês" value={summary?.totalIncome || 0} icon={ArrowUp} trend="up" />
              <StatCard title="Despesas do Mês" value={summary?.totalExpenses || 0} icon={ArrowDown} trend="down" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <StatCard title="Saldo" value={summary?.balance || 0} icon={Wallet} trend={summary && summary.balance >= 0 ? "up" : "down"} />
              <StatCard title="Taxa de Economia" value={summary?.savingsRate || 0} icon={PiggyBank} format="percentage" trend={summary && summary.savingsRate >= 0 ? "up" : "down"} />
            </div>
            {summary && (
              <div className="p-5 rounded-sm border bg-card">
                <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium">Detalhamento</span></div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Gastos Fixos</span><span>{summary.fixedExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Gastos Variáveis</span><span>{summary.variableExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Cartão de Crédito</span><span>{summary.creditCardExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
                  <div className="border-t pt-2 flex items-center justify-between font-medium"><span>Total de Transações</span><span>{summary.transactionCount}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-sm border bg-card">
            <h3 className="text-xs font-medium mb-4">Despesas por Categoria</h3>
            {summary && summary.expensesByCategory.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={summary.expensesByCategory.map((item: any) => ({ name: item.category.name, value: item.total, color: item.category.color }))} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                      {summary.expensesByCategory.map((item: any) => <Cell key={item.category._id} fill={item.category.color} stroke="none" />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return <div className="rounded-sm border bg-card px-3 py-2 text-xs shadow-sm"><p className="font-medium mb-1">{data.name}</p><p className="text-muted-foreground">{data.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                  {summary.expensesByCategory.map((item: any) => (
                    <div key={item.category._id} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: item.category.color }} />
                      <span className="text-[10px] text-muted-foreground">{item.category.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-12">Nenhuma despesa registrada este mês</p>}
          </motion.div>

          {/* Line Chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-sm border bg-card">
            <div className="flex items-center justify-between mb-4"><h3 className="text-xs font-medium">Evolução Mensal</h3><TrendingUp className="w-3.5 h-3.5 text-muted-foreground" /></div>
            {evolution && evolution.length > 0 && evolution.some((e: any) => e.income > 0 || e.expenses > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={evolution}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.45 0.13 145)" stopOpacity={0.15} /><stop offset="95%" stopColor="oklch(0.45 0.13 145)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.58 0.19 27.33)" stopOpacity={0.1} /><stop offset="95%" stopColor="oklch(0.58 0.19 27.33)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }} axisLine={false} tickLine={false} dx={-4} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return <div className="rounded-sm border bg-card px-3 py-2 text-xs shadow-sm">
                      <p className="font-medium mb-1.5">{label}</p>
                      {payload.map((entry: any) => <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: entry.color }} /><span className="text-muted-foreground">{entry.name === "income" ? "Receitas" : "Despesas"}</span></div>
                        <span className="tabular-nums">{entry.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </div>)}
                    </div>;
                  }} />
                  <Area type="monotone" dataKey="income" stroke="oklch(0.45 0.13 145)" fill="url(#incomeGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "oklch(0.45 0.13 145)", stroke: "none" }} />
                  <Area type="monotone" dataKey="expenses" stroke="oklch(0.58 0.19 27.33)" fill="url(#expenseGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "oklch(0.58 0.19 27.33)", stroke: "none" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-muted-foreground text-center py-12">Adicione transações nos meses anteriores para ver a evolução</p>}
          </motion.div>
        </div>

        {/* Budget Progress */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-sm border bg-card">
          <h3 className="text-xs font-medium mb-4">Orçamentos do Mês</h3>
          {summary && summary.budgetComparisons.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
              {summary.budgetComparisons.map((item: any) => (
                <BudgetProgress key={item.budget._id} categoryName={getCategoryName(item.budget.categoryId)} spent={item.spent} budgetAmount={item.budget.amount} percentage={item.percentage} />
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-8"><a href="/budgets" className="underline hover:text-foreground">Defina orçamentos</a> para acompanhar seus gastos</p>}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
