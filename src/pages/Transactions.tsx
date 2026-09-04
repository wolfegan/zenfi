import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  useTransactions,
  useCategories,
  useCreditCards,
  useAccounts,
  useMonthlySummary,
} from "@/hooks/use-supabase";
import { parseBRLAmount, formatCurrencyInput, getCategoryIcon } from "@/lib/utils";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import { BankLogo } from "@/components/BankLogo";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Pencil,
  Plus,
  Trash2,
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  Gift,
  Search,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { demoTransactions, demoCategories, demoCreditCards, demoAccounts } from "@/lib/demo-data";
import { isBenefitType } from "@/pages/Accounts";
import { PrivacyValue } from "@/components/PrivacyValue";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const s = new Date(ym + "-01T12:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dayGroupLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === -1) return "Ontem";
  if (diff === 1) return "Amanhã";
  const s = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Payment method helpers ──────────────────────────────────────────────────
const PAYMENT_PREFIX_RE = /^\[(PIX|Dinheiro|Débito|Benefício)\]\s*/;

function getPaymentMethod(tx: any): string | null {
  if (tx.is_credit_card) return "Cartão";
  if (tx.payment_method && PAYMENT_BADGE[tx.payment_method])
    return tx.payment_method;
  const match = tx.description?.match(PAYMENT_PREFIX_RE);
  return match ? match[1] : null;
}

function stripPaymentPrefix(desc: string): string {
  if (!desc) return "";
  return desc
    .replace(/\[Conta:\s*([^\]]+)\]\s*/g, "")
    .replace(PAYMENT_PREFIX_RE, "")
    .replace(PAYMENT_PREFIX_RE, "")
    .trim();
}

const EXPENSE_PAYMENT_OPTIONS = [
  {
    value: "credit_card",
    label: "Cartão Crédito",
    icon: CreditCard,
    color: "#8b5cf6",
  },
  {
    value: "benefit_card",
    label: "Cartão Benefício",
    icon: Gift,
    color: "#10b981",
  },
  { value: "pix", label: "PIX", icon: Smartphone, color: "#22c55e" },
  { value: "cash", label: "Dinheiro", icon: Banknote, color: "#f97316" },
  { value: "debit", label: "Débito", icon: Building2, color: "#3b82f6" },
];

const INCOME_PAYMENT_OPTIONS = [
  { value: "pix", label: "PIX", icon: Smartphone, color: "#22c55e" },
  { value: "cash", label: "Dinheiro", icon: Banknote, color: "#f97316" },
];

const PAYMENT_BADGE: Record<string, { label: string; color: string }> = {
  Cartão: { label: "Cartão", color: "#8b5cf6" },
  Benefício: { label: "Benefício", color: "#10b981" },
  PIX: { label: "PIX", color: "#22c55e" },
  Dinheiro: { label: "Dinheiro", color: "#f97316" },
  Débito: { label: "Débito", color: "#3b82f6" },
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function Transactions() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense" as "income" | "expense" | "transfer",
    description: "",
    isFixed: false,
    isPending: false,
    paymentMethod: "pix" as string,
    creditCardId: "",
    accountId: "",
    toAccountId: "",
    installments: "1",
  });

  const month = selectedMonth;
  const {
    data: realTransactions,
    loading: txsLoading,
    create,
    createInstallments,
    confirmTransaction,
    update,
    remove,
    removeGroup,
  } = useTransactions();
  const { data: realCategories } = useCategories();
  const { data: realCreditCards } = useCreditCards();
  const { data: realAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: summary } = useMonthlySummary(selectedMonth);

  const filteredRealTransactions = useMemo(
    () => realTransactions.filter((t: any) => t.date.startsWith(month)),
    [realTransactions, month],
  );

  const useDemo = !!user?.is_anonymous;

  const allTxs = useDemo ? demoTransactions : filteredRealTransactions;
  const categories = useDemo ? demoCategories : realCategories;
  const creditCards = useDemo ? demoCreditCards : realCreditCards;
  const accounts = useDemo ? demoAccounts : (realAccounts || []);

  const txs = useMemo(() => {
    if (!search.trim()) return allTxs;
    const q = search.toLowerCase();
    return allTxs.filter((tx: any) => {
      const cat = categories?.find((c: any) => c.id === tx.category_id);
      const cleanDesc = stripPaymentPrefix(tx.description || "");
      return (
        cleanDesc.toLowerCase().includes(q) ||
        cat?.name?.toLowerCase().includes(q)
      );
    });
  }, [allTxs, search, categories]);

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const formatCurrency = (val: number) => (
    <PrivacyValue>
      {val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </PrivacyValue>
  );

  const expenseCategories =
    categories?.filter((c: any) => c.type === "expense") || [];
  const incomeCategories =
    categories?.filter((c: any) => c.type === "income") || [];
  const findCategory = (id: string) =>
    categories?.find((c: any) => c.id === id);
  const paymentOptions =
    form.type === "expense" ? EXPENSE_PAYMENT_OPTIONS : INCOME_PAYMENT_OPTIONS;

  const resetForm = () => {
    setForm({
      categoryId: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      description: "",
      isFixed: false,
      isPending: false,
      paymentMethod: "pix",
      creditCardId: "",
      accountId: "",
      toAccountId: "",
      installments: "1",
    });
    setEditingTx(null);
  };

  const handleSubmit = async () => {
    // ─── Lógica para Transferência entre Contas ───
    if (form.type === "transfer") {
      const amount = parseBRLAmount(form.amount);
      if (amount <= 0) {
        toast.error("Por favor insira um valor de transferência válido maior que zero.");
        return;
      }
      if (!form.accountId || !form.toAccountId) {
        toast.error("Selecione a conta de origem e a conta de destino.");
        return;
      }
      if (form.accountId === form.toAccountId) {
        toast.error("A conta de destino deve ser diferente da conta de origem.");
        return;
      }

      const fromAcc = accounts.find((a: any) => a.id === form.accountId);
      const toAcc = accounts.find((a: any) => a.id === form.toAccountId);
      if (!fromAcc || !toAcc) {
        toast.error("Conta não encontrada.");
        return;
      }

      try {
        if (!useDemo) {
          const expenseCatId = expenseCategories[0]?.id || categories?.[0]?.id || "";
          const incomeCatId = incomeCategories[0]?.id || categories?.[0]?.id || "";

          // Registra saída na conta de origem (createTransaction já ajusta o saldo via adjustAccountBalance no banco)
          await create({
            account_id: fromAcc.id,
            type: "expense",
            amount,
            date: form.date,
            description: form.description.trim()
              ? `Transferência p/ ${toAcc.name}: ${form.description.trim()}`
              : `Transferência para ${toAcc.name}`,
            category_id: expenseCatId,
            payment_method: "pix",
            is_fixed: false,
            is_credit_card: false,
            credit_card_id: null,
          });

          // Registra entrada na conta de destino (createTransaction já ajusta o saldo via adjustAccountBalance no banco)
          await create({
            account_id: toAcc.id,
            type: "income",
            amount,
            date: form.date,
            description: form.description.trim()
              ? `Transferência rcbda de ${fromAcc.name}: ${form.description.trim()}`
              : `Transferência recebida de ${fromAcc.name}`,
            category_id: incomeCatId,
            payment_method: "pix",
            is_fixed: false,
            is_credit_card: false,
            credit_card_id: null,
          });

          await refetchAccounts();
        } else {
          fromAcc.balance = Number(fromAcc.balance) - amount;
          toAcc.balance = Number(toAcc.balance) + amount;
        }

        toast.success(
          `Transferência de ${amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} realizada de "${fromAcc.name}" para "${toAcc.name}"!`
        );
        setDialogOpen(false);
        resetForm();
      } catch (error) {
        console.error("Transfer error:", error);
        toast.error("Erro ao realizar transferência.");
      }
      return;
    }

    // ─── Lógica para Despesa ou Receita ───
    if (!form.categoryId || !form.amount) {
      toast.error("Preencha a categoria e o valor.");
      return;
    }
    const amount = parseBRLAmount(form.amount);
    if (amount <= 0) {
      toast.error("Por favor insira um valor válido maior que zero.");
      return;
    }

    const isCreditCard = form.paymentMethod === "credit_card";
    if (!isCreditCard && !form.accountId) {
      toast.error(
        "Por favor selecione qual conta ou cartão de benefício está saindo ou entrando o dinheiro.",
      );
      return;
    }

    const nInstallments = Math.max(1, parseInt(form.installments) || 1);
    if (isCreditCard && nInstallments > 1 && !form.creditCardId) {
      toast.error("Selecione o cartão da compra parcelada.");
      return;
    }

    try {
      if (!useDemo) {
        if (isCreditCard && nInstallments > 1 && !editingTx) {
          await createInstallments({
            creditCardId: form.creditCardId,
            categoryId: form.categoryId,
            total: amount,
            count: nInstallments,
            purchaseDate: form.date,
            description: form.description.trim() || null,
            isFixed: form.isFixed,
          });
          toast.success(`Compra parcelada em ${nInstallments}x adicionada!`);
          setDialogOpen(false);
          resetForm();
          return;
        }
        const selectedAcc = accounts.find((a: any) => a.id === form.accountId);
        const descriptionValue = stripPaymentPrefix(form.description.trim());

        const txData: any = {
          category_id: form.categoryId,
          amount,
          date: form.date,
          type: form.type,
          description: descriptionValue || null,
          is_fixed: form.isFixed,
          is_credit_card: isCreditCard,
          credit_card_id:
            isCreditCard && form.creditCardId ? form.creditCardId : null,
          account_id: !isCreditCard && selectedAcc ? selectedAcc.id : null,
          payment_method: isCreditCard
            ? "Cartão"
            : form.paymentMethod === "benefit_card"
              ? "Benefício"
              : form.paymentMethod === "pix"
                ? "PIX"
                : form.paymentMethod === "cash"
                  ? "Dinheiro"
                  : form.paymentMethod === "debit"
                    ? "Débito"
                    : null,
          status:
            form.isPending && !isCreditCard ? "pending" : "confirmed",
        };

        if (editingTx) {
          await update(editingTx.id, txData);
          toast.success("Transação atualizada!");
        } else {
          await create(txData);
          toast.success("Transação adicionada!");
        }

        refetchAccounts();
      } else {
        toast.info(
          "Transação registrada no modo demonstração.",
        );
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Erro ao salvar transação.");
    }
  };

  const confirmedTxs = allTxs.filter(
    (t: any) => (t.status ?? "confirmed") !== "pending",
  );
  const totalIncome = confirmedTxs
    .filter((t: any) => t.type === "income")
    .reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = confirmedTxs
    .filter((t: any) => t.type === "expense")
    .reduce((s: number, t: any) => s + t.amount, 0);
  const pendingCount = allTxs.filter(
    (t: any) => t.status === "pending",
  ).length;

  const accountById = (id: string) =>
    accounts?.find((a: any) => a.id === id);

  const openEdit = (tx: any) => {
    if (useDemo) return;
    setEditingTx(tx);
    const methodMap: Record<string, string> = {
      PIX: "pix",
      Dinheiro: "cash",
      Débito: "debit",
    };
    let pm = "pix";
    if (tx.is_credit_card) pm = "credit_card";
    else if (tx.payment_method && methodMap[tx.payment_method])
      pm = methodMap[tx.payment_method];
    else {
      const m = tx.description?.match(PAYMENT_PREFIX_RE);
      if (m) pm = methodMap[m[1]] || "pix";
    }
    const accMatch = tx.description?.match(/\[Conta:\s*([^\]]+)\]/);
    const foundAcc =
      accounts?.find((a: any) => a.id === tx.account_id) ||
      accounts?.find(
        (a: any) => a.name === (accMatch ? accMatch[1] : null),
      );
    setForm({
      categoryId: tx.category_id,
      amount: formatCurrencyInput(tx.amount),
      date: tx.date,
      type: tx.type,
      description: stripPaymentPrefix(tx.description || ""),
      isFixed: tx.is_fixed,
      isPending: tx.status === "pending",
      paymentMethod: pm,
      creditCardId: tx.credit_card_id || "",
      accountId: foundAcc ? foundAcc.id : "",
      toAccountId: "",
      installments: "1",
    });
    setDialogOpen(true);
  };

  // agrupa as transações visíveis por dia (mais recente primeiro)
  const groupedTxs: { date: string; items: any[] }[] = [];
  {
    const sorted = [...(txs || [])].sort((a: any, b: any) =>
      b.date === a.date
        ? (b.created_at ?? 0) - (a.created_at ?? 0)
        : b.date.localeCompare(a.date),
    );
    for (const t of sorted) {
      const g = groupedTxs.find((x) => x.date === t.date);
      if (g) g.items.push(t);
      else groupedTxs.push({ date: t.date, items: [t] });
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 text-[11px] text-warning border border-warning/20">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse-subtle" />
            Modo demonstração — dados de exemplo.
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Transações</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Registre e gerencie suas receitas e despesas
            </p>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0 h-9 rounded-lg text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">
                  {editingTx ? "Editar Transação" : "Nova Transação"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Preencha os detalhes da transação
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Type toggle */}
                <div className="flex gap-1.5 p-1 bg-secondary/50 rounded-xl">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: "expense",
                        categoryId: "",
                        paymentMethod: "pix",
                      })
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${form.type === "expense" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-rose-500" /> Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: "income",
                        categoryId: "",
                        paymentMethod: "pix",
                      })
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${form.type === "income" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-500" /> Receita
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: "transfer",
                      })
                    }
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${form.type === "transfer" ? "bg-card shadow-sm text-cyan-600 font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-500" /> Transferência
                  </button>
                </div>

                {form.type === "transfer" ? (
                  /* Transfer form */
                  <div className="space-y-4">
                    {/* Conta Origem */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Conta Origem <span className="text-destructive">*</span>
                      </label>
                      {accounts && accounts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                          {accounts.map((acc: any) => {
                            const isBenefit = isBenefitType(acc.type, acc.name);
                            return (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    accountId: acc.id,
                                    toAccountId: form.toAccountId === acc.id ? "" : form.toAccountId,
                                  })
                                }
                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200 ${
                                  form.accountId === acc.id
                                    ? "border-cyan-500 bg-cyan-500/10"
                                    : "border-border bg-background hover:border-primary/40"
                                }`}
                              >
                                <div
                                  className="w-5.5 h-5.5 rounded-md shrink-0 flex items-center justify-center"
                                  style={{
                                    backgroundColor: acc.color || "#6366f1",
                                  }}
                                >
                                  <BankLogo bankKeyOrName={acc.name} type={acc.type} className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-semibold truncate leading-none">
                                      {acc.name}
                                    </span>
                                    {isBenefit && (
                                      <span className="text-[9px] px-1 bg-emerald-500/15 text-emerald-600 rounded font-medium shrink-0">
                                        Benefício
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                    Saldo: {formatCurrency(acc.balance)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-xl">
                          Nenhuma conta cadastrada.
                        </p>
                      )}
                    </div>

                    {/* Conta Destino */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Conta Destino <span className="text-destructive">*</span>
                      </label>
                      {accounts && accounts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                          {accounts
                            .filter((acc: any) => acc.id !== form.accountId)
                            .map((acc: any) => {
                              const isBenefit = isBenefitType(acc.type, acc.name);
                              return (
                                <button
                                  key={acc.id}
                                  type="button"
                                  onClick={() =>
                                    setForm({ ...form, toAccountId: acc.id })
                                  }
                                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200 ${
                                    form.toAccountId === acc.id
                                      ? "border-emerald-500 bg-emerald-500/10"
                                      : "border-border bg-background hover:border-primary/40"
                                  }`}
                                >
                                  <div
                                    className="w-5.5 h-5.5 rounded-md shrink-0 flex items-center justify-center"
                                    style={{
                                      backgroundColor: acc.color || "#6366f1",
                                    }}
                                  >
                                    <BankLogo bankKeyOrName={acc.name} type={acc.type} className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-semibold truncate leading-none">
                                        {acc.name}
                                      </span>
                                      {isBenefit && (
                                        <span className="text-[9px] px-1 bg-emerald-500/15 text-emerald-600 rounded font-medium shrink-0">
                                          Benefício
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                      Saldo: {formatCurrency(acc.balance)}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-xl">
                          Nenhuma conta de destino.
                        </p>
                      )}
                    </div>

                    {/* Valor */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Valor <span className="text-destructive">*</span>
                      </label>
                      <BRLCurrencyInput
                        value={form.amount}
                        onChangeValue={(val) => setForm({ ...form, amount: val })}
                        placeholder="R$ 0,00"
                        className="h-9 rounded-lg"
                      />
                    </div>

                    {/* Data */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Data
                      </label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="h-9 rounded-lg"
                      />
                    </div>

                    {/* Description / Observação */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Observação (opcional)
                      </label>
                      <Input
                        placeholder="Ex: Transferência de economia, ajuste..."
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className="h-9 rounded-lg"
                      />
                    </div>
                  </div>
                ) : (
                  /* Expense or Income Form */
                  <>
                    {/* Payment method */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block font-medium">
                        {form.type === "expense"
                          ? "Forma de pagamento"
                          : "Forma de recebimento"}
                      </label>
                      <div
                        className={`grid gap-1.5 ${
                          form.type === "expense" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2"
                        }`}
                      >
                        {paymentOptions.map((opt) => {
                          const Icon = opt.icon;
                          const selected = form.paymentMethod === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  paymentMethod: opt.value,
                                  creditCardId: "",
                                })
                              }
                              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center transition-all duration-200 ${
                                selected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background hover:border-primary/40 hover:bg-secondary/60"
                              }`}
                            >
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{
                                  backgroundColor: selected
                                    ? opt.color + "22"
                                    : "transparent",
                                }}
                              >
                                <Icon
                                  className="w-3.5 h-3.5"
                                  style={{
                                    color: selected ? opt.color : undefined,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-medium leading-tight">
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Credit card selector */}
                    <AnimatePresence>
                      {form.paymentMethod === "credit_card" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                            Selecionar Cartão
                          </label>
                          {creditCards && creditCards.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {creditCards.map((card: any) => (
                                <button
                                  key={card.id}
                                  type="button"
                                  onClick={() =>
                                    setForm({ ...form, creditCardId: card.id })
                                  }
                                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200 ${
                                    form.creditCardId === card.id
                                      ? "border-primary bg-primary/10"
                                      : "border-border bg-background hover:border-primary/40"
                                  }`}
                                >
                                  <div
                                    className="w-6 h-6 rounded-lg shrink-0"
                                    style={{
                                      backgroundColor: card.color || "#8b5cf6",
                                    }}
                                  />
                                  <span className="text-xs font-medium truncate">
                                    {card.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-xl">
                              Nenhum cartão cadastrado.{" "}
                              <a
                                href="/credit-cards"
                                className="text-primary underline"
                              >
                                Cadastrar cartão
                              </a>
                            </p>
                          )}

                          {form.type === "expense" && !editingTx && (
                            <div className="mt-3">
                              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                                Parcelas
                              </label>
                              <Select
                                value={form.installments}
                                onValueChange={(v) =>
                                  setForm({ ...form, installments: v })
                                }
                              >
                                <SelectTrigger className="text-xs h-9 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => i + 1).map(
                                    (n) => {
                                      const val = parseBRLAmount(form.amount);
                                      const per = val > 0 ? val / n : 0;
                                      return (
                                        <SelectItem
                                          key={n}
                                          value={String(n)}
                                          className="text-xs"
                                        >
                                          {n === 1
                                            ? "À vista (1x)"
                                            : `${n}x${per > 0 ? ` de ${per.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : ""}`}
                                        </SelectItem>
                                      );
                                    },
                                  )}
                                </SelectContent>
                              </Select>
                              {parseInt(form.installments) > 1 && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Serão criadas {form.installments} transações, uma
                                  em cada fatura.
                                </p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Account selector */}
                    <AnimatePresence>
                      {form.paymentMethod !== "credit_card" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                            {form.type === "expense"
                              ? "Pagar com a Conta / Cartão Benefício"
                              : "Receber na Conta"}{" "}
                            <span className="text-destructive">*</span>
                          </label>
                          {accounts && accounts.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                              {accounts.map((acc: any) => {
                                const isBenefit = isBenefitType(acc.type, acc.name);
                                return (
                                  <button
                                    key={acc.id}
                                    type="button"
                                    onClick={() =>
                                      setForm({ ...form, accountId: acc.id })
                                    }
                                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200 ${
                                      form.accountId === acc.id
                                        ? "border-primary bg-primary/10"
                                        : "border-border bg-background hover:border-primary/40"
                                    }`}
                                  >
                                    <div
                                      className="w-5.5 h-5.5 rounded-md shrink-0 flex items-center justify-center"
                                      style={{
                                        backgroundColor: acc.color || "#6366f1",
                                      }}
                                    >
                                      <BankLogo bankKeyOrName={acc.name} type={acc.type} className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-semibold truncate leading-none">
                                          {acc.name}
                                        </span>
                                        {isBenefit && (
                                          <span className="text-[9px] px-1 bg-emerald-500/15 text-emerald-600 rounded font-medium shrink-0">
                                            Benefício
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                        Saldo: {formatCurrency(acc.balance)}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-xl">
                              Nenhuma conta cadastrada.{" "}
                              <a
                                href="/accounts"
                                className="text-primary underline"
                              >
                                Cadastrar conta
                              </a>
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Amount */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Valor <span className="text-destructive">*</span>
                      </label>
                      <BRLCurrencyInput
                        value={form.amount}
                        onChangeValue={(val) => setForm({ ...form, amount: val })}
                        placeholder="R$ 0,00"
                        className="h-9 rounded-lg"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Categoria
                      </label>
                      <Select
                        value={form.categoryId}
                        onValueChange={(v) => setForm({ ...form, categoryId: v })}
                      >
                        <SelectTrigger className="text-xs h-9 rounded-lg">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(form.type === "expense"
                            ? expenseCategories
                            : incomeCategories
                          ).map((cat: any) => (
                            <SelectItem
                              key={cat.id}
                              value={cat.id}
                              className="text-xs"
                            >
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Data
                      </label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="h-9 rounded-lg"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Descrição (opcional)
                      </label>
                      <Input
                        placeholder="Ex: Supermercado, almoço VR..."
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className="h-9 rounded-lg"
                      />
                    </div>

                    {/* Fixed toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isFixed}
                        onChange={(e) =>
                          setForm({ ...form, isFixed: e.target.checked })
                        }
                        className="w-3.5 h-3.5 rounded border"
                      />
                      <span className="text-xs text-muted-foreground">
                        {form.type === "expense"
                          ? "Gasto fixo (recorrente)"
                          : "Receita fixa (recorrente)"}
                      </span>
                    </label>

                    {/* Pending / previsto toggle */}
                    {form.paymentMethod !== "credit_card" && !editingTx && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isPending}
                          onChange={(e) =>
                            setForm({ ...form, isPending: e.target.checked })
                          }
                          className="w-3.5 h-3.5 rounded border"
                        />
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Lançamento previsto (não mexe no saldo até confirmar)
                        </span>
                      </label>
                    )}
                  </>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-lg"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="text-xs rounded-lg"
                  onClick={handleSubmit}
                >
                  {editingTx
                    ? "Salvar Alterações"
                    : form.type === "transfer"
                      ? "Confirmar Transferência"
                      : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
            className="w-8 h-8 rounded-lg border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold min-w-[150px] text-center tabular-nums">
            {monthLabel(selectedMonth)}
          </span>
          <button
            onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
            className="w-8 h-8 rounded-lg border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Receitas do Mês
              </span>
              <div className="w-7 h-7 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <ArrowUp className="w-3.5 h-3.5 text-chart-2" />
              </div>
            </div>
            <p className="text-lg font-semibold text-chart-2">
              {formatCurrency(totalIncome)}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Despesas do Mês
              </span>
              <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ArrowDown className="w-3.5 h-3.5 text-destructive" />
              </div>
            </div>
            <p className="text-lg font-semibold text-destructive">
              {formatCurrency(totalExpense)}
            </p>
          </motion.div>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-muted-foreground">
              {pendingCount} lançamento{pendingCount !== 1 ? "s" : ""}{" "}
              previsto{pendingCount !== 1 ? "s" : ""} neste mês
              {summary
                ? ` · ${formatCurrency(summary.pendingIncome)} a receber, ${formatCurrency(summary.pendingExpenses)} a pagar`
                : ""}
            </span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-lg"
          />
        </div>

        {/* Transaction list — agrupada por dia */}
        {groupedTxs.length > 0 ? (
          <div className="space-y-5">
            {groupedTxs.map((group) => (
              <div key={group.date} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {dayGroupLabel(group.date)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(group.date + "T12:00:00").toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {(() => {
                      const net = group.items.reduce(
                        (s: number, t: any) =>
                          s + (t.type === "income" ? t.amount : -t.amount),
                        0,
                      );
                      return `${net >= 0 ? "+" : "-"}${formatCurrency(Math.abs(net))}`;
                    })()}
                  </span>
                </div>

                <AnimatePresence mode="popLayout">
                  {group.items.map((tx: any, i: number) => {
                    const cat = findCategory(tx.category_id);
                    const payMethod = getPaymentMethod(tx);
                    const cleanDesc = stripPaymentPrefix(tx.description || "");
                    const acc = tx.account_id
                      ? accountById(tx.account_id)
                      : null;
                    const isPending = tx.status === "pending";
                    const card = tx.credit_card_id
                      ? creditCards?.find(
                          (c: any) => c.id === tx.credit_card_id,
                        )
                      : null;
                    return (
                      <motion.div
                        key={tx.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.02, duration: 0.18 }}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border bg-card transition-all duration-200 group ${
                          isPending
                            ? "border-dashed border-amber-500/40 bg-amber-500/[0.03]"
                            : "hover:bg-card/80 card-hover"
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: cat?.color
                              ? `${cat.color}18`
                              : "oklch(0.93 0.006 248)",
                          }}
                        >
                          {(() => {
                            const Icon = getCategoryIcon(cat?.icon);
                            return (
                              <Icon
                                className="w-4 h-4"
                                style={{
                                  color:
                                    cat?.color || "var(--muted-foreground)",
                                }}
                              />
                            );
                          })()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-sm font-medium truncate ${isPending ? "text-muted-foreground" : ""}`}
                            >
                              {cleanDesc || cat?.name || "Sem categoria"}
                            </span>
                            {tx.installments_total > 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-medium">
                                {tx.installment_number}/{tx.installments_total}
                              </span>
                            )}
                            {tx.is_fixed && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                                Fixo
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> Previsto
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground min-w-0">
                            <span className="truncate">{cat?.name}</span>
                            {(acc || card) && (
                              <>
                                <span className="text-border">·</span>
                                <span className="flex items-center gap-1 shrink-0">
                                  {card ? (
                                    <>
                                      <span
                                        className="w-3 h-3 rounded-[3px] flex items-center justify-center"
                                        style={{
                                          backgroundColor:
                                            card.color || "#8b5cf6",
                                        }}
                                      >
                                        <BankLogo
                                          bankKeyOrName={card.name}
                                          className="w-2 h-2 text-white"
                                        />
                                      </span>
                                      {card.name}
                                    </>
                                  ) : (
                                    <>
                                      <span
                                        className="w-3 h-3 rounded-[3px] flex items-center justify-center"
                                        style={{
                                          backgroundColor:
                                            acc?.color || "#6366f1",
                                        }}
                                      >
                                        <BankLogo
                                          bankKeyOrName={acc?.name || ""}
                                          type={acc?.type}
                                          className="w-2 h-2 text-white"
                                        />
                                      </span>
                                      {acc?.name}
                                    </>
                                  )}
                                </span>
                              </>
                            )}
                            {!acc && !card && payMethod && (
                              <>
                                <span className="text-border">·</span>
                                <span className="shrink-0">{payMethod}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div
                          className={`text-sm font-semibold tabular-nums shrink-0 ${
                            isPending
                              ? "text-muted-foreground"
                              : tx.type === "income"
                                ? "text-chart-2"
                                : "text-foreground"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          <PrivacyValue>
                            {tx.amount.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </PrivacyValue>
                        </div>

                        {isPending ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-chart-2 hover:text-chart-2 hover:bg-chart-2/10"
                              title="Confirmar lançamento"
                              onClick={async () => {
                                if (useDemo) return;
                                await confirmTransaction(tx.id);
                                refetchAccounts();
                                toast.success("Lançamento confirmado!");
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Excluir"
                              onClick={() => {
                                setDeleteId(tx.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => openEdit(tx)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleteId(tx.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">
              {search ? "Nenhum resultado" : "Sem transações neste mês"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {search
                ? "Tente outros termos de busca"
                : "Registre sua primeira transação"}
            </p>
            {!search && (
              <Button
                size="sm"
                className="text-xs rounded-lg"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Adicionar transação
              </Button>
            )}
          </motion.div>
        )}

      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">
              Excluir transação?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-lg">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="text-xs rounded-lg bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (deleteId) {
                  if (!useDemo) {
                    const txToDelete = realTransactions.find(
                      (t: any) => t.id === deleteId,
                    );
                    if (txToDelete?.purchase_group_id) {
                      // Compra parcelada: remove todas as parcelas de uma vez
                      await removeGroup(txToDelete.purchase_group_id);
                      toast.success("Compra parcelada removida (todas as parcelas).");
                      setDeleteDialogOpen(false);
                      setDeleteId(null);
                      return;
                    }
                    // remove() reverte o saldo da conta automaticamente
                    await remove(deleteId);
                    refetchAccounts();
                  }
                  toast.success("Transação excluída!");
                }
                setDeleteDialogOpen(false);
                setDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
