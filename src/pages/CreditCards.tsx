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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

const colorOptions = ["#0a0a0a", "#444444", "#666666", "#888888", "#aaaaaa", "#c44", "#2a7"];

export default function CreditCardsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [form, setForm] = useState({ name: "", limit: "", closingDay: "5", dueDay: "10", color: "#0a0a0a" });
  const [billForm, setBillForm] = useState({ month: "", totalAmount: "", dueDate: "", closingDate: "" });

  const cards = useQuery(api.creditCards.getAll);
  const billTransactions = useQuery(api.transactions.getByMonth, { month: billForm.month || new Date().toISOString().slice(0, 7) });
  const createCard = useMutation(api.creditCards.create);
  const updateCard = useMutation(api.creditCards.update);
  const deleteCard = useMutation(api.creditCards.remove);
  const createBill = useMutation(api.creditCards.createBill);
  const toggleBillPaid = useMutation(api.creditCards.toggleBillPaid);
  const deleteBill = useMutation(api.creditCards.deleteBill);

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const resetForm = () => {
    setForm({ name: "", limit: "", closingDay: "5", dueDay: "10", color: "#0a0a0a" });
    setEditingCard(null);
  };

  const handleSubmitCard = async () => {
    if (!form.name || !form.limit) return;
    try {
      if (editingCard) {
        await updateCard({
          id: editingCard._id,
          name: form.name,
          limit: parseFloat(form.limit),
          closingDay: parseInt(form.closingDay),
          dueDay: parseInt(form.dueDay),
          color: form.color,
        });
      } else {
        await createCard({
          name: form.name,
          limit: parseFloat(form.limit),
          closingDay: parseInt(form.closingDay),
          dueDay: parseInt(form.dueDay),
          color: form.color,
        });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Card error:", error);
    }
  };

  const handleDeleteCard = async (id: any) => {
    if (confirm("Excluir cartão e todas as transações associadas?")) {
      await deleteCard({ id });
    }
  };

  const handleCreateBill = async () => {
    if (!selectedCard || !billForm.month || !billForm.totalAmount) return;
    try {
      await createBill({
        creditCardId: selectedCard._id,
        month: billForm.month,
        totalAmount: parseFloat(billForm.totalAmount),
        dueDate: billForm.dueDate,
        closingDate: billForm.closingDate,
      });
      setBillDialogOpen(false);
      setBillForm({ month: "", totalAmount: "", dueDate: "", closingDate: "" });
    } catch (error) {
      console.error("Bill error:", error);
    }
  };

  const getCardSpending = (cardId: string) => {
    if (!billTransactions) return 0;
    return billTransactions
      .filter((t: any) => t.creditCardId === cardId)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight">Cartões de Crédito</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Acompanhe suas faturas e limites
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
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
                  Adicione os detalhes do seu cartão de crédito
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Nome do Cartão</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Nubank" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Limite Total</label>
                  <Input type="number" step="0.01" min="0" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Dia Fechamento</label>
                    <Select value={form.closingDay} onValueChange={(v) => setForm({ ...form, closingDay: v })}>
                      <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                          <SelectItem key={d} value={String(d)} className="text-xs">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Dia Vencimento</label>
                    <Select value={form.dueDay} onValueChange={(v) => setForm({ ...form, dueDay: v })}>
                      <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                          <SelectItem key={d} value={String(d)} className="text-xs">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Cor</label>
                  <div className="flex gap-2">
                    {colorOptions.map((color) => (
                      <button key={color} type="button"
                        className={`w-7 h-7 rounded-sm border-2 transition-all ${form.color === color ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setForm({ ...form, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button size="sm" className="text-xs" onClick={handleSubmitCard}>{editingCard ? "Salvar" : "Adicionar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Card List */}
        {cards && cards.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {cards.map((card: any, i: number) => {
              const spending = getCardSpending(card._id);
              const utilization = card.limit > 0 ? (spending / card.limit) * 100 : 0;
              return (
                <motion.div
                  key={card._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-sm border bg-card overflow-hidden"
                >
                  {/* Card header */}
                  <div className="p-5" style={{ backgroundColor: `${card.color}08` }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ backgroundColor: card.color }}>
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{card.name}</p>
                          <p className="text-xs text-muted-foreground">Fechamento dia {card.closingDay} · Vence dia {card.dueDay}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCard(card); setForm({ name: card.name, limit: String(card.limit), closingDay: String(card.closingDay), dueDay: String(card.dueDay), color: card.color }); setDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCard(card._id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Limit usage */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Limite utilizado</span>
                      <span className="text-xs tabular-nums">
                        {spending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / {card.limit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${utilization > 80 ? "bg-destructive" : utilization > 50 ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">{utilization.toFixed(0)}% utilizado</p>
                  </div>

                  {/* Bills */}
                  {card.bills && card.bills.length > 0 && (
                    <div className="border-t divide-y">
                      {card.bills.map((bill: any) => (
                        <div key={bill._id} className="flex items-center justify-between px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleBillPaid({ id: bill._id, isPaid: !bill.isPaid })}>
                              {bill.isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                            </button>
                            <div>
                              <span className="text-xs">{new Date(bill.month + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
                              {bill.isPaid && <span className="text-[10px] text-success ml-2">Pago</span>}
                            </div>
                          </div>
                          <span className="text-xs tabular-nums">
                            {bill.totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add bill button */}
                  <div className="border-t px-5 py-2.5">
                    <Button variant="ghost" size="sm" className="text-xs h-7 w-full justify-start"
                      onClick={() => { setSelectedCard(card); setBillDialogOpen(true); }}>
                      <Plus className="w-3 h-3 mr-1.5" />
                      Adicionar fatura
                    </Button>
                  </div>
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
            <Button size="sm" className="text-xs" onClick={() => setDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Adicionar cartão
            </Button>
          </div>
        )}

        {/* Bill Dialog */}
        <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle className="text-sm font-medium">Nova Fatura</DialogTitle>
              <DialogDescription className="text-xs">
                {selectedCard?.name && `Fatura do ${selectedCard.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Mês de Referência</label>
                <Input type="month" value={billForm.month} onChange={(e) => setBillForm({ ...billForm, month: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Valor Total</label>
                <Input type="number" step="0.01" min="0" value={billForm.totalAmount} onChange={(e) => setBillForm({ ...billForm, totalAmount: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Data Fechamento</label>
                  <Input type="date" value={billForm.closingDate} onChange={(e) => setBillForm({ ...billForm, closingDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Data Vencimento</label>
                  <Input type="date" value={billForm.dueDate} onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setBillDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" className="text-xs" onClick={handleCreateBill}>Adicionar Fatura</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
