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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreditCards,
  useAccounts,
  computeCardStats,
} from "@/hooks/use-supabase";
import { parseBRLAmount, formatCurrencyInput } from "@/lib/utils";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import { PayBillModal } from "@/components/PayBillModal";
import { motion } from "framer-motion";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { demoCreditCards } from "@/lib/demo-data";

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

function dueLabel(dueDate: string): string {
  const n = daysUntil(dueDate);
  if (n < -1) return `venceu há ${-n} dias`;
  if (n === -1) return "venceu ontem";
  if (n === 0) return "vence hoje";
  if (n === 1) return "vence amanhã";
  return `vence em ${n} dias`;
}

const colorOptions = [
  "#0a0a0a", // Preto C6 / Dark
  "#820ad1", // Roxo Nubank
  "#ff7a00", // Laranja Inter / Itaú
  "#cc092f", // Vermelho Santander / Bradesco
  "#005ca9", // Azul Caixa
  "#00d68f", // Verde XP
  "#6366f1", // Indigo
  "#8b5cf6", // Violeta
  "#ec4899", // Rosa Hot
  "#ef4444", // Vermelho Vivo
  "#f97316", // Laranja Coral
  "#eab308", // Dourado
  "#22c55e", // Verde Esmeralda
  "#10b981", // Menta
  "#06b6d4", // Ciano
  "#3b82f6", // Azul Royal
  "#1e40af", // Azul Marinho
  "#475569", // Grafite Slate
  "#d97706", // Ámbar / Bronze
  "#be185d", // Vinho / Magenta
  "#4c1d95", // Roxo Escuro
  "#065f46", // Verde Floresta
];

export default function CreditCardsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payBillOpen, setPayBillOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<any>(null);
  const [billTab, setBillTab] = useState<"open" | "closed">("open");
  const [form, setForm] = useState({
    name: "",
    limit: "",
    closingDay: "5",
    dueDay: "10",
    color: "#0a0a0a",
    interestRate: "",
  });

  const {
    data: realCards,
    loading: cardsLoading,
    create,
    update,
    remove,
    toggleBillPaid,
    payBill,
    deleteBill,
    refetch: refetchCards,
  } = useCreditCards();

  const { refetch: refetchAccounts } = useAccounts();

  const useDemo = !!user?.is_anonymous;
  const cards = useDemo
    ? demoCreditCards.map((c: any) => ({
        ...c,
        ...computeCardStats(c, c.bills ?? []),
      }))
    : realCards;

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const resetForm = () => {
    setForm({
      name: "",
      limit: "",
      closingDay: "5",
      dueDay: "10",
      color: "#0a0a0a",
      interestRate: "",
    });
    setEditingCard(null);
  };

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
              Cartões de Crédito
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Acompanhe suas faturas e limites
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
                Novo Cartão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[380px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-medium">
                  {editingCard ? "Editar Cartão" : "Novo Cartão"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {editingCard
                    ? "Edite as configurações do seu cartão de crédito"
                    : "Adicione os detalhes do seu cartão de crédito"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Nome
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Nubank"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Limite *
                  </label>
                  <BRLCurrencyInput
                    value={form.limit}
                    onChangeValue={(val) => setForm({ ...form, limit: val })}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Fechamento
                    </label>
                    <Select
                      value={form.closingDay}
                      onValueChange={(v) => setForm({ ...form, closingDay: v })}
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(
                          (d) => (
                            <SelectItem
                              key={d}
                              value={String(d)}
                              className="text-xs"
                            >
                              {d}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Vencimento
                    </label>
                    <Select
                      value={form.dueDay}
                      onValueChange={(v) => setForm({ ...form, dueDay: v })}
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(
                          (d) => (
                            <SelectItem
                              key={d}
                              value={String(d)}
                              className="text-xs"
                            >
                              {d}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Juros do rotativo (% ao mês){" "}
                    <span className="text-muted-foreground/60">— opcional</span>
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.interestRate}
                    onChange={(e) =>
                      setForm({ ...form, interestRate: e.target.value })
                    }
                    placeholder="Ex: 12,5"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-muted-foreground block">
                      Cor do Cartão
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border shadow-xs"
                        style={{ backgroundColor: form.color }}
                      />
                      <span className="text-[11px] font-mono text-muted-foreground uppercase">
                        {form.color}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === color ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-90 hover:opacity-100"}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setForm({ ...form, color })}
                      />
                    ))}
                    <label
                      className={`w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/60 flex items-center justify-center cursor-pointer hover:border-foreground transition-all relative overflow-hidden ${
                        !colorOptions.includes(form.color)
                          ? "border-foreground scale-110 ring-2 ring-primary/20"
                          : ""
                      }`}
                      style={{
                        backgroundColor: !colorOptions.includes(form.color)
                          ? form.color
                          : undefined,
                      }}
                      title="Seletor de Cor Personalizado"
                    >
                      <span
                        className={`text-[10px] font-bold leading-none ${!colorOptions.includes(form.color) ? "mix-blend-difference text-white" : "text-muted-foreground"}`}
                      >
                        🎨
                      </span>
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) =>
                          setForm({ ...form, color: e.target.value })
                        }
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
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
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    if (form.name && form.limit) {
                      if (!useDemo) {
                        const data = {
                          name: form.name,
                          limit: parseBRLAmount(form.limit),
                          closing_day: parseInt(form.closingDay),
                          due_day: parseInt(form.dueDay),
                          color: form.color,
                          interest_rate:
                            parseFloat(
                              form.interestRate.replace(",", "."),
                            ) || 0,
                        };
                        if (editingCard) {
                          await update(editingCard.id, data);
                          toast.success("Cartão atualizado!");
                        } else {
                          await create(data);
                          toast.success("Cartão adicionado!");
                        }
                      }
                      setDialogOpen(false);
                      resetForm();
                    }
                  }}
                >
                  {editingCard ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {cards && cards.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {cards.map((card: any, i: number) => {
              const used = card.used ?? 0;
              const available = card.available ?? Math.max(0, card.limit - used);
              const utilization = card.utilization ?? 0;
              const spending = used;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-sm border bg-card overflow-hidden"
                >
                  <div
                    className="p-5"
                    style={{ backgroundColor: `${card.color}08` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-sm flex items-center justify-center"
                          style={{ backgroundColor: card.color }}
                        >
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{card.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Fechamento dia {card.closing_day} · Vence dia{" "}
                            {card.due_day}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingCard(card);
                            setForm({
                              name: card.name,
                              limit: formatCurrencyInput(card.limit),
                              closingDay: card.closing_day.toString(),
                              dueDay: card.due_day.toString(),
                              color: card.color,
                              interestRate: String(card.interest_rate ?? ""),
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setDeleteCardId(card.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        Limite utilizado
                      </span>
                      <span className="text-xs tabular-nums">
                        {spending.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}{" "}
                        /{" "}
                        {card.limit.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${utilization > 80 ? "bg-destructive" : utilization > 50 ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] text-muted-foreground">
                        {utilization.toFixed(0)}% utilizado
                      </p>
                      <p className="text-[10px] font-medium text-success">
                        Disponível:{" "}
                        {available.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>
                  </div>
                  {(card as any).bills?.length > 0 &&
                    (() => {
                      const todayStr = new Date()
                        .toISOString()
                        .split("T")[0];
                      const allBills = (card as any).bills as any[];
                      const openBills = allBills.filter(
                        (b) => (b.closing_date ?? "9999") >= todayStr,
                      );
                      const closedBills = allBills.filter(
                        (b) => (b.closing_date ?? "9999") < todayStr,
                      );
                      const shown =
                        billTab === "closed" ? closedBills : openBills;
                      return (
                        <div className="border-t">
                          <div className="flex items-center gap-1 px-5 pt-2.5 -mb-px">
                            {(
                              [
                                ["open", `Abertas (${openBills.length})`],
                                ["closed", `Fechadas (${closedBills.length})`],
                              ] as const
                            ).map(([val, label]) => (
                              <button
                                key={val}
                                onClick={() => setBillTab(val)}
                                className={`text-[11px] px-2.5 py-1.5 border-b-2 transition-colors ${
                                  billTab === val
                                    ? "border-foreground text-foreground font-medium"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          {shown.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground px-5 py-3">
                              Nenhuma fatura {billTab === "closed" ? "fechada" : "aberta"}.
                            </p>
                          ) : (
                          <div className="divide-y border-t">
                      {shown.map((bill: any) => {
                        const monthLabel = new Date(
                          bill.month + "-01T12:00:00",
                        ).toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        });
                        const paidAmount = Number(bill.paid_amount ?? 0);
                        const billTotal =
                          Number(bill.total_amount) +
                          Number(bill.rollover_amount ?? 0);
                        const outstanding = Math.max(0, billTotal - paidAmount);
                        const isPartial =
                          !bill.is_paid && paidAmount > 0.005;
                        const isRolled = !!bill.rolled_forward;

                        return (
                          <div
                            key={bill.id}
                            className={`flex items-center justify-between px-5 py-2.5 group/bill ${isRolled ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                disabled={isRolled}
                                onClick={async () => {
                                  if (isRolled) return;
                                  if (bill.is_paid) {
                                    if (!useDemo) {
                                      await toggleBillPaid(bill.id, false);
                                      await refetchCards();
                                      toast.success("Fatura reaberta!");
                                    } else {
                                      toast.info("Modo demonstração não altera dados.");
                                    }
                                  } else {
                                    setPayingBill(bill);
                                    setPayBillOpen(true);
                                  }
                                }}
                                className="mt-0.5 shrink-0 hover:scale-105 transition-transform"
                                title={
                                  bill.is_paid
                                    ? "Marcar como pendente"
                                    : "Marcar como paga"
                                }
                              >
                                {bill.is_paid ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                )}
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    {monthLabel}
                                  </span>
                                  {!bill.is_paid && !isRolled && (
                                    <span
                                      className={`text-[10px] font-medium ${
                                        daysUntil(bill.due_date) < 0
                                          ? "text-destructive"
                                          : daysUntil(bill.due_date) <= 3
                                            ? "text-warning"
                                            : "text-muted-foreground"
                                      }`}
                                    >
                                      {dueLabel(bill.due_date)}
                                    </span>
                                  )}
                                </div>
                                {bill.is_paid && (
                                  <span className="text-[10px] text-success ml-0 font-medium">
                                    Pago
                                  </span>
                                )}
                                {isPartial && !isRolled && (
                                  <span className="text-[10px] text-warning ml-2 font-medium">
                                    Parcial ·{" "}
                                    {paidAmount.toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })}{" "}
                                    pagos
                                  </span>
                                )}
                                {isRolled && (
                                  <span className="text-[10px] text-destructive ml-2 font-medium">
                                    saldo no rotativo do mês seguinte
                                  </span>
                                )}
                                {!isRolled && bill.rollover_amount > 0 && (
                                  <span className="text-[10px] text-destructive ml-2">
                                    inclui rotativo{" "}
                                    {Number(bill.rollover_amount).toLocaleString(
                                      "pt-BR",
                                      { style: "currency", currency: "BRL" },
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs font-medium tabular-nums ${bill.is_paid || isRolled ? "text-muted-foreground line-through" : ""}`}
                              >
                                {(bill.is_paid || isRolled
                                  ? billTotal
                                  : outstanding
                                ).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover/bill:opacity-100 transition-opacity"
                                title="Excluir Fatura"
                                onClick={async () => {
                                  if (confirm(`Tem certeza que deseja excluir a fatura de ${monthLabel}?`)) {
                                    if (!useDemo) {
                                      await deleteBill(bill.id);
                                      await refetchCards();
                                      toast.success("Fatura excluída com sucesso!");
                                    } else {
                                      toast.info("Modo demonstração não altera dados.");
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                          </div>
                          )}
                        </div>
                      );
                    })()}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Nenhum cartão cadastrado
            </p>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Adicionar cartão
            </Button>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Excluir cartão de crédito?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Todas as faturas e transações vinculadas a este cartão serão
              removidas. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-lg"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteCardId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="text-xs rounded-lg bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (deleteCardId) {
                  if (!useDemo) await remove(deleteCardId);
                  toast.success("Cartão excluído com sucesso!");
                }
                setDeleteDialogOpen(false);
                setDeleteCardId(null);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PayBillModal
        open={payBillOpen}
        onOpenChange={(o) => {
          setPayBillOpen(o);
          if (!o) setPayingBill(null);
        }}
        bill={payingBill}
        cardName={
          cards.find((c: any) => c.id === payingBill?.credit_card_id)?.name
        }
        onPaid={() => {
          refetchCards();
          refetchAccounts();
        }}
      />
    </DashboardLayout>
  );
}
