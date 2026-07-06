import { useAuth } from "@/hooks/use-auth";
import { useDebtNotifications } from "@/hooks/use-debt-notifications";
import { parseBRLAmount } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  useCategories,
  useMonthlySummary,
  useMonthlyEvolution,
  useFinancialHealthScore,
  useDebts,
  useAccounts,
  useGoals,
  useTransactions,
  useCreditCards,
} from "@/hooks/use-supabase";
import { motion, AnimatePresence } from "framer-motion";
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
  HandCoins,
  Calendar,
  CircleDollarSign,
  CheckCircle2,
  Landmark,
  Target,
  X,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Plus,
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
  demoCategories as demoCat,
  demoTransactions,
  demoDebts as demoDebtList,
  demoAccounts as demoAcc,
  demoGoals as demoGoalList,
} from "@/lib/demo-data";
import { toast } from "sonner";
import { OnboardingModal } from "@/components/OnboardingModal";

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 bg-secondary rounded-sm w-48" />
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 h-64 bg-secondary rounded-sm" />
        <div className="lg:col-span-3 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="h-24 bg-secondary rounded-sm" />
            <div className="h-24 bg-secondary rounded-sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="h-24 bg-secondary rounded-sm" />
            <div className="h-24 bg-secondary rounded-sm" />
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 bg-secondary rounded-sm" />
        <div className="h-64 bg-secondary rounded-sm" />
      </div>
    </div>
  );
}

function HealthScoreGauge({
  score,
  status,
  message,
}: {
  score: number;
  status: string;
  message: string;
}) {
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
      }, 15);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(timer);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "oklch(0.52 0.15 178)";
    if (s >= 60) return "oklch(0.72 0.16 85)";
    return "oklch(0.58 0.19 27.33)";
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "excellent":
        return "Excelente";
      case "good":
        return "Bom";
      case "fair":
        return "Regular";
      case "poor":
        return "Ruim";
      default:
        return s;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="oklch(0.92 0 0)"
            strokeWidth="8"
          />
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={getScoreColor(animatedScore)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-200 ease-out"
            style={{
              filter: `drop-shadow(0 0 4px ${getScoreColor(animatedScore)}22)`,
            }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span
            className="text-4xl font-light tracking-tight tabular-nums"
            style={{ color: getScoreColor(animatedScore) }}
          >
            {animatedScore}
          </span>
          <span className="text-[9px] text-muted-foreground mt-0.5 tracking-wider uppercase font-semibold">
            {getStatusLabel(status)}
          </span>
        </div>
      </div>
      {message && (
        <p className="text-xs text-muted-foreground mt-3.5 max-w-[280px] leading-relaxed font-normal">
          {message}
        </p>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  format = "currency",
}: {
  title: string;
  value: number;
  icon: any;
  trend?: "up" | "down" | "neutral";
  format?: "currency" | "percentage";
}) {
  const formatted =
    format === "currency"
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
        <div
          className={`w-8 h-8 rounded-sm flex items-center justify-center ${trend === "up" ? "bg-success/10" : trend === "down" ? "bg-destructive/10" : "bg-secondary"}`}
        >
          <Icon
            className={`w-4 h-4 ${trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}
          />
        </div>
      </div>
      <div className="text-xl font-medium tracking-tight">{formatted}</div>
    </motion.div>
  );
}

function BudgetProgress({
  categoryName,
  spent,
  budgetAmount,
  percentage,
}: {
  categoryName: string;
  spent: number;
  budgetAmount: number;
  percentage: number;
}) {
  const isOver = percentage > 100;
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs">{categoryName}</span>
        <span
          className={`text-xs ${isOver ? "text-destructive" : "text-muted-foreground"}`}
        >
          {spent.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}{" "}
          /{" "}
          {budgetAmount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
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

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return {
    value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
  };
});

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("onboarding-dismissed");
    }
    return true;
  });

  // Onboarding modal
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    // Only show when user has loaded and has NOT completed onboarding
    if (user && !user.is_anonymous && user.onboarding_completed !== true) {
      setOnboardingOpen(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setOnboardingOpen(false);
  };

  // Supabase hooks
  const {
    data: realSummary,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useMonthlySummary(selectedMonth);
  const { data: realHealth, refetch: refetchHealth } =
    useFinancialHealthScore();
  const { data: realEvolution, refetch: refetchEvolution } =
    useMonthlyEvolution(6);
  const { data: realCategories, loading: catsLoading } = useCategories();
  const { data: realDebts } = useDebts();
  const { data: realAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: realGoals } = useGoals();
  const { create: createTransaction } = useTransactions();
  const { data: realCreditCards } = useCreditCards();

  // Quick Transaction states
  const [quickType, setQuickType] = useState<"expense" | "income">("expense");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [quickCategoryId, setQuickCategoryId] = useState("");
  const [quickPaymentMethod, setQuickPaymentMethod] = useState("pix");
  const [quickCreditCardId, setQuickCreditCardId] = useState("");
  const [quickAccountId, setQuickAccountId] = useState("");
  const [quickDate, setQuickDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryId || !quickAmount) {
      toast.error("Por favor preencha o valor e a categoria.");
      return;
    }
    const amount = parseBRLAmount(quickAmount);
    if (amount <= 0) {
      toast.error("Por favor insira um valor maior que zero.");
      return;
    }

    const isCreditCard = quickPaymentMethod === "credit_card";
    if (!isCreditCard && !quickAccountId) {
      toast.error("Por favor selecione a conta bancária.");
      return;
    }

    setQuickSubmitting(true);
    try {
      if (!useDemo) {
        let descriptionValue = quickDescription.trim();
        const selectedAcc = accounts.find((a: any) => a.id === quickAccountId);

        if (!isCreditCard) {
          const label =
            quickPaymentMethod === "pix"
              ? "PIX"
              : quickPaymentMethod === "cash"
                ? "Dinheiro"
                : quickPaymentMethod === "debit"
                  ? "Débito"
                  : "";
          if (label) {
            descriptionValue = descriptionValue
              ? `[${label}] ${descriptionValue}`
              : `[${label}]`;
          }
        }

        // Prepend account prefix to description
        if (!isCreditCard && selectedAcc) {
          descriptionValue = `[Conta: ${selectedAcc.name}] ${descriptionValue}`;
        }

        // Nova Transação: aplicar saldo na conta
        if (selectedAcc) {
          const newBalance =
            quickType === "income"
              ? selectedAcc.balance + amount
              : selectedAcc.balance - amount;
          await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", selectedAcc.id);
        }

        await createTransaction({
          category_id: quickCategoryId,
          amount,
          date: quickDate,
          type: quickType,
          description: descriptionValue || null,
          is_fixed: false,
          is_credit_card: isCreditCard,
          credit_card_id:
            isCreditCard && quickCreditCardId ? quickCreditCardId : null,
        });

        toast.success("Transação registrada!");

        await Promise.all([
          refetchSummary(),
          refetchHealth(),
          refetchEvolution(),
          refetchAccounts(),
        ]);
      } else {
        toast.info("Transações não são salvas no modo demonstração.");
      }

      setQuickAmount("");
      setQuickDescription("");
      setQuickCategoryId("");
      setQuickPaymentMethod("pix");
      setQuickCreditCardId("");
      setQuickAccountId("");
      setQuickDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      toast.error("Erro ao salvar transação rápida.");
      console.error(err);
    } finally {
      setQuickSubmitting(false);
    }
  };

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => {
    if (!isLoading && !summaryLoading && !catsLoading) {
      setUseDemo(!!user?.is_anonymous && realCategories.length === 0);
    }
  }, [isLoading, summaryLoading, catsLoading, realCategories, user]);

  const summary = useDemo ? demoMonthlySummary() : (realSummary ?? undefined);
  const health = useDemo ? demoHealthScore : (realHealth ?? undefined);
  const evolution = useDemo ? demoEvolution : (realEvolution ?? []);
  const categories = useDemo ? demoCat : realCategories;
  const debts = useDemo ? demoDebtList : realDebts;
  const accounts = useDemo ? demoAcc : realAccounts;
  const goals = useDemo ? demoGoalList : realGoals;

  useDebtNotifications(debts);

  if (isLoading)
    return (
      <DashboardLayout>
        <LoadingSkeleton />
      </DashboardLayout>
    );
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const getCategoryName = (categoryId: string) => {
    return (
      categories?.find((c: any) => c.id === categoryId)?.name || "Sem categoria"
    );
  };

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("onboarding-dismissed", "true");
  };

  const totalAccountsBalance = accounts.reduce(
    (s: number, a: any) => s + a.balance,
    0,
  );
  const totalDebtsRemaining = debts
    .filter((d: any) => !d.is_paid)
    .reduce((s: number, d: any) => s + d.remaining_amount, 0);
  const netWorth = totalAccountsBalance - totalDebtsRemaining;

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 relative"
          >
            <button
              onClick={dismissOnboarding}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">
                  Bem-vindo ao Zenfi! 🎉
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Aqui você pode controlar suas{" "}
                  <strong>receitas e despesas</strong>, definir{" "}
                  <strong>orçamentos</strong>, acompanhar{" "}
                  <strong>cartões de crédito</strong>,{" "}
                  <strong>investimentos</strong>, <strong>dívidas</strong>,
                  <strong> contas bancárias</strong> e{" "}
                  <strong>metas financeiras</strong>. Tudo de forma simples e
                  gratuita.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <a
                    href="/transactions"
                    className="text-[10px] underline hover:text-foreground text-muted-foreground transition-colors"
                  >
                    Adicionar transações
                  </a>
                  <a
                    href="/categories"
                    className="text-[10px] underline hover:text-foreground text-muted-foreground transition-colors"
                  >
                    Criar categorias
                  </a>
                  <button
                    onClick={dismissOnboarding}
                    className="text-[10px] underline hover:text-foreground text-muted-foreground transition-colors"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {useDemo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3" />
            Modo demonstração — dados de exemplo.{" "}
            <button
              onClick={() => window.location.reload()}
              className="underline hover:text-foreground"
            >
              Recarregar
            </button>{" "}
            após configurar Supabase.
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {(() => {
            const activeDebts = debts.filter((d: any) => !d.is_paid);
            const overdue = activeDebts.filter((d: any) => {
              const due = new Date(
                d.due_date + (d.due_date.includes("T") ? "" : "T00:00:00"),
              );
              return due < now;
            });
            const dueSoon = activeDebts.filter((d: any) => {
              const due = new Date(
                d.due_date + (d.due_date.includes("T") ? "" : "T00:00:00"),
              );
              const daysUntil = Math.ceil(
                (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              return daysUntil >= 0 && daysUntil <= 7 && !overdue.includes(d);
            });

            if (!activeDebts.length) return null;

            return (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-sm border px-4 py-3 flex-1 ${overdue.length > 0 ? "border-destructive/30 bg-destructive/5" : dueSoon.length > 0 ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${overdue.length > 0 ? "bg-destructive/10" : dueSoon.length > 0 ? "bg-warning/10" : "bg-success/10"}`}
                  >
                    {overdue.length > 0 ? (
                      <span className="text-destructive text-sm font-bold">
                        !
                      </span>
                    ) : dueSoon.length > 0 ? (
                      <Calendar className="w-4 h-4 text-warning" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {overdue.length > 0 && (
                      <>
                        <p className="text-xs font-medium text-destructive">
                          {overdue.length} dívida
                          {overdue.length !== 1 ? "s" : ""} atrasada
                          {overdue.length !== 1 ? "s" : ""}
                        </p>
                        <div className="mt-1.5 space-y-1">
                          {overdue.slice(0, 3).map((d: any) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between text-[10px]"
                            >
                              <span className="text-muted-foreground truncate">
                                {d.creditor}
                              </span>
                              <span className="tabular-nums text-destructive font-medium ml-2 shrink-0">
                                {d.remaining_amount.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </div>
                          ))}
                          {overdue.length > 3 && (
                            <p className="text-[10px] text-muted-foreground">
                              e mais {overdue.length - 3}...
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {overdue.length === 0 && dueSoon.length > 0 && (
                      <>
                        <p className="text-xs font-medium text-warning">
                          {dueSoon.length} dívida
                          {dueSoon.length !== 1 ? "s" : ""} vence
                          {dueSoon.length === 1 ? "" : "m"} nos próximos 7 dias
                        </p>
                        <div className="mt-1.5 space-y-1">
                          {dueSoon.slice(0, 3).map((d: any) => {
                            const due = new Date(
                              d.due_date +
                                (d.due_date.includes("T") ? "" : "T00:00:00"),
                            );
                            const daysUntil = Math.ceil(
                              (due.getTime() - now.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );
                            const dayLabel =
                              daysUntil === 0
                                ? "hoje"
                                : daysUntil === 1
                                  ? "amanhã"
                                  : `em ${daysUntil} dias`;
                            return (
                              <div
                                key={d.id}
                                className="flex items-center justify-between text-[10px]"
                              >
                                <span className="text-muted-foreground truncate">
                                  {d.creditor} · {dayLabel}
                                </span>
                                <span className="tabular-nums font-medium ml-2 shrink-0">
                                  {d.remaining_amount.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </span>
                              </div>
                            );
                          })}
                          {dueSoon.length > 3 && (
                            <p className="text-[10px] text-muted-foreground">
                              e mais {dueSoon.length - 3}...
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {overdue.length === 0 && dueSoon.length === 0 && (
                      <p className="text-xs font-medium text-success">
                        Todas as dívidas em dia! 🎉
                      </p>
                    )}
                    <a
                      href="/debts"
                      className="text-[10px] text-muted-foreground underline hover:text-foreground transition-colors mt-1.5 inline-block"
                    >
                      Ver todas as dívidas
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })()}

          <div className="shrink-0">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs h-9 rounded-sm border bg-background px-3 text-muted-foreground focus:outline-none w-full sm:w-auto"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-sm border bg-card"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              Patrimônio Líquido
            </span>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Landmark className="w-3 h-3" /> Ativos:{" "}
                {formatCurrency(totalAccountsBalance)}
              </span>
              <span className="flex items-center gap-1">
                <HandCoins className="w-3 h-3" /> Passivos:{" "}
                {formatCurrency(totalDebtsRemaining)}
              </span>
            </div>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-light tabular-nums ${netWorth >= 0 ? "text-success" : "text-destructive"}`}
          >
            {formatCurrency(netWorth)}
          </p>
        </motion.div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Resumo financeiro de {selectedMonth}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 p-6 rounded-sm border bg-card flex flex-col items-center justify-center"
          >
            {health ? (
              <HealthScoreGauge
                score={health.score}
                status={health.status}
                message={health.message}
              />
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
            {summary && (
              <div className="p-5 rounded-sm border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium">Detalhamento</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gastos Fixos</span>
                    <span>
                      {summary.fixedExpenses.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Gastos Variáveis
                    </span>
                    <span>
                      {summary.variableExpenses.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Cartão de Crédito
                    </span>
                    <span>
                      {summary.creditCardExpenses.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
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

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-sm border bg-card"
          >
            <h3 className="text-xs font-medium mb-4">Despesas por Categoria</h3>
            {summary && summary.expensesByCategory.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={summary.expensesByCategory.map((item: any) => ({
                        name: item.category.name,
                        value: item.total,
                        color: item.category.color,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {summary.expensesByCategory.map((item: any) => (
                        <Cell
                          key={item.category.id}
                          fill={item.category.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-sm border bg-card px-3 py-2 text-xs shadow-sm">
                            <p className="font-medium mb-1">{data.name}</p>
                            <p className="text-muted-foreground">
                              {data.value.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                  {summary.expensesByCategory.map((item: any) => (
                    <div
                      key={item.category.id}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{ backgroundColor: item.category.color }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {item.category.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-12">
                Nenhuma despesa registrada este mês
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-sm border bg-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium">Evolução Mensal</h3>
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            {evolution &&
            evolution.length > 0 &&
            evolution.some((e: any) => e.income > 0 || e.expenses > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={evolution}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="oklch(0.45 0.13 145)"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(0.45 0.13 145)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="expenseGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="oklch(0.58 0.19 27.33)"
                        stopOpacity={0.1}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(0.58 0.19 27.33)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.92 0 0)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }}
                    axisLine={false}
                    tickLine={false}
                    dx={-4}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-sm border bg-card px-3 py-2 text-xs shadow-sm">
                          <p className="font-medium mb-1.5">{label}</p>
                          {payload.map((entry: any) => (
                            <div
                              key={entry.name}
                              className="flex items-center justify-between gap-4 py-0.5"
                            >
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-1.5 h-1.5 rounded-sm"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-muted-foreground">
                                  {entry.name === "income"
                                    ? "Receitas"
                                    : "Despesas"}
                                </span>
                              </div>
                              <span className="tabular-nums">
                                {entry.value.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </div>
                          ))}
                          ,
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="oklch(0.45 0.13 145)"
                    fill="url(#incomeGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "oklch(0.45 0.13 145)",
                      stroke: "none",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="oklch(0.58 0.19 27.33)"
                    fill="url(#expenseGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "oklch(0.58 0.19 27.33)",
                      stroke: "none",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-12">
                Adicione transações nos meses anteriores para ver a evolução
              </p>
            )}
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-sm border bg-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium">Orçamentos do Mês</h3>
              <a
                href="/budgets"
                className="text-[10px] text-muted-foreground underline hover:text-foreground transition-colors"
              >
                Gerenciar
              </a>
            </div>
            {summary && summary.budgetComparisons.length > 0 ? (
              <div className="space-y-1">
                {summary.budgetComparisons.slice(0, 5).map((item: any) => (
                  <BudgetProgress
                    key={item.budget.id}
                    categoryName={getCategoryName(item.budget.category_id)}
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

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-sm border bg-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium">Transação Rápida</h3>
                <span className="text-[10px] text-muted-foreground">
                  Registre instantaneamente
                </span>
              </div>

              <form onSubmit={handleQuickSubmit} className="space-y-4">
                {/* Seleção de Tipo */}
                <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickType("expense");
                      setQuickCategoryId("");
                      setQuickPaymentMethod("pix");
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                      quickType === "expense"
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" /> Saída
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickType("income");
                      setQuickCategoryId("");
                      setQuickPaymentMethod("pix");
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                      quickType === "income"
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" /> Entrada
                  </button>
                </div>

                {/* Inputs de Valor, Categoria e Descrição */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">
                      Valor (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(e.target.value)}
                      required
                      className="w-full text-xs h-8 px-2.5 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">
                      Categoria
                    </label>
                    <select
                      value={quickCategoryId}
                      onChange={(e) => setQuickCategoryId(e.target.value)}
                      required
                      className="w-full text-xs h-8 px-2 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-muted-foreground"
                    >
                      <option value="">Selecione...</option>
                      {categories
                        .filter((c: any) => c.type === quickType)
                        .map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Descrição e Data */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">
                      Descrição (opcional)
                    </label>
                    <input
                      placeholder="Ex: Padaria, Salário..."
                      value={quickDescription}
                      onChange={(e) => setQuickDescription(e.target.value)}
                      className="w-full text-xs h-8 px-2.5 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block font-medium">
                      Data
                    </label>
                    <input
                      type="date"
                      value={quickDate}
                      onChange={(e) => setQuickDate(e.target.value)}
                      required
                      className="w-full text-xs h-8 px-2.5 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Forma de pagamento */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">
                    {quickType === "expense"
                      ? "Forma de pagamento"
                      : "Forma de recebimento"}
                  </label>
                  <div
                    className={`grid gap-1.5 ${quickType === "expense" ? "grid-cols-4" : "grid-cols-2"}`}
                  >
                    {(quickType === "expense"
                      ? [
                          {
                            value: "credit_card",
                            label: "Cartão",
                            icon: CreditCard,
                            color: "#8b5cf6",
                          },
                          {
                            value: "pix",
                            label: "PIX",
                            icon: Smartphone,
                            color: "#22c55e",
                          },
                          {
                            value: "cash",
                            label: "Dinheiro",
                            icon: Banknote,
                            color: "#f97316",
                          },
                          {
                            value: "debit",
                            label: "Débito",
                            icon: Building2,
                            color: "#3b82f6",
                          },
                        ]
                      : [
                          {
                            value: "pix",
                            label: "PIX",
                            icon: Smartphone,
                            color: "#22c55e",
                          },
                          {
                            value: "cash",
                            label: "Dinheiro",
                            icon: Banknote,
                            color: "#f97316",
                          },
                        ]
                    ).map((opt) => {
                      const Icon = opt.icon;
                      const selected = quickPaymentMethod === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setQuickPaymentMethod(opt.value)}
                          className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg border text-center transition-all duration-200 ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background hover:border-primary/40 hover:bg-secondary/60"
                          }`}
                        >
                          <Icon
                            className="w-3 h-3"
                            style={{ color: selected ? opt.color : undefined }}
                          />
                          <span className="text-[9px] font-medium leading-none mt-0.5">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seleção de Cartão de Crédito */}
                <AnimatePresence>
                  {quickType === "expense" &&
                    quickPaymentMethod === "credit_card" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="text-[10px] text-muted-foreground mb-1 block font-medium">
                          Selecionar Cartão
                        </label>
                        {realCreditCards && realCreditCards.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {realCreditCards.map((card: any) => (
                              <button
                                key={card.id}
                                type="button"
                                onClick={() => setQuickCreditCardId(card.id)}
                                className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all duration-200 ${
                                  quickCreditCardId === card.id
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-background hover:border-primary/40"
                                }`}
                              >
                                <div
                                  className="w-4 h-4 rounded-sm shrink-0"
                                  style={{
                                    backgroundColor: card.color || "#8b5cf6",
                                  }}
                                />
                                <span className="text-[10px] font-medium truncate">
                                  {card.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] text-muted-foreground p-2 bg-secondary/50 rounded-lg">
                            Nenhum cartão cadastrado.{" "}
                            <a
                              href="/credit-cards"
                              className="text-primary underline"
                            >
                              Cadastrar
                            </a>
                          </p>
                        )}
                      </motion.div>
                    )}
                </AnimatePresence>

                {/* Seleção de Conta Bancária */}
                <AnimatePresence>
                  {quickType && quickPaymentMethod !== "credit_card" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-1"
                    >
                      <label className="text-[10px] text-muted-foreground block font-medium">
                        {quickType === "expense"
                          ? "Pagar com a Conta"
                          : "Receber na Conta"}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      {accounts && accounts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {accounts.map((acc: any) => (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => setQuickAccountId(acc.id)}
                              className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all duration-200 ${
                                quickAccountId === acc.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border bg-background hover:border-primary/40"
                              }`}
                            >
                              <div
                                className="w-4 h-4 rounded-sm shrink-0"
                                style={{
                                  backgroundColor: acc.color || "#6366f1",
                                }}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-semibold truncate leading-none mb-0.5">
                                  {acc.name}
                                </span>
                                <span className="text-[9px] text-muted-foreground leading-none">
                                  {acc.balance.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-muted-foreground p-2 bg-secondary/50 rounded-lg">
                          Nenhuma conta cadastrada.{" "}
                          <a
                            href="/accounts"
                            className="text-primary underline"
                          >
                            Cadastrar
                          </a>
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botão de Envio */}
                <button
                  type="submit"
                  disabled={quickSubmitting || !quickCategoryId || !quickAmount}
                  className="w-full text-[10px] font-semibold h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {quickSubmitting ? "Registrando..." : "Registrar Transação"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-5 rounded-sm border bg-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium">Dívidas Pendentes</h3>
              <a
                href="/debts"
                className="text-[10px] text-muted-foreground underline hover:text-foreground transition-colors"
              >
                Gerenciar
              </a>
            </div>
            {debts.filter((d: any) => !d.is_paid).length > 0 ? (
              <div className="space-y-0 divide-y">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-sm bg-destructive/10 flex items-center justify-center">
                      <HandCoins className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Total a pagar
                      </span>
                      <p className="text-base font-medium tabular-nums">
                        {formatCurrency(
                          debts
                            .filter((d: any) => !d.is_paid)
                            .reduce(
                              (s: number, d: any) => s + d.remaining_amount,
                              0,
                            ),
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {debts.filter((d: any) => !d.is_paid).length} pendente
                    {debts.filter((d: any) => !d.is_paid).length !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
                {debts
                  .filter((d: any) => !d.is_paid)
                  .sort(
                    (a: any, b: any) =>
                      new Date(a.due_date).getTime() -
                      new Date(b.due_date).getTime(),
                  )
                  .slice(0, 4)
                  .map((debt: any) => {
                    const dueDate = new Date(
                      debt.due_date +
                        (debt.due_date.includes("T") ? "" : "T00:00:00"),
                    );
                    const isOverdue = dueDate < now;
                    const daysUntilDue = Math.ceil(
                      (dueDate.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return (
                      <div
                        key={debt.id}
                        className="flex items-center justify-between py-2.5 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium truncate">
                              {debt.creditor}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] px-1 py-0.5 rounded-sm bg-destructive/10 text-destructive font-medium">
                                Atrasada
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex items-center gap-1">
                              <CircleDollarSign className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] tabular-nums text-muted-foreground">
                                Restam {formatCurrency(debt.remaining_amount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span
                                className={`text-[10px] tabular-nums ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
                              >
                                {dueDate.toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                                {!isOverdue && daysUntilDue <= 7 && (
                                  <span className="ml-1 text-warning">
                                    ({daysUntilDue}d)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs tabular-nums ml-4 shrink-0">
                          {formatCurrency(debt.total_amount)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                Nenhuma dívida pendente
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-5 rounded-sm border bg-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium">Metas Financeiras</h3>
              <a
                href="/goals"
                className="text-[10px] text-muted-foreground underline hover:text-foreground transition-colors"
              >
                Gerenciar
              </a>
            </div>
            {goals.filter((g: any) => !g.is_achieved).length > 0 ? (
              <div className="space-y-3">
                {goals
                  .filter((g: any) => !g.is_achieved)
                  .slice(0, 3)
                  .map((goal: any) => {
                    const progress =
                      goal.target_amount > 0
                        ? (goal.current_amount / goal.target_amount) * 100
                        : 0;
                    return (
                      <div key={goal.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Target className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs truncate">
                              {goal.name}
                            </span>
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {formatCurrency(goal.current_amount)} /{" "}
                            {formatCurrency(goal.target_amount)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-success"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                {goals.filter((g: any) => !g.is_achieved).length > 3 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-1">
                    e mais {goals.filter((g: any) => !g.is_achieved).length - 3}{" "}
                    meta
                    {goals.filter((g: any) => !g.is_achieved).length - 3 !== 1
                      ? "s"
                      : ""}
                    ...
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                <a href="/goals" className="underline hover:text-foreground">
                  Crie metas financeiras
                </a>{" "}
                para acompanhar seu progresso
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {user && (
        <OnboardingModal
          user={user}
          open={onboardingOpen}
          onComplete={handleOnboardingComplete}
        />
      )}
    </DashboardLayout>
  );
}
