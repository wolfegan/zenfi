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
  ArrowDown,
  ArrowUp,
  Calendar,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function Transactions() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense" as "income" | "expense",
    description: "",
    isFixed: false,
    isCreditCard: false,
    creditCardId: "",
  });

  const transactions = useQuery(api.transactions.getByMonth, { month: currentMonth() });
  const categories = useQuery(api.categories.getAll);
  const creditCards = useQuery(api.creditCards.getAll);
  const createTx = useMutation(api.transactions.create);
  const updateTx = useMutation(api.transactions.update);
  const deleteTx = useMutation(api.transactions.remove);

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const expenseCategories = categories?.filter((c: any) => c.type === "expense") || [];
  const incomeCategories = categories?.filter((c: any) => c.type === "income") || [];

  const resetForm = () => {
    setForm({
      categoryId: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      description: "",
      isFixed: false,
      isCreditCard: false,
      creditCardId: "",
    });
    setEditingTx(null);
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      if (editingTx) {
        await updateTx({
          id: editingTx._id,
          categoryId: form.categoryId as any,
          amount,
          date: form.date,
          type: form.type,
          description: form.description || undefined,
          isFixed: form.isFixed,
          isCreditCard: form.isCreditCard,
          creditCardId: form.isCreditCard && form.creditCardId ? form.creditCardId as any : undefined,
        });
      } else {
        await createTx({
          categoryId: form.categoryId as any,
          amount,
          date: form.date,
          type: form.type,
          description: form.description || undefined,
          isFixed: form.isFixed,
          isCreditCard: form.isCreditCard,
          creditCardId: form.isCreditCard && form.creditCardId ? form.creditCardId as any : undefined,
        });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Transaction error:", error);
    }
  };

  const handleEdit = (tx: any) => {
    setEditingTx(tx);
    setForm({
      categoryId: tx.categoryId,
      amount: String(tx.amount),
      date: tx.date,
      type: tx.type,
      description: tx.description || "",
      isFixed: tx.isFixed,
      isCreditCard: tx.isCreditCard,
      creditCardId: tx.creditCardId || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: any) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      await deleteTx({ id });
    }
  };

  const findCategory = (id: string) => categories?.find((c: any) => c._id === id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight">Transações</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Registre e gerencie suas receitas e despesas
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-9">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-medium">
                  {editingTx ? "Editar Transação" : "Nova Transação"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Preencha os detalhes da transação
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Type toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={form.type === "expense" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs h-9"
                    onClick={() => setForm({ ...form, type: "expense", categoryId: "" })}
                  >
                    <ArrowDown className="w-3.5 h-3.5 mr-1.5" />
                    Despesa
                  </Button>
                  <Button
                    type="button"
                    variant={form.type === "income" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs h-9"
                    onClick={() => setForm({ ...form, type: "income", categoryId: "" })}
                  >
                    <ArrowUp className="w-3.5 h-3.5 mr-1.5" />
                    Receita
                  </Button>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Valor</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => setForm({ ...form, categoryId: v })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(form.type === "expense" ? expenseCategories : incomeCategories).map((cat: any) => (
                        <SelectItem key={cat._id} value={cat._id} className="text-xs">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Data</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Descrição (opcional)</label>
                  <Input
                    placeholder="Ex: Supermercado"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFixed}
                      onChange={(e) => setForm({ ...form, isFixed: e.target.checked })}
                      className="w-3.5 h-3.5 rounded-sm border"
                    />
                    <span className="text-xs text-muted-foreground">Gasto Fixo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isCreditCard}
                      onChange={(e) => setForm({ ...form, isCreditCard: e.target.checked })}
                      className="w-3.5 h-3.5 rounded-sm border"
                    />
                    <span className="text-xs text-muted-foreground">Cartão de Crédito</span>
                  </label>
                </div>

                {/* Credit card selector */}
                {form.isCreditCard && creditCards && creditCards.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Selecionar Cartão</label>
                    <Select
                      value={form.creditCardId}
                      onValueChange={(v) => setForm({ ...form, creditCardId: v })}
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Selecione o cartão..." />
                      </SelectTrigger>
                      <SelectContent>
                        {creditCards.map((card: any) => (
                          <SelectItem key={card._id} value={card._id} className="text-xs">
                            {card.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button size="sm" className="text-xs" onClick={handleSubmit}>
                  {editingTx ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          {transactions && transactions.length > 0 ? (
            transactions.map((tx: any, i: number) => {
              const cat = findCategory(tx.categoryId);
              return (
                <motion.div
                  key={tx._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-sm border bg-card hover:shadow-sm transition-shadow group"
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cat?.color ? `${cat.color}15` : "oklch(0.92 0 0)" }}
                  >
                    {tx.type === "income" ? (
                      <ArrowUp className="w-4 h-4" style={{ color: cat?.color || "oklch(0.45 0.13 145)" }} />
                    ) : (
                      <ArrowDown className="w-4 h-4" style={{ color: cat?.color || "oklch(0.58 0.19 27.33)" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{tx.description || cat?.name || "Sem categoria"}</span>
                      {tx.isFixed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-secondary text-muted-foreground">Fixo</span>
                      )}
                      {tx.isCreditCard && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-secondary text-muted-foreground">Cartão</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{cat?.name}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{new Date(tx.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className={`text-sm font-medium tabular-nums ${
                    tx.type === "income" ? "text-success" : ""
                  }`}>
                    {tx.type === "income" ? "+" : "-"}
                    {tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tx)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tx._id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Nenhuma transação este mês
              </p>
              <Button size="sm" className="text-xs" onClick={() => setDialogOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Adicionar primeira transação
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
