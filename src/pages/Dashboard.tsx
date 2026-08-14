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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import { OFXImportModal } from "@/components/OFXImportModal";
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
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { BankLogo } from "@/components/BankLogo";
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
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    // Only show when user has loaded and has NOT completed onboarding
    if (user && !user.is_anonymous && user.onboarding_completed !== true) {
      setOnboardingOpen(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setOnboardingOpen(false);
  };

  // Limpeza automática de segurança para conta de demonstração
  useEffect(() => {
    if (user?.is_anonymous) {
      Promise.all([
        supabase.from("transactions").delete().eq("user_id", user.id),
        supabase.from("credit_cards").delete().eq("user_id", user.id),
        supabase.from("debts").delete().eq("user_id", user.id),
        supabase.from("accounts").delete().eq("user_id", user.id),
        supabase.from("categories").delete().eq("user_id", user.id),
        supabase.from("goals").delete().eq("user_id", user.id),
        supabase.from("monthly_budgets").delete().eq("user_id", user.id),
      ]).catch(() => {});
    }
  }, [user]);

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

  const [hideBalance, setHideBalance] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("zenfi_hide_balance") === "true";
    }
    return false;
  });

  const toggleHideBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      localStorage.setItem("zenfi_hide_balance", String(next));
      return next;
    });
  };

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

  const [ofxOpen, setOfxOpen] = useState(false);
  const useDemo = !!user?.is_anonymous;

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

  const formatCurrency = (v: number) => {
    if (hideBalance) return "R$ ••••••";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {(user?.is_anonymous || useDemo) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                    Modo de Demonstração (Dados 100% Fictícios)
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                    Jan a Ago 2026
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Você está navegando em uma <strong>conta de testes de demonstração</strong> com simulação completa de transações, cartões, dívidas e metas. 
                  Para iniciar com suas finanças reais, acesse Configurações e selecione "Redefinir Conta".
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
              <a href="/settings" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 text-amber-950 hover:bg-amber-400 transition-colors shadow-xs">
                  Redefinir / Começar do Zero
                </button>
              </a>
            </div>
          </motion.div>
        )}

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

        </div>

        {/* Hero Header Bar (Title, Privacy Eye & Month Filter) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/80 p-4 sm:p-5 rounded-2xl border border-border/60 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">Visão Geral Financeira</h1>
                <button
                  onClick={toggleHideBalance}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title={hideBalance ? "Exibir valores" : "Ocultar valores"}
                >
                  {hideBalance ? <EyeOff className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Resumo do mês de {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setOfxOpen(true)}
              className="h-9 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Importar OFX</span>
            </button>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs rounded-xl bg-background border-border">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 4 Main Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo Atual em Contas */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl border bg-card hover:border-primary/40 transition-all shadow-xs relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Saldo Atual em Contas
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {formatCurrency(totalAccountsBalance)}
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground">
              <span>{accounts.length} conta{accounts.length !== 1 ? "s" : ""} cadastrada{accounts.length !== 1 ? "s" : ""}</span>
              <a href="/accounts" className="text-primary font-medium hover:underline flex items-center gap-0.5">
                Ver contas →
              </a>
            </div>
          </motion.div>

          {/* Receitas (Entradas) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl border bg-card hover:border-emerald-500/40 transition-all shadow-xs relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Entradas (Receitas)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary?.totalIncome || 0)}
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground">
              <span>No mês selecionado</span>
              <a href="/transactions" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                Detalhes →
              </a>
            </div>
          </motion.div>

          {/* Despesas (Saídas) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 rounded-2xl border bg-card hover:border-rose-500/40 transition-all shadow-xs relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Saídas (Despesas)
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(summary?.totalExpenses || 0)}
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground">
              <span>No mês selecionado</span>
              <a href="/transactions" className="text-rose-600 dark:text-rose-400 font-medium hover:underline">
                Detalhes →
              </a>
            </div>
          </motion.div>

          {/* Cartões de Crédito */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl border bg-card hover:border-purple-500/40 transition-all shadow-xs relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cartões de Crédito
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-purple-600 dark:text-purple-400">
              {formatCurrency(summary?.creditCardExpenses || 0)}
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground">
              <span>Faturas em aberto</span>
              <a href="/credit-cards" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                Ver faturas →
              </a>
            </div>
          </motion.div>
        </div>

        {/* Main Dashboard Desktop & Mobile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (lg:col-span-2) — Analytics, Charts & Active Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balanço & Evolução Mensal Chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl border bg-card shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Balanço & Evolução Mensal</h3>
                  <p className="text-xs text-muted-foreground">Comparativo de entradas e saídas ao longo dos meses</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Receitas
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Despesas
                  </span>
                </div>
              </div>
              {evolution && evolution.length > 0 && evolution.some((e: any) => e.income > 0 || e.expenses > 0) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={evolution}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "oklch(0.55 0 0)" }} axisLine={false} tickLine={false} dy={8} />
                    <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0 0)" }} axisLine={false} tickLine={false} dx={-4} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0))} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-xl border bg-card px-3 py-2 text-xs shadow-md">
                            <p className="font-semibold mb-1.5">{label}</p>
                            {payload.map((entry: any) => (
                              <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="text-muted-foreground">{entry.name === "income" ? "Receitas" : "Despesas"}</span>
                                </div>
                                <span className="tabular-nums font-semibold">{formatCurrency(entry.value)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#10b981" }} />
                    <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#expenseGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#f43f5e" }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-12">
                  Adicione transações nos meses anteriores para acompanhar a evolução gráfica.
                </p>
              )}
            </motion.div>

            {/* Despesas por Categoria (Donut Chart & Breakdown) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-6 rounded-2xl border bg-card shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Despesas por Categoria</h3>
                  <p className="text-xs text-muted-foreground">Distribuição dos seus gastos do mês atual</p>
                </div>
                <a href="/categories" className="text-xs text-primary font-semibold hover:underline">
                  Gerenciar categorias →
                </a>
              </div>
              {summary && summary.expensesByCategory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
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
                        outerRadius={88}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {summary.expensesByCategory.map((item: any) => (
                          <Cell key={item.category.id} fill={item.category.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl border bg-card px-3 py-2 text-xs shadow-md">
                              <p className="font-semibold mb-1">{data.name}</p>
                              <p className="text-muted-foreground font-bold">{formatCurrency(data.value)}</p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2.5">
                    {summary.expensesByCategory.slice(0, 5).map((item: any) => {
                      const totalExp = summary.totalExpenses || 1;
                      const pct = Math.round((item.total / totalExp) * 100);
                      return (
                        <div key={item.category.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: item.category.color }} />
                            <span className="font-medium truncate">{item.category.name}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-muted-foreground font-mono text-[11px]">{pct}%</span>
                            <span className="font-semibold tabular-nums">{formatCurrency(item.total)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-12">
                  Nenhuma despesa registrada no mês selecionado.
                </p>
              )}
            </motion.div>

            {/* Cartões de Crédito Ativos */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl border bg-card shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Cartões de Crédito</h3>
                  <p className="text-xs text-muted-foreground">Faturas e limites disponíveis</p>
                </div>
                <a href="/credit-cards" className="text-xs text-primary font-semibold hover:underline">
                  Gerenciar cartões →
                </a>
              </div>
              {realCreditCards && realCreditCards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {realCreditCards.map((card: any) => (
                    <div key={card.id} className="p-4 rounded-xl border border-border/60 bg-background flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs" style={{ backgroundColor: card.color }}>
                          <BankLogo bankKeyOrName={card.name} className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{card.name}</p>
                          <p className="text-[10px] text-muted-foreground">Vence dia {card.due_day}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                          {formatCurrency(card.current_bill || 0)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Limite: {formatCurrency(card.limit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Nenhum cartão de crédito cadastrado. <a href="/credit-cards" className="text-primary underline">Adicionar cartão</a>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {user && (
        <OnboardingModal
          user={user}
          open={onboardingOpen}
          onComplete={handleOnboardingComplete}
        />
      )}

      <OFXImportModal
        open={ofxOpen}
        onOpenChange={setOfxOpen}
        onSuccess={() => {
          refetchSummary();
          refetchHealth();
          refetchEvolution();
          refetchAccounts();
        }}
      />
    </DashboardLayout>
  );
}
