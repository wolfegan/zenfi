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
import { parseBRLAmount } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useDebts, useAccounts, useCreditCards, useCategories, syncCreditCardBill } from "@/hooks/use-supabase";
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
} from "lucide-react";
import { useEffect, useState } from "react";
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

export default function Debts() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDiscount, setPayDiscount] = useState("");
  const [payPaymentMethod, setPayPaymentMethod] = useState("pix");
  const [payAccountId, setPayAccountId] = useState("");
  const [payCreditCardId, setPayCreditCardId] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [form, setForm] = useState({
    creditor: "",
    description: "",
    originalAmount: "",
    totalAmount: "",
    remainingAmount: "",
    monthlyPayment: "",
    dueDay: "10",
    dueMonth: "",
    startMonth: "",
    startYear: "",
  });
  const [filter, setFilter] = useState<"all" | "active" | "paid">("active");
  const [summary, setSummary] = useState<any>(null);

  const {
    data: realDebts,
    loading: debtsLoading,
    getSummary,
    create,
    update,
    remove,
    payInstallment,
    markAsPaid,
    refetch: refetchDebts,
  } = useDebts();

  const { data: realAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: realCreditCards } = useCreditCards();
  const { data: realCategories } = useCategories();

  useEffect(() => {
    if (!debtsLoading && realDebts.length > 0) {
      getSummary().then(setSummary);
    }
  }, [debtsLoading, realDebts, getSummary]);

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => {
    if (!isLoading && !debtsLoading) {
      setUseDemo(!!user?.is_anonymous && realDebts.length === 0);
    }
  }, [isLoading, debtsLoading, realDebts, user]);

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = String(now.getFullYear());

  const debts = useDemo ? demoDebts : realDebts;
  const summaryData = useDemo ? demoDebtsSummary : summary;
  const accounts = useDemo ? [] : realAccounts;
  const creditCards = useDemo ? [] : realCreditCards;

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const resetForm = () => {
    setForm({
      creditor: "",
      description: "",
      originalAmount: "",
      totalAmount: "",
      remainingAmount: "",
      monthlyPayment: "",
      dueDay: "10",
      dueMonth: currentMonth,
      startMonth: currentMonth,
      startYear: currentYear,
    });
  };

  const filteredDebts = debts.filter((d: any) => {
    if (filter === "active") return !d.is_paid;
    if (filter === "paid") return d.is_paid;
    return true;
  });

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
              Acompanhe suas parcelas, crediários, carnês e empréstimos
            </p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                resetForm();
                setEditingDebt(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-9">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Novo Crediário / Dívida
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-medium">
                  {editingDebt
                    ? "Editar Dívida / Crediário"
                    : "Novo Crediário ou Dívida"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Adicione os detalhes do seu crediário, carnê, débito ou
                  empréstimo
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
                    placeholder="Ex: Casas Bahia, Magazine Luiza, Banco Itaú..."
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
                    placeholder="Ex: Celular parcelado em 12x..."
                    className="resize-none h-16"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      Valor Original (À Vista)
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={form.originalAmount}
                      onChange={(e) =>
                        setForm({ ...form, originalAmount: e.target.value })
                      }
                      placeholder="Ex: 800,00"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      Valor Total (Juros) *
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={form.totalAmount}
                      onChange={(e) =>
                        setForm({ ...form, totalAmount: e.target.value })
                      }
                      placeholder="Ex: 1.200,00"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      Restante a Pagar *
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={form.remainingAmount}
                      onChange={(e) =>
                        setForm({ ...form, remainingAmount: e.target.value })
                      }
                      placeholder="Ex: 1.000,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Valor da Parcela Mensal
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.monthlyPayment}
                    onChange={(e) =>
                      setForm({ ...form, monthlyPayment: e.target.value })
                    }
                    placeholder="Ex: 100,00"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Vencimento
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={form.dueDay}
                      onChange={(e) =>
                        setForm({ ...form, dueDay: e.target.value })
                      }
                      placeholder="Dia"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Mês início
                    </label>
                    <Select
                      value={form.dueMonth}
                      onValueChange={(v) => setForm({ ...form, dueMonth: v })}
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
                      min={2024}
                      max={2035}
                      value={form.startYear}
                      onChange={(e) =>
                        setForm({ ...form, startYear: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                    setEditingDebt(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    if (
                      form.creditor &&
                      form.totalAmount &&
                      form.remainingAmount
                    ) {
                      const startDate = `${form.startYear}-${form.dueMonth}-${String(form.dueDay).padStart(2, "0")}`;
                      const dueDate = `${now.getFullYear()}-${form.dueMonth}-${String(form.dueDay).padStart(2, "0")}`;
                      const totalAmt = parseBRLAmount(form.totalAmount);
                      const remainingAmt = parseBRLAmount(form.remainingAmount);
                      const monthlyPymt =
                        parseBRLAmount(form.monthlyPayment) || 0;
                      let descVal = form.description.trim();
                      if (form.originalAmount.trim()) {
                        descVal = `[Original: ${form.originalAmount.trim()}] ${descVal}`;
                      }

                      // Preservar o histórico de pagamentos existente se for edição
                      if (editingDebt) {
                        const paymentsMatch = editingDebt.description?.match(/\[Payments:\s*([^\]]+)\]/);
                        if (paymentsMatch) {
                          descVal = `${descVal.trim()} [Payments: ${paymentsMatch[1]}]`;
                        }
                      }

                      const data = {
                        creditor: form.creditor,
                        description: descVal.trim() || null,
                        total_amount: totalAmt,
                        remaining_amount: remainingAmt,
                        monthly_payment: monthlyPymt,
                        due_date: dueDate,
                        start_date: startDate,
                      };
                      if (!useDemo) {
                        if (editingDebt) await update(editingDebt.id, data);
                        else await create(data);
                      }
                      setDialogOpen(false);
                      resetForm();
                      setEditingDebt(null);
                    }
                  }}
                >
                  {editingDebt ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
          <DialogContent className="sm:max-w-[340px]">
            <DialogHeader>
              <DialogTitle className="text-sm font-medium">
                Registrar Pagamento
              </DialogTitle>
              <DialogDescription className="text-xs">
                {payingDebt
                  ? `Quanto você pagou para ${payingDebt.creditor}?`
                  : ""}
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
                  <div className="flex items-center justify-between">
                    <span>Valor total</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(payingDebt.total_amount)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Valor pago *
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Ex: 300,00"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Desconto (opcional)
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={payDiscount}
                      onChange={(e) => setPayDiscount(e.target.value)}
                      placeholder="Ex: 50,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Método
                  </label>
                  <Select
                    value={payPaymentMethod}
                    onValueChange={(v) => {
                      setPayPaymentMethod(v);
                      if (v === "credit_card") {
                        setPayAccountId("");
                        if (creditCards.length > 0) setPayCreditCardId(creditCards[0].id);
                      } else {
                        setPayCreditCardId("");
                        if (accounts.length > 0) setPayAccountId(accounts[0].id);
                      }
                    }}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="money">Dinheiro</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                      <SelectItem value="credit_card">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payPaymentMethod !== "credit_card" ? (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Conta de Débito
                    </label>
                    {accounts.length > 0 ? (
                      <Select
                        value={payAccountId}
                        onValueChange={setPayAccountId}
                      >
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc: any) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name} ({formatCurrency(acc.balance)})
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
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Cartão de Crédito
                    </label>
                    {creditCards.length > 0 ? (
                      <Select
                        value={payCreditCardId}
                        onValueChange={setPayCreditCardId}
                      >
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue placeholder="Selecione o cartão" />
                        </SelectTrigger>
                        <SelectContent>
                          {creditCards.map((card: any) => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.name} (Venc. dia {card.due_day})
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
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setPayDialogOpen(false);
                  setPayingDebt(null);
                  setPayAmount("");
                  setPayDiscount("");
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={async () => {
                  const amount = parseBRLAmount(payAmount);
                  const discount = parseBRLAmount(payDiscount) || 0;
                  const totalDeduction = amount + discount;

                  // Buscar categoria de Dívida / Outros para associar à transação de despesa
                  const debtCat = realCategories.find(
                    (c: any) =>
                      c.name.toLowerCase().includes("dívida") ||
                      c.name.toLowerCase().includes("dividas")
                  ) || realCategories.find(
                    (c: any) =>
                      c.name.toLowerCase().includes("outros")
                  ) || realCategories.find(
                    (c: any) => c.type === "expense"
                  );
                  const resolvedCategoryId = debtCat ? debtCat.id : null;
                  
                  if (payingDebt && amount > 0) {
                    if (!useDemo) {
                      // 1. Extrair e gerar o novo histórico de pagamentos serializado
                      const prevPaymentsMatch = payingDebt.description?.match(/\[Payments:\s*([^\]]+)\]/);
                      let prevPaymentsList = [];
                      if (prevPaymentsMatch) {
                        try {
                          prevPaymentsList = JSON.parse(prevPaymentsMatch[1]);
                        } catch (e) {}
                      }

                      const selectedAcc = accounts.find((a: any) => a.id === payAccountId);
                      const selectedCard = creditCards.find((c: any) => c.id === payCreditCardId);
                      const sourceName = payPaymentMethod === "credit_card"
                        ? (selectedCard?.name || "Cartão")
                        : (selectedAcc?.name || "Conta");
                      const methodLabel = payPaymentMethod === "credit_card"
                        ? "Cartão"
                        : payPaymentMethod === "pix"
                        ? "PIX"
                        : payPaymentMethod === "money"
                        ? "Dinheiro"
                        : "Débito";

                      const newPayment = {
                        date: new Date().toISOString(),
                        amount,
                        discount,
                        accountName: sourceName,
                        method: methodLabel
                      };

                      const newPaymentsList = [...prevPaymentsList, newPayment];
                      let cleanDescription = payingDebt.description?.replace(/\[Payments:\s*([^\]]+)\]\s*/, "") || "";
                      const updatedDescription = `${cleanDescription.trim()} [Payments: ${JSON.stringify(newPaymentsList)}]`;

                      // 2. Salvar descrição com histórico atualizado no Supabase
                      await supabase
                        .from("debts")
                        .update({ description: updatedDescription })
                        .eq("id", payingDebt.id);

                      // 3. Registrar pagamento na tabela debts com desconto considerado
                      if (totalDeduction >= payingDebt.remaining_amount)
                        await markAsPaid(payingDebt.id);
                      else await payInstallment(payingDebt.id, totalDeduction);

                      // 4. Criar transação e descontar da conta/cartão correspondente
                      if (payPaymentMethod === "credit_card") {
                        if (payCreditCardId) {
                          const txDesc = discount > 0
                            ? `[Pagamento Dívida] ${payingDebt.creditor} (Desconto: ${formatCurrency(discount)})`
                            : `[Pagamento Dívida] ${payingDebt.creditor}`;

                          const { data: newTx } = await supabase
                            .from("transactions")
                            .insert({
                              user_id: user?.id,
                              type: "expense",
                              amount: amount,
                              description: txDesc,
                              date: new Date().toISOString().split("T")[0],
                              category_id: resolvedCategoryId,
                              is_fixed: false,
                              is_credit_card: true,
                              credit_card_id: payCreditCardId,
                            })
                            .select()
                            .single();

                          if (newTx) {
                            await syncCreditCardBill(
                              payCreditCardId,
                              newTx.date,
                              newTx.amount,
                              user?.id || ""
                            );
                          }
                        }
                      } else {
                        if (payAccountId) {
                          const selectedAcc = accounts.find(
                            (a: any) => a.id === payAccountId
                          );
                          if (selectedAcc) {
                            const newBalance = selectedAcc.balance - amount;
                            await supabase
                              .from("accounts")
                              .update({ balance: newBalance })
                              .eq("id", selectedAcc.id);

                            const methodLabel =
                              payPaymentMethod === "pix"
                                ? "PIX"
                                : payPaymentMethod === "money"
                                ? "Dinheiro"
                                : "Débito";

                            const txDesc = discount > 0
                              ? `[Conta: ${selectedAcc.name}] [Pagamento Dívida] ${payingDebt.creditor} (Desconto: ${formatCurrency(discount)})`
                              : `[Conta: ${selectedAcc.name}] [Pagamento Dívida] ${payingDebt.creditor}`;

                            await supabase.from("transactions").insert({
                              user_id: user?.id,
                              type: "expense",
                              amount: amount,
                              description: txDesc,
                              date: new Date().toISOString().split("T")[0],
                              category_id: resolvedCategoryId,
                              is_fixed: false,
                              is_credit_card: false,
                              payment_method: methodLabel,
                            });

                            refetchAccounts();
                          }
                        }
                      }

                      await refetchDebts();
                      await getSummary().then(setSummary);
                      toast.success("Pagamento registrado com sucesso!");
                    } else {
                      toast.info("Modo demonstração não altera dados.");
                    }
                    setPayDialogOpen(false);
                    setPayingDebt(null);
                    setPayAmount("");
                    setPayDiscount("");
                  }
                }}
              >
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {summaryData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid sm:grid-cols-4 gap-4"
          >
            <div className="p-5 rounded-sm border bg-card">
              <p className="text-xs text-muted-foreground mb-1">
                Total Restante
              </p>
              <p className="text-lg font-light tabular-nums text-destructive">
                {formatCurrency(summaryData.totalRemaining)}
              </p>
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
                Pagamentos/Mês
              </p>
              <p className="text-lg font-light tabular-nums">
                {formatCurrency(summaryData.totalMonthly)}
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-1 border-b pb-0">
          {(["active", "paid", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 border-b-2 transition-colors -mb-px ${filter === f ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {f === "active" ? "Pendentes" : f === "paid" ? "Pagas" : "Todas"}
            </button>
          ))}
          {summaryData && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              {summaryData.activeCount} pendentes · {summaryData.paidCount}{" "}
              pagas
            </span>
          )}
        </div>

        {filteredDebts.length > 0 ? (
          <div className="space-y-2">
            {filteredDebts.map((debt: any, i: number) => {
              const progress =
                debt.total_amount > 0
                  ? ((debt.total_amount - debt.remaining_amount) /
                      debt.total_amount) *
                    100
                  : 0;
              const origMatch = debt.description?.match(/\[Original:\s*([^\]]+)\]/);
              const origVal = origMatch ? parseBRLAmount(origMatch[1]) : 0;
              const interestAmount = origVal > 0 ? Math.max(0, debt.total_amount - origVal) : 0;
              const paymentsMatch = debt.description?.match(/\[Payments:\s*([^\]]+)\]/);
              let paymentsList: any[] = [];
              if (paymentsMatch) {
                try {
                  paymentsList = JSON.parse(paymentsMatch[1]);
                } catch (e) {}
              }
              const cleanDesc = debt.description
                ?.replace(/\[Original:\s*([^\]]+)\]\s*/, "")
                ?.replace(/\[Payments:\s*([^\]]+)\]\s*/, "") || "";
              const dueDate = new Date(
                debt.due_date +
                  (debt.due_date.includes("T") ? "" : "T00:00:00"),
              );
              const isOverdue = !debt.is_paid && dueDate < now;
              return (
                <motion.div
                  key={debt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-sm border bg-card hover:shadow-sm transition-shadow group ${debt.is_paid ? "opacity-60" : ""}`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => {
                          if (debt.is_paid) return;
                          if (!useDemo) markAsPaid(debt.id);
                        }}
                        className="mt-0.5 shrink-0"
                        title={debt.is_paid ? "Paga" : "Marcar como paga"}
                      >
                        {debt.is_paid ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium truncate ${debt.is_paid ? "line-through text-muted-foreground" : ""}`}
                          >
                            {debt.creditor}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-destructive/10 text-destructive font-medium">
                              Atrasada
                            </span>
                          )}
                        </div>
                        {cleanDesc && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cleanDesc}
                          </p>
                        )}

                        {/* Detalhes de Juros e Valor Original */}
                        {origVal > 0 && (
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                            <div>
                              Original: <span className="font-semibold text-foreground">{formatCurrency(origVal)}</span>
                            </div>
                            {interestAmount > 0 && (
                              <div>
                                Juros: <span className="font-semibold text-warning">{formatCurrency(interestAmount)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-2">
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
                        </div>

                        {/* Barra de Progresso Visual de Pagamento */}
                        {!debt.is_paid && debt.total_amount > 0 && (
                          <div className="mt-3 space-y-1 max-w-sm">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Progresso de pagamento</span>
                              <span className="font-semibold tabular-nums">{progress.toFixed(0)}% pago</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-success rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Histórico de Pagamentos */}
                        {paymentsList.length > 0 && (
                          <div className="mt-4 pt-3 border-t">
                            <button
                              onClick={() =>
                                setExpandedHistoryId(
                                  expandedHistoryId === debt.id
                                    ? null
                                    : debt.id,
                                )
                              }
                              className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
                            >
                              {expandedHistoryId === debt.id
                                ? "Ocultar Histórico"
                                : `Ver Histórico de Pagamentos (${paymentsList.length})`}
                            </button>

                            {expandedHistoryId === debt.id && (
                              <div className="mt-3 space-y-3 pl-3 border-l border-primary/30 relative">
                                {paymentsList.map(
                                  (payment: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="relative pl-1 text-[10px]"
                                    >
                                      {/* Marcador na timeline */}
                                      <div className="absolute -left-[16px] top-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                                      <p className="font-semibold text-foreground">
                                        {formatCurrency(payment.amount)}
                                        {payment.discount > 0 && (
                                          <span className="text-chart-2 ml-1.5 font-normal">
                                            (Desconto:{" "}
                                            {formatCurrency(payment.discount)})
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[9px] text-muted-foreground mt-0.5">
                                        {new Date(
                                          payment.date,
                                        ).toLocaleString("pt-BR", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "2-digit",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}{" "}
                                        · {payment.accountName} (
                                        {payment.method})
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm tabular-nums ${debt.is_paid ? "text-muted-foreground line-through" : ""}`}
                        >
                          {formatCurrency(debt.total_amount)}
                        </p>
                        {!debt.is_paid && (
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[10px] h-7 px-2"
                              onClick={() => {
                                setPayingDebt(debt);
                                setPayAmount(
                                  String(debt.monthly_payment || ""),
                                );
                                setPayPaymentMethod("pix");
                                if (accounts.length > 0) setPayAccountId(accounts[0].id);
                                setPayCreditCardId("");
                                setPayDialogOpen(true);
                              }}
                            >
                              Pagar
                            </Button>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  const sd = new Date(debt.start_date);
                                  const origMatch = debt.description?.match(/\[Original:\s*([^\]]+)\]/);
                                  const origVal = origMatch ? origMatch[1] : "";
                                  const cleanDesc = debt.description
                                    ?.replace(/\[Original:\s*([^\]]+)\]\s*/, "")
                                    ?.replace(/\[Payments:\s*([^\]]+)\]\s*/, "") || "";

                                  setEditingDebt(debt);
                                  setForm({
                                    creditor: debt.creditor,
                                    description: cleanDesc,
                                    originalAmount: origVal,
                                    totalAmount: String(debt.total_amount),
                                    remainingAmount: String(
                                      debt.remaining_amount,
                                    ),
                                    monthlyPayment: String(
                                      debt.monthly_payment,
                                    ),
                                    dueDay: String(
                                      new Date(debt.due_date).getDate(),
                                    ),
                                    dueMonth: String(
                                      new Date(debt.due_date).getMonth() + 1,
                                    ).padStart(2, "0"),
                                    startMonth: String(
                                      sd.getMonth() + 1,
                                    ).padStart(2, "0"),
                                    startYear: String(sd.getFullYear()),
                                  });
                                  setDialogOpen(true);
                                }}
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
                    {!debt.is_paid && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">
                            Progresso de pagamento
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-success"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
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
