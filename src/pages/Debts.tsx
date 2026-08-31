import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import { parseBRLAmount, formatCurrencyInput } from "@/lib/utils";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  useDebts,
  useAccounts,
  useCreditCards,
  useCategories,
  useAllDebtPayments,
  recalcCreditCardBills,
} from "@/hooks/use-supabase";
import {
  debtNextDue,
  debtProgress,
  debtInstallmentLabel,
} from "@/lib/debt";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  HandCoins,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  CircleDollarSign,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { demoDebts, demoDebtsSummary } from "@/lib/demo-data";

const MONTHS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const formatCurrency = (value: number) =>
  (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

type EntryMode = "installments" | "free";

export default function Debts() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDiscount, setPayDiscount] = useState("");
  const [payMethod, setPayMethod] = useState("pix");
  const [payAccountId, setPayAccountId] = useState("");
  const [payCreditCardId, setPayCreditCardId] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(
    null,
  );
  const [filter, setFilter] = useState<"active" | "paid" | "all">("active");

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = String(now.getFullYear());

  const emptyForm = {
    creditor: "",
    description: "",
    entryMode: "installments" as EntryMode,
    originalAmount: "",
    installmentValue: "",
    installmentsTotal: "12",
    totalAmount: "",
    remainingAmount: "",
    dayDue: "10",
    startMonth: currentMonth,
    startYear: currentYear,
    categoryId: "none",
    creditCardId: "none",
  };
  const [form, setForm] = useState(emptyForm);

  const {
    data: realDebts,
    loading: debtsLoading,
    summary: realSummary,
    create,
    update,
    remove,
    recordPayment,
    refetch: refetchDebts,
  } = useDebts();
  const { data: realAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: realCreditCards } = useCreditCards();
  const { data: realCategories } = useCategories();
  const { byDebt: paymentsByDebt, refetch: refetchPayments } =
    useAllDebtPayments();

  const useDemo = !!user?.is_anonymous;
  const debts = useDemo ? demoDebts : realDebts;
  const summaryData = useDemo ? demoDebtsSummary : realSummary;
  const accounts = useDemo ? [] : realAccounts;
  const creditCards = useDemo ? [] : realCreditCards;
  const categories = useDemo ? [] : realCategories;

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const resetForm = () => {
    setForm(emptyForm);
    setEditingDebt(null);
  };

  const openEdit = (debt: any) => {
    const hasInstallments = !!debt.installments_total;
    setEditingDebt(debt);
    setForm({
      creditor: debt.creditor,
      description: debt.description || "",
      entryMode: hasInstallments ? "installments" : "free",
      originalAmount: debt.original_amount
        ? formatCurrencyInput(Number(debt.original_amount))
        : "",
      installmentValue: debt.monthly_payment
        ? formatCurrencyInput(Number(debt.monthly_payment))
        : "",
      installmentsTotal: String(debt.installments_total || 12),
      totalAmount: formatCurrencyInput(Number(debt.total_amount)),
      remainingAmount: formatCurrencyInput(Number(debt.remaining_amount)),
      dayDue: String(
        debt.day_due || Number((debt.due_date || "").slice(-2)) || 10,
      ),
      startMonth: (debt.start_date || `${currentYear}-${currentMonth}`).slice(
        5,
        7,
      ),
      startYear: (debt.start_date || `${currentYear}`).slice(0, 4),
      categoryId: debt.category_id || "none",
      creditCardId: debt.credit_card_id || "none",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.creditor.trim()) {
      toast.error("Informe o credor / loja / banco.");
      return;
    }

    const original = parseBRLAmount(form.originalAmount) || null;
    const dayDue = Math.min(Math.max(parseInt(form.dayDue) || 10, 1), 31);
    const startDate = `${form.startYear}-${form.startMonth}-${String(dayDue).padStart(2, "0")}`;

    let totalAmount: number;
    let remainingAmount: number;
    let monthlyPayment: number;
    let installmentsTotal: number | null = null;

    if (form.entryMode === "installments") {
      const perInstallment = parseBRLAmount(form.installmentValue);
      const count = Math.max(1, parseInt(form.installmentsTotal) || 1);
      if (perInstallment <= 0) {
        toast.error("Informe o valor da parcela.");
        return;
      }
      installmentsTotal = count;
      monthlyPayment = perInstallment;
      totalAmount = Math.round(perInstallment * count * 100) / 100;
      const paidCount = editingDebt?.installments_paid ?? 0;
      remainingAmount =
        Math.round(perInstallment * Math.max(0, count - paidCount) * 100) / 100;
    } else {
      totalAmount = parseBRLAmount(form.totalAmount);
      remainingAmount =
        parseBRLAmount(form.remainingAmount) || totalAmount;
      monthlyPayment = 0;
      if (totalAmount <= 0) {
        toast.error("Informe o valor total da dívida.");
        return;
      }
    }

    const interestRate =
      original && original > 0 && totalAmount > original
        ? Math.round(((totalAmount - original) / original) * 10000) / 100
        : null;

    const data: any = {
      creditor: form.creditor.trim(),
      description: form.description.trim() || null,
      total_amount: totalAmount,
      remaining_amount: remainingAmount,
      monthly_payment: monthlyPayment,
      original_amount: original,
      interest_rate: interestRate,
      installments_total: installmentsTotal,
      day_due: dayDue,
      start_date: startDate,
      due_date: startDate,
      category_id: form.categoryId === "none" ? null : form.categoryId,
      credit_card_id:
        form.creditCardId === "none" ? null : form.creditCardId,
    };

    if (!useDemo) {
      if (editingDebt) {
        await update(editingDebt.id, data);
        toast.success("Dívida atualizada!");
      } else {
        await create({ ...data, installments_paid: 0 });
        toast.success("Dívida cadastrada!");
      }
      await refetchDebts();
    }
    setDialogOpen(false);
    resetForm();
  };

  const openPay = (debt: any) => {
    if (debt.is_paid) return;
    setPayingDebt(debt);
    const suggested = debt.monthly_payment || debt.remaining_amount || 0;
    setPayAmount(formatCurrencyInput(Math.min(suggested, debt.remaining_amount)));
    setPayDiscount("");
    setPayDate(new Date().toISOString().split("T")[0]);
    if (debt.credit_card_id) {
      setPayMethod("credit_card");
      setPayCreditCardId(debt.credit_card_id);
      setPayAccountId("");
    } else {
      setPayMethod("pix");
      setPayCreditCardId("");
      if (accounts.length > 0) setPayAccountId(accounts[0].id);
    }
    setPayDialogOpen(true);
  };

  const handlePay = async () => {
    if (!payingDebt) return;
    const amount = parseBRLAmount(payAmount);
    const discount = parseBRLAmount(payDiscount) || 0;
    if (amount <= 0) {
      toast.error("Informe o valor pago.");
      return;
    }

    if (useDemo) {
      toast.info("Modo demonstração não altera dados.");
      setPayDialogOpen(false);
      return;
    }

    // Crediário já vinculado a um cartão: a fatura do cartão é a fonte da
    // verdade do dinheiro. Aqui só avançamos o cronograma (sem criar transação
    // nem debitar conta) para não contar a mesma parcela duas vezes.
    if (payingDebt.credit_card_id) {
      try {
        await recordPayment(payingDebt.id, {
          amount,
          discount,
          paidAt: payDate,
          method: "Fatura do cartão",
          sourceName:
            creditCards.find((c: any) => c.id === payingDebt.credit_card_id)
              ?.name ?? "Cartão",
        });
        await Promise.all([refetchDebts(), refetchPayments()]);
        toast.success("Parcela registrada (já contabilizada na fatura).");
        setPayDialogOpen(false);
        setPayingDebt(null);
        setPayAmount("");
        setPayDiscount("");
      } catch (e: any) {
        console.error(e);
        toast.error("Erro: " + (e?.message || e));
      }
      return;
    }

    const isCard = payMethod === "credit_card";
    if (isCard && !payCreditCardId) {
      toast.error("Selecione o cartão.");
      return;
    }
    if (!isCard && !payAccountId) {
      toast.error("Selecione a conta de débito.");
      return;
    }

    try {
      const debtCat =
        categories.find((c: any) => c.id === payingDebt.category_id) ||
        categories.find(
          (c: any) =>
            c.name.toLowerCase().includes("dívida") ||
            c.name.toLowerCase().includes("divida") ||
            c.name.toLowerCase().includes("outros"),
        ) ||
        categories.find((c: any) => c.type === "expense");
      const categoryId = debtCat?.id ?? null;

      const methodLabel = isCard
        ? "Cartão"
        : payMethod === "pix"
          ? "PIX"
          : payMethod === "money"
            ? "Dinheiro"
            : "Débito";

      const selectedAcc = accounts.find((a: any) => a.id === payAccountId);
      const selectedCard = creditCards.find(
        (c: any) => c.id === payCreditCardId,
      );
      const sourceName = isCard
        ? selectedCard?.name || "Cartão"
        : selectedAcc?.name || "Conta";

      const descBase = `[Pagamento Dívida] ${payingDebt.creditor}${
        discount > 0 ? ` (Desconto: ${formatCurrency(discount)})` : ""
      }`;

      const { data: newTx } = await supabase
        .from("transactions")
        .insert({
          user_id: user?.id,
          type: "expense",
          amount,
          description: descBase,
          date: payDate,
          category_id: categoryId,
          is_fixed: false,
          is_credit_card: isCard,
          credit_card_id: isCard ? payCreditCardId : null,
          account_id: isCard ? null : payAccountId,
          payment_method: methodLabel,
        })
        .select()
        .single();

      if (isCard && payCreditCardId) {
        await recalcCreditCardBills(user?.id || "", payCreditCardId);
      } else if (selectedAcc) {
        await supabase
          .from("accounts")
          .update({ balance: selectedAcc.balance - amount })
          .eq("id", selectedAcc.id);
        refetchAccounts();
      }

      await recordPayment(payingDebt.id, {
        amount,
        discount,
        paidAt: payDate,
        method: methodLabel,
        sourceName,
        transactionId: newTx?.id ?? null,
      });

      await Promise.all([refetchDebts(), refetchPayments()]);
      toast.success("Pagamento registrado!");
      setPayDialogOpen(false);
      setPayingDebt(null);
      setPayAmount("");
      setPayDiscount("");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao registrar pagamento: " + (e?.message || e));
    }
  };

  const filteredDebts = debts.filter((d: any) => {
    if (filter === "active") return !d.is_paid;
    if (filter === "paid") return d.is_paid;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-warning" /> Modo
            demonstração
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight">
              Dívidas & Crediários
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Parcelas, crediários, carnês e empréstimos — com controle por
              parcela
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
              <Button size="sm" className="text-xs h-9">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Novo Crediário / Dívida
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm font-medium">
                  {editingDebt ? "Editar Dívida" : "Novo Crediário ou Dívida"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Crediário parcelado, carnê, empréstimo ou financiamento
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Credor / Loja / Banco *
                  </label>
                  <Input
                    value={form.creditor}
                    onChange={(e) =>
                      setForm({ ...form, creditor: e.target.value })
                    }
                    placeholder="Ex: Casas Bahia, Magazine Luiza, Itaú..."
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Descrição (opcional)
                  </label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Ex: Geladeira parcelada em 12x"
                    className="resize-none h-14"
                  />
                </div>

                {/* Modo de entrada */}
                <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
                  {(
                    [
                      ["installments", "Parcelado (Nx)"],
                      ["free", "Valor livre"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, entryMode: val as EntryMode })
                      }
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.entryMode === val
                          ? "bg-card shadow-sm text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {form.entryMode === "installments" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">
                        Valor da parcela *
                      </label>
                      <BRLCurrencyInput
                        value={form.installmentValue}
                        onChangeValue={(v) =>
                          setForm({ ...form, installmentValue: v })
                        }
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">
                        Nº de parcelas *
                      </label>
                      <Select
                        value={form.installmentsTotal}
                        onValueChange={(v) =>
                          setForm({ ...form, installmentsTotal: v })
                        }
                      >
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 48 }, (_, i) => i + 1).map(
                            (n) => (
                              <SelectItem
                                key={n}
                                value={String(n)}
                                className="text-xs"
                              >
                                {n}x
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 text-[10px] text-muted-foreground">
                      Total:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(
                          parseBRLAmount(form.installmentValue) *
                            (parseInt(form.installmentsTotal) || 0),
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">
                        Valor total *
                      </label>
                      <BRLCurrencyInput
                        value={form.totalAmount}
                        onChangeValue={(v) =>
                          setForm({ ...form, totalAmount: v })
                        }
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">
                        Restante a pagar
                      </label>
                      <BRLCurrencyInput
                        value={form.remainingAmount}
                        onChangeValue={(v) =>
                          setForm({ ...form, remainingAmount: v })
                        }
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">
                    Valor à vista / original (opcional — calcula os juros)
                  </label>
                  <BRLCurrencyInput
                    value={form.originalAmount}
                    onChangeValue={(v) =>
                      setForm({ ...form, originalAmount: v })
                    }
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Dia venc.
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={form.dayDue}
                      onChange={(e) =>
                        setForm({ ...form, dayDue: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      1ª parcela
                    </label>
                    <Select
                      value={form.startMonth}
                      onValueChange={(v) =>
                        setForm({ ...form, startMonth: v })
                      }
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            className="text-xs"
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Ano
                    </label>
                    <Input
                      type="number"
                      min={2020}
                      max={2040}
                      value={form.startYear}
                      onChange={(e) =>
                        setForm({ ...form, startYear: e.target.value })
                      }
                    />
                  </div>
                </div>

                {creditCards.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Pago na fatura de um cartão? (evita contagem dupla)
                    </label>
                    <Select
                      value={form.creditCardId}
                      onValueChange={(v) =>
                        setForm({ ...form, creditCardId: v })
                      }
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          Não — dívida avulsa
                        </SelectItem>
                        {creditCards.map((c: any) => (
                          <SelectItem
                            key={c.id}
                            value={c.id}
                            className="text-xs"
                          >
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button size="sm" className="text-xs" onClick={handleSave}>
                  {editingDebt ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pay dialog */}
        <Dialog
          open={payDialogOpen}
          onOpenChange={(open) => {
            setPayDialogOpen(open);
            if (!open) {
              setPayingDebt(null);
              setPayAmount("");
              setPayDiscount("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[360px]">
            <DialogHeader>
              <DialogTitle className="text-sm font-medium">
                Registrar Pagamento
              </DialogTitle>
              <DialogDescription className="text-xs">
                {payingDebt ? `Pagamento para ${payingDebt.creditor}` : ""}
              </DialogDescription>
            </DialogHeader>
            {payingDebt && (
              <div className="space-y-4 py-2">
                <div className="bg-secondary/30 rounded-sm px-3 py-2 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Restante</span>
                    <span className="font-medium">
                      {formatCurrency(payingDebt.remaining_amount)}
                    </span>
                  </div>
                  {payingDebt.installments_total > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Parcelas</span>
                      <span className="text-muted-foreground">
                        {payingDebt.installments_paid ?? 0}/
                        {payingDebt.installments_total}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Valor pago *
                    </label>
                    <BRLCurrencyInput
                      value={payAmount}
                      onChangeValue={setPayAmount}
                      placeholder="R$ 0,00"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Desconto
                    </label>
                    <BRLCurrencyInput
                      value={payDiscount}
                      onChangeValue={setPayDiscount}
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Data
                  </label>
                  <Input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {payingDebt.credit_card_id ? (
                  <p className="text-[10px] text-muted-foreground bg-purple-500/10 rounded-lg px-2.5 py-2">
                    Esta dívida é paga na fatura do cartão. Registrar aqui só
                    avança o cronograma — o valor já entra na fatura.
                  </p>
                ) : (
                  <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Método
                  </label>
                  <Select
                    value={payMethod}
                    onValueChange={(v) => {
                      setPayMethod(v);
                      if (v === "credit_card") {
                        setPayAccountId("");
                        if (creditCards.length > 0 && !payCreditCardId)
                          setPayCreditCardId(creditCards[0].id);
                      } else {
                        setPayCreditCardId("");
                        if (accounts.length > 0 && !payAccountId)
                          setPayAccountId(accounts[0].id);
                      }
                    }}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="money">Dinheiro</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                      <SelectItem value="credit_card">
                        Cartão de crédito
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payMethod === "credit_card" ? (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Cartão
                    </label>
                    {creditCards.length > 0 ? (
                      <Select
                        value={payCreditCardId}
                        onValueChange={setPayCreditCardId}
                      >
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {creditCards.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-[10px] text-destructive">
                        Nenhum cartão cadastrado.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Conta de débito
                    </label>
                    {accounts.length > 0 ? (
                      <Select
                        value={payAccountId}
                        onValueChange={setPayAccountId}
                      >
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((a: any) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name} ({formatCurrency(a.balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-[10px] text-destructive">
                        Nenhuma conta cadastrada.
                      </p>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setPayDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button size="sm" className="text-xs" onClick={handlePay}>
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Summary */}
        {summaryData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid sm:grid-cols-4 gap-4"
          >
            <div className="p-5 rounded-sm border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Total Restante</p>
              <p className="text-lg font-light tabular-nums text-destructive">
                {formatCurrency(summaryData.totalRemaining)}
              </p>
              {"totalRemainingOnCard" in summaryData &&
                summaryData.totalRemainingOnCard > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatCurrency(summaryData.totalRemainingOnCard)} na fatura
                    de cartão
                  </p>
                )}
            </div>
            <div className="p-5 rounded-sm border bg-card">
              <p className="text-xs text-muted-foreground mb-1">
                Total em Dívidas
              </p>
              <p className="text-lg font-light tabular-nums">
                {formatCurrency(summaryData.totalOwed)}
              </p>
            </div>
            <div className="p-5 rounded-sm border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Total Pago</p>
              <p className="text-lg font-light tabular-nums text-success">
                {formatCurrency(summaryData.totalPaid)}
              </p>
            </div>
            <div className="p-5 rounded-sm border bg-card">
              <p className="text-xs text-muted-foreground mb-1">
                Parcelas/Mês
              </p>
              <p className="text-lg font-light tabular-nums">
                {formatCurrency(summaryData.totalMonthly)}
              </p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b pb-0">
          {(["active", "paid", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 border-b-2 transition-colors -mb-px ${
                filter === f
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "active" ? "Pendentes" : f === "paid" ? "Pagas" : "Todas"}
            </button>
          ))}
          {summaryData && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              {summaryData.activeCount} pendentes · {summaryData.paidCount} pagas
            </span>
          )}
        </div>

        {/* List */}
        {filteredDebts.length > 0 ? (
          <div className="space-y-2">
            {filteredDebts.map((debt: any, i: number) => {
              const progress = debtProgress(debt) * 100;
              const next = debtNextDue(debt, now);
              const instLabel = debtInstallmentLabel(debt);
              const interestAmount =
                debt.original_amount && debt.total_amount > debt.original_amount
                  ? debt.total_amount - debt.original_amount
                  : 0;
              const payments = paymentsByDebt[debt.id] ?? [];
              const linkedCard = creditCards.find(
                (c: any) => c.id === debt.credit_card_id,
              );

              return (
                <motion.div
                  key={debt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-sm border bg-card hover:shadow-sm transition-shadow group ${
                    debt.is_paid ? "opacity-60" : ""
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => openPay(debt)}
                        className="mt-0.5 shrink-0"
                        title={debt.is_paid ? "Paga" : "Registrar pagamento"}
                      >
                        {debt.is_paid ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-medium truncate ${
                              debt.is_paid
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {debt.creditor}
                          </span>
                          {instLabel && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-secondary text-muted-foreground font-medium">
                              {instLabel}
                            </span>
                          )}
                          {next.overdue && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-destructive/10 text-destructive font-medium">
                              Atrasada
                            </span>
                          )}
                          {linkedCard && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                              <CreditCard className="w-2.5 h-2.5" />
                              {linkedCard.name}
                            </span>
                          )}
                        </div>

                        {debt.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {debt.description}
                          </p>
                        )}

                        {(debt.original_amount || interestAmount > 0) && (
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                            {debt.original_amount ? (
                              <span>
                                À vista:{" "}
                                <span className="font-semibold text-foreground">
                                  {formatCurrency(debt.original_amount)}
                                </span>
                              </span>
                            ) : null}
                            {interestAmount > 0 && (
                              <span>
                                Juros:{" "}
                                <span className="font-semibold text-warning">
                                  {formatCurrency(interestAmount)}
                                </span>
                                {debt.interest_rate
                                  ? ` (${debt.interest_rate}%)`
                                  : ""}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <CircleDollarSign className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs tabular-nums">
                              Restam{" "}
                              <span className="font-medium">
                                {formatCurrency(debt.remaining_amount)}
                              </span>
                            </span>
                          </div>
                          {debt.monthly_payment > 0 && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(debt.monthly_payment)}/mês
                              </span>
                            </div>
                          )}
                          {!debt.is_paid && (
                            <span
                              className={`text-[10px] ${
                                next.overdue
                                  ? "text-destructive font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {next.overdue
                                ? `venceu em ${new Date(
                                    next.date + "T00:00:00",
                                  ).toLocaleDateString("pt-BR")}`
                                : next.daysUntil === 0
                                  ? "vence hoje"
                                  : `vence em ${next.daysUntil}d (${new Date(
                                      next.date + "T00:00:00",
                                    ).toLocaleDateString("pt-BR")})`}
                            </span>
                          )}
                        </div>

                        {!debt.is_paid && (
                          <div className="mt-3 space-y-1 max-w-sm">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Progresso</span>
                              <span className="font-semibold tabular-nums">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-success rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {payments.length > 0 && (
                          <div className="mt-4 pt-3 border-t">
                            <button
                              onClick={() =>
                                setExpandedHistoryId(
                                  expandedHistoryId === debt.id
                                    ? null
                                    : debt.id,
                                )
                              }
                              className="text-[10px] font-medium text-primary hover:underline"
                            >
                              {expandedHistoryId === debt.id
                                ? "Ocultar histórico"
                                : `Histórico de pagamentos (${payments.length})`}
                            </button>
                            {expandedHistoryId === debt.id && (
                              <div className="mt-3 space-y-3 pl-3 border-l border-primary/30">
                                {payments.map((p: any) => (
                                  <div
                                    key={p.id}
                                    className="relative pl-1 text-[10px]"
                                  >
                                    <div className="absolute -left-[16px] top-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                                    <p className="font-semibold text-foreground">
                                      {formatCurrency(p.amount)}
                                      {p.discount > 0 && (
                                        <span className="text-chart-2 ml-1.5 font-normal">
                                          (Desconto:{" "}
                                          {formatCurrency(p.discount)})
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground mt-0.5">
                                      {new Date(
                                        p.paid_at +
                                          (p.paid_at.includes("T")
                                            ? ""
                                            : "T00:00:00"),
                                      ).toLocaleDateString("pt-BR")}
                                      {p.source_name
                                        ? ` · ${p.source_name}`
                                        : ""}
                                      {p.method ? ` (${p.method})` : ""}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm tabular-nums ${
                            debt.is_paid
                              ? "text-muted-foreground line-through"
                              : ""
                          }`}
                        >
                          {formatCurrency(debt.total_amount)}
                        </p>
                        {!debt.is_paid && (
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[10px] h-7 px-2"
                              onClick={() => openPay(debt)}
                            >
                              Pagar
                            </Button>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEdit(debt)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => {
                                  if (!useDemo) remove(debt.id);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3">
              <HandCoins className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {filter === "active"
                ? "Nenhuma dívida pendente!"
                : filter === "paid"
                  ? "Nenhuma dívida paga ainda"
                  : "Nenhuma dívida cadastrada"}
            </p>
            {filter !== "paid" && (
              <Button
                size="sm"
                className="text-xs"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Cadastrar dívida
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
