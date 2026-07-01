import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  ArrowDown,
  ArrowUp,
  Wallet,
  PiggyBank,
  Info,
} from "lucide-react";

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
          <circle
            cx="90" cy="90" r="80"
            fill="none"
            stroke="oklch(0.92 0 0)"
            strokeWidth="6"
            className="dark:stroke-[oklch(0.22 0 0)]"
          />
          <circle
            cx="90" cy="90" r="80"
            fill="none"
            stroke={getScoreColor(animatedScore)}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-200 ease-out"
            style={{ filter: `drop-shadow(0 0 4px ${getScoreColor(animatedScore)}44)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl sm:text-5xl font-light tabular-nums" style={{ color: getScoreColor(animatedScore) }}>
            {animatedScore}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase">
            {status === "excellent" ? "Excelente" : status === "good" ? "Bom" : status === "fair" ? "Atenção" : "Crítico"}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-4 max-w-[220px] leading-relaxed">
        {message}
      </p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, format = "currency" }: {
  title: string;
  value: number;
  icon: any;
  trend?: "up" | "down" | "neutral";
  format?: "currency" | "percentage";
}) {
  const formatted = format === "currency"
    ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : `${value.toFixed(1)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-sm border bg-card"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${
          trend === "up" ? "bg-success/10" : trend === "down" ? "bg-destructive/10" : "bg-secondary"
        }`}>
          <Icon className={`w-4 h-4 ${
            trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
          }`} />
        </div>
      </div>
      <div className="text-xl font-medium tracking-tight">{formatted}</div>
    </motion.div>
  );
}

function CategoryBar({ name, amount, percentage, color }: { name: string; amount: number; percentage: number; color: string }) {
  const formatted = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs flex-1 min-w-0 truncate">{name}</span>
      <span className="text-xs text-muted-foreground">{formatted}</span>
      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
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
        <span className={`text-xs ${isOver ? "text-destructive" : "text-muted-foreground"}`}>
          {spentFormatted} / {budgetFormatted}
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-destructive" : percentage > 80 ? "bg-warning" : "bg-success"}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const summary = useQuery(api.transactions.getMonthlySummary, { month: currentMonth });
  const health = useQuery(api.transactions.getFinancialHealthScore);
  const categories = useQuery(api.categories.getAll);

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const getCategoryName = (categoryId: string) => {
    return categories?.find((c: any) => c._id === categoryId)?.name || "Sem categoria";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-lg font-medium tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Resumo financeiro de {currentMonth}
          </p>
        </div>

        {/* Health Score + Stats Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Health Score */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 p-6 rounded-sm border bg-card flex flex-col items-center justify-center"
          >
            {health ? (
              <HealthScoreGauge score={health.score} status={health.status} message={health.message} />
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Info className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Adicione transações para ver seu score
                </p>
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <div className="lg:col-span-3 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <StatCard
                title="Receitas do Mês"
                value={summary?.totalIncome || 0}
                icon={ArrowUp}
                trend="up"
              />
              <StatCard
                title="Despesas do Mês"
                value={summary?.totalExpenses || 0}
                icon={ArrowDown}
                trend="down"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <StatCard
                title="Saldo"
                value={summary?.balance || 0}
                icon={Wallet}
                trend={summary && summary.balance >= 0 ? "up" : "down"}
              />
              <StatCard
                title="Taxa de Economia"
                value={summary?.savingsRate || 0}
                icon={PiggyBank}
                format="percentage"
                trend={summary && summary.savingsRate >= 0 ? "up" : "down"}
              />
            </div>

            {/* Quick breakdown */}
            {summary && (
              <div className="p-5 rounded-sm border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium">Detalhamento</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gastos Fixos</span>
                    <span>{summary.fixedExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gastos Variáveis</span>
                    <span>{summary.variableExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cartão de Crédito</span>
                    <span>{summary.creditCardExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between font-medium">
                    <span>Total de Transações</span>
                    <span>{summary.transactionCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expenses by Category + Budgets */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Expenses by Category */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-sm border bg-card"
          >
            <h3 className="text-xs font-medium mb-4">Despesas por Categoria</h3>
            {summary && summary.expensesByCategory.length > 0 ? (
              <div className="divide-y">
                {summary.expensesByCategory.map((item: any) => (
                  <CategoryBar
                    key={item.category._id}
                    name={item.category.name}
                    amount={item.total}
                    percentage={summary.totalExpenses > 0 ? (item.total / summary.totalExpenses) * 100 : 0}
                    color={item.category.color}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhuma despesa registrada este mês
              </p>
            )}
          </motion.div>

          {/* Budget Progress */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-sm border bg-card"
          >
            <h3 className="text-xs font-medium mb-4">Orçamentos</h3>
            {summary && summary.budgetComparisons.length > 0 ? (
              <div className="divide-y">
                {summary.budgetComparisons.map((item: any) => (
                  <BudgetProgress
                    key={item.budget._id}
                    categoryName={getCategoryName(item.budget.categoryId)}
                    spent={item.spent}
                    budgetAmount={item.budget.amount}
                    percentage={item.percentage}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                <a href="/budgets" className="underline hover:text-foreground">
                  Defina orçamentos
                </a>{" "}
                para acompanhar seus gastos
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
