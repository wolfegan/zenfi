import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
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
import { useDebts } from "@/hooks/use-supabase";
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
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [form, setForm] = useState({
    creditor: "",
    description: "",
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
  } = useDebts();

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

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const resetForm = () => {
    setForm({
      creditor: "",
      description: "",
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Valor Total da Compra *
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
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Valor Restante a Pagar *
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
                      const data = {
                        creditor: form.creditor,
                        description: form.description || null,
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
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={async () => {
                  const amount = parseBRLAmount(payAmount);
                  if (payingDebt && amount > 0) {
                    if (!useDemo) {
                      if (amount >= payingDebt.remaining_amount)
                        await markAsPaid(payingDebt.id);
                      else await payInstallment(payingDebt.id, amount);
                    }
                    setPayDialogOpen(false);
                    setPayingDebt(null);
                    setPayAmount("");
                  }
                }}
              >
                Pagar
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
                        {debt.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {debt.description}
                          </p>
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
                                  setEditingDebt(debt);
                                  setForm({
                                    creditor: debt.creditor,
                                    description: debt.description || "",
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
