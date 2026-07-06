import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
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
} from "@/hooks/use-supabase";
import { parseBRLAmount } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Pencil,
  Plus,
  Trash2,
  ArrowDown,
  ArrowUp,
  Search,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { demoTransactions, demoCategories } from "@/lib/demo-data";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Payment method helpers ──────────────────────────────────────────────────
const PAYMENT_PREFIX_RE = /^\[(PIX|Dinheiro|Débito)\]\s*/;

function getPaymentMethod(tx: any): string | null {
  if (tx.is_credit_card) return "Cartão";
  const match = tx.description?.match(PAYMENT_PREFIX_RE);
  return match ? match[1] : null;
}

function stripPaymentPrefix(desc: string): string {
  if (!desc) return "";
  return desc
    .replace(PAYMENT_PREFIX_RE, "")
    .replace(/\[Conta:\s*([^\]]+)\]\s*/, "")
    .trim();
}

const EXPENSE_PAYMENT_OPTIONS = [
  {
    value: "credit_card",
    label: "Cartão de Crédito",
    icon: CreditCard,
    color: "#8b5cf6",
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
  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense" as "income" | "expense",
    description: "",
    isFixed: false,
    paymentMethod: "pix" as string,
    creditCardId: "",
    accountId: "",
  });

  const month = currentMonth();
  const {
    data: realTransactions,
    loading: txsLoading,
    create,
    update,
    remove,
  } = useTransactions();
  const { data: realCategories } = useCategories();
  const { data: realCreditCards } = useCreditCards();
  const { data: realAccounts, refetch: refetchAccounts } = useAccounts();

  const filteredRealTransactions = useMemo(
    () => realTransactions.filter((t: any) => t.date.startsWith(month)),
    [realTransactions, month],
  );

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => {
    if (!isLoading && !txsLoading) {
      setUseDemo(
        !!user?.is_anonymous &&
          realTransactions.length === 0 &&
          realCategories.length === 0,
      );
    }
  }, [isLoading, txsLoading, realTransactions, realCategories, user]);

  const allTxs = useDemo ? demoTransactions : filteredRealTransactions;
  const categories = useDemo ? demoCategories : realCategories;
  const creditCards = useDemo ? [] : realCreditCards;
  const accounts = useDemo ? [] : realAccounts;

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
      paymentMethod: "pix",
      creditCardId: "",
      accountId: "",
    });
    setEditingTx(null);
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.amount) return;
    const amount = parseBRLAmount(form.amount);
    if (amount <= 0) {
      toast.error("Por favor insira um valor válido maior que zero.");
      return;
    }

    const isCreditCard = form.paymentMethod === "credit_card";
    if (!isCreditCard && !form.accountId) {
      toast.error(
        "Por favor selecione qual conta está saindo ou entrando o dinheiro.",
      );
      return;
    }

    try {
      if (!useDemo) {
        let descriptionValue = form.description.trim();
        const selectedAcc = accounts.find((a: any) => a.id === form.accountId);

        // Prepend payment method label to description
        if (!isCreditCard) {
          const label =
            form.paymentMethod === "pix"
              ? "PIX"
              : form.paymentMethod === "cash"
                ? "Dinheiro"
                : form.paymentMethod === "debit"
                  ? "Débito"
                  : "";
          if (label) {
            descriptionValue = descriptionValue
              ? `[${label}] ${descriptionValue}`
              : `[${label}]`;
          }
        }

        // Prepend account prefix to description if linked to account
        if (!isCreditCard && selectedAcc) {
          descriptionValue = `[Conta: ${selectedAcc.name}] ${descriptionValue}`;
        }

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
        };

        if (editingTx) {
          // 1. Reverter saldo antigo da conta antiga
          const oldAmount = editingTx.amount;
          const oldType = editingTx.type;
          const oldAccMatch = editingTx.description?.match(
            /\[Conta:\s*([^\]]+)\]/,
          );
          const oldAccName = oldAccMatch ? oldAccMatch[1] : null;
          const oldAcc = accounts.find((a: any) => a.name === oldAccName);

          if (oldAcc) {
            const revertedBalance =
              oldType === "income"
                ? oldAcc.balance - oldAmount
                : oldAcc.balance + oldAmount;
            await supabase
              .from("accounts")
              .update({ balance: revertedBalance })
              .eq("id", oldAcc.id);
          }

          // 2. Aplicar novo saldo na conta selecionada
          if (selectedAcc) {
            const { data: latestAcc } = await supabase
              .from("accounts")
              .select("balance")
              .eq("id", selectedAcc.id)
              .single();

            const currentBalance = latestAcc
              ? latestAcc.balance
              : selectedAcc.balance;
            const newBalance =
              form.type === "income"
                ? currentBalance + amount
                : currentBalance - amount;

            await supabase
              .from("accounts")
              .update({ balance: newBalance })
              .eq("id", selectedAcc.id);
          }

          await update(editingTx.id, txData);
          toast.success("Transação atualizada!");
        } else {
          // Nova Transação: aplicar saldo na conta
          if (selectedAcc) {
            const newBalance =
              form.type === "income"
                ? selectedAcc.balance + amount
                : selectedAcc.balance - amount;
            await supabase
              .from("accounts")
              .update({ balance: newBalance })
              .eq("id", selectedAcc.id);
          }

          await create(txData);
          toast.success("Transação adicionada!");
        }

        refetchAccounts();
      } else {
        toast.info(
          "Transações não alteram o banco de dados no modo demonstração.",
        );
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Erro ao salvar transação.");
    }
  };

  const totalIncome = allTxs
    .filter((t: any) => t.type === "income")
    .reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = allTxs
    .filter((t: any) => t.type === "expense")
    .reduce((s: number, t: any) => s + t.amount, 0);
  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
                <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
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
                    <ArrowDown className="w-3.5 h-3.5" /> Despesa
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
                    <ArrowUp className="w-3.5 h-3.5" /> Receita
                  </button>
                </div>

                {/* Payment method */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">
                    {form.type === "expense"
                      ? "Forma de pagamento"
                      : "Forma de recebimento"}
                  </label>
                  <div
                    className={`grid gap-2 ${form.type === "expense" ? "grid-cols-4" : "grid-cols-2"}`}
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
                          className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-center transition-all duration-200 ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background hover:border-primary/40 hover:bg-secondary/60"
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
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
                          ? "Pagar com a Conta"
                          : "Receber na Conta"}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      {accounts && accounts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {accounts.map((acc: any) => (
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
                                className="w-5.5 h-5.5 rounded-md shrink-0"
                                style={{
                                  backgroundColor: acc.color || "#6366f1",
                                }}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold truncate leading-none mb-0.5">
                                  {acc.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground leading-none">
                                  Saldo: {formatCurrency(acc.balance)}
                                </span>
                              </div>
                            </button>
                          ))}
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
                    Valor
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                      className="pl-9 h-9 rounded-lg"
                    />
                  </div>
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
                    placeholder="Ex: Supermercado, salário março..."
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
                  {editingTx ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

        {/* Transaction list */}
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {txs && txs.length > 0 ? (
              txs.map((tx: any, i: number) => {
                const cat = findCategory(tx.category_id);
                const payMethod = getPaymentMethod(tx);
                const cleanDesc = stripPaymentPrefix(tx.description || "");
                const badge = payMethod ? PAYMENT_BADGE[payMethod] : null;
                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.025, duration: 0.2 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:bg-card/80 transition-all duration-200 group card-hover"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: cat?.color
                          ? `${cat.color}18`
                          : "oklch(0.93 0.006 248)",
                      }}
                    >
                      {tx.type === "income" ? (
                        <ArrowUp
                          className="w-4 h-4"
                          style={{ color: "oklch(0.52 0.15 178)" }}
                        />
                      ) : (
                        <ArrowDown
                          className="w-4 h-4"
                          style={{ color: "oklch(0.58 0.19 27.33)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {cleanDesc || cat?.name || "Sem categoria"}
                        </span>
                        {tx.is_fixed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                            Fixo
                          </span>
                        )}
                        {badge && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: badge.color + "18",
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {cat?.name}
                        </span>
                        <span className="text-xs text-border">·</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.date + "T12:00:00").toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold tabular-nums ${tx.type === "income" ? "text-chart-2" : "text-foreground"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {tx.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => {
                          if (!useDemo) {
                            setEditingTx(tx);
                            let pm = "pix";
                            if (tx.is_credit_card) pm = "credit_card";
                            else {
                              const m =
                                tx.description?.match(PAYMENT_PREFIX_RE);
                              if (m) {
                                pm =
                                  m[1] === "PIX"
                                    ? "pix"
                                    : m[1] === "Dinheiro"
                                      ? "cash"
                                      : m[1] === "Débito"
                                        ? "debit"
                                        : "pix";
                              }
                            }
                            const accMatch = tx.description?.match(
                              /\[Conta:\s*([^\]]+)\]/,
                            );
                            const accountName = accMatch ? accMatch[1] : null;
                            const foundAcc = accounts.find(
                              (a: any) => a.name === accountName,
                            );

                            setForm({
                              categoryId: tx.category_id,
                              amount: tx.amount.toString(),
                              date: tx.date,
                              type: tx.type,
                              description: stripPaymentPrefix(
                                tx.description || "",
                              ),
                              isFixed: tx.is_fixed,
                              paymentMethod: pm,
                              creditCardId: tx.credit_card_id || "",
                              accountId: foundAcc ? foundAcc.id : "",
                            });
                            setDialogOpen(true);
                          }
                        }}
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
                  </motion.div>
                );
              })
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
                  {search ? "Nenhum resultado" : "Sem transações"}
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
          </AnimatePresence>
        </div>
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
                    if (txToDelete) {
                      const amount = txToDelete.amount;
                      const type = txToDelete.type;
                      const accMatch = txToDelete.description?.match(
                        /\[Conta:\s*([^\]]+)\]/,
                      );
                      const accName = accMatch ? accMatch[1] : null;
                      const acc = accounts.find((a: any) => a.name === accName);

                      if (acc) {
                        const newBalance =
                          type === "income"
                            ? acc.balance - amount
                            : acc.balance + amount;
                        await supabase
                          .from("accounts")
                          .update({ balance: newBalance })
                          .eq("id", acc.id);
                        refetchAccounts();
                      }
                    }
                    await remove(deleteId);
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
