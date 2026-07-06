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
import { useCreditCards } from "@/hooks/use-supabase";
import { parseBRLAmount } from "@/lib/utils";
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

const colorOptions = [
  "#0a0a0a",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#10b981",
  "#3b82f6",
  "#0ea5e9",
];

export default function CreditCardsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [billForm, setBillForm] = useState({
    cardId: "",
    month: new Date().toISOString().split("T")[0].substring(0, 7),
    initialAmount: "0",
  });
  const [form, setForm] = useState({
    name: "",
    limit: "",
    closingDay: "5",
    dueDay: "10",
    color: "#0a0a0a",
  });

  const {
    data: realCards,
    loading: cardsLoading,
    create,
    update,
    remove,
    toggleBillPaid,
    createBill,
  } = useCreditCards();

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => {
    if (!isLoading && !cardsLoading) {
      setUseDemo(!!user?.is_anonymous && realCards.length === 0);
    }
  }, [isLoading, cardsLoading, realCards, user]);
  const cards = useDemo ? demoCreditCards : realCards;

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
                    Limite
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.limit}
                    onChange={(e) =>
                      setForm({ ...form, limit: e.target.value })
                    }
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
                    Cor
                  </label>
                  <div className="flex gap-2 flex-wrap items-center">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === color ? "border-foreground scale-110" : "border-transparent"}`}
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
                      title="Cor personalizada"
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
                          limit: parseFloat(form.limit),
                          closing_day: parseInt(form.closingDay),
                          due_day: parseInt(form.dueDay),
                          color: form.color,
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
              const spending =
                (card as any).bills?.reduce?.(
                  (s: number, b: any) => s + (b.is_paid ? 0 : b.total_amount),
                  0,
                ) || 0;
              const utilization =
                card.limit > 0 ? (spending / card.limit) * 100 : 0;
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
                          className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                          title="Adicionar Fatura Antecipada"
                          onClick={() => {
                            setBillForm({
                              cardId: card.id,
                              month: new Date()
                                .toISOString()
                                .split("T")[0]
                                .substring(0, 7),
                              initialAmount: "0",
                            });
                            setBillDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingCard(card);
                            setForm({
                              name: card.name,
                              limit: card.limit.toString(),
                              closingDay: card.closing_day.toString(),
                              dueDay: card.due_day.toString(),
                              color: card.color,
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
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {utilization.toFixed(0)}% utilizado
                    </p>
                  </div>
                  {(card as any).bills?.length > 0 && (
                    <div className="border-t divide-y">
                      {(card as any).bills.map((bill: any) => (
                        <div
                          key={bill.id}
                          className="flex items-center justify-between px-5 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                if (!useDemo) {
                                  await toggleBillPaid(bill.id, !bill.is_paid);
                                  toast.success(
                                    bill.is_paid
                                      ? "Fatura reaberta!"
                                      : "Fatura marcada como paga!",
                                  );
                                } else {
                                  toast.info(
                                    "Modo demonstração não altera dados.",
                                  );
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
                              <span className="text-xs">
                                {new Date(
                                  bill.month + "-01",
                                ).toLocaleDateString("pt-BR", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                              {bill.is_paid && (
                                <span className="text-[10px] text-success ml-2">
                                  Pago
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs tabular-nums">
                            {bill.total_amount.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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

      <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Nova Fatura Antecipada
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre faturas futuras para lançar e prever gastos nos próximos
              meses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Mês da Fatura *
              </label>
              <Input
                type="month"
                value={billForm.month}
                onChange={(e) =>
                  setBillForm({ ...billForm, month: e.target.value })
                }
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Valor Inicial / Estimado (R$)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={billForm.initialAmount}
                onChange={(e) =>
                  setBillForm({ ...billForm, initialAmount: e.target.value })
                }
                placeholder="Ex: 0,00"
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-lg"
              onClick={() => {
                setBillDialogOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="text-xs rounded-lg"
              onClick={async () => {
                if (!billForm.month) return;
                const amount = parseBRLAmount(billForm.initialAmount);
                if (!useDemo) {
                  const card = cards.find((c) => c.id === billForm.cardId);
                  if (!card) return;

                  const closingDay = card.closing_day || 5;
                  const dueDay = card.due_day || 10;

                  const [targetYear, targetMonth] = billForm.month
                    .split("-")
                    .map(Number);
                  const dueDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;

                  let closingMonth = targetMonth - 1;
                  let closingYear = targetYear;
                  if (closingMonth < 1) {
                    closingMonth = 12;
                    closingYear -= 1;
                  }
                  const closingDate = `${closingYear}-${String(closingMonth).padStart(2, "0")}-${String(closingDay).padStart(2, "0")}`;

                  await createBill({
                    credit_card_id: billForm.cardId,
                    month: billForm.month,
                    total_amount: amount,
                    is_paid: false,
                    due_date: dueDate,
                    closing_date: closingDate,
                  });
                  toast.success("Fatura criada com sucesso!");
                } else {
                  toast.info("Modo demonstração não altera dados.");
                }
                setBillDialogOpen(false);
              }}
            >
              Criar Fatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
