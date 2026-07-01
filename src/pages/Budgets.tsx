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
import { Percent, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const monthOptions = () => {
  const options: string[] = [];
  const now = new Date();
  for (let i = -2; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    options.push(value);
  }
  return options;
};

export default function Budgets() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ categoryId: "", amount: "" });

  const budgets = useQuery(api.budgets.getByMonth, { month: selectedMonth });
  const categories = useQuery(api.categories.getAll);
  const transactions = useQuery(api.transactions.getByMonth, { month: selectedMonth });
  const setBudget = useMutation(api.budgets.setBudget);
  const deleteBudget = useMutation(api.budgets.remove);

  const months = monthOptions();
  const expenseCategories = categories?.filter((c: any) => c.type === "expense") || [];

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async () => {
    if (!form.categoryId || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await setBudget({ categoryId: form.categoryId as any, month: selectedMonth, amount });
      setDialogOpen(false);
      setForm({ categoryId: "", amount: "" });
    } catch (error) {
      console.error("Budget error:", error);
    }
  };

  const handleDelete = async (id: any) => {
    await deleteBudget({ id });
  };

  const getSpent = (categoryId: string) => {
    if (!transactions) return 0;
    return transactions
      .filter((t: any) => t.categoryId === categoryId && t.type === "expense")
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight">Orçamentos</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Defina quanto pode gastar em cada categoria por mês
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px] text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {new Date(m + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs h-9">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Novo Orçamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[380px]">
                <DialogHeader>
                  <DialogTitle className="text-sm font-medium">Novo Orçamento</DialogTitle>
                  <DialogDescription className="text-xs">
                    Defina um limite de gastos para uma categoria
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>
                    <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat: any) => (
                          <SelectItem key={cat._id} value={cat._id} className="text-xs">{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Limite Mensal</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" className="text-xs" onClick={handleSubmit}>
                    Definir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Budget List */}
        {budgets && budgets.length > 0 ? (
          <div className="space-y-2">
            {budgets.map((budget: any, i: number) => {
              const cat = expenseCategories.find((c: any) => c._id === budget.categoryId);
              const spent = getSpent(budget.categoryId);
              const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
              const isOver = percentage > 100;
              const isWarning = percentage > 80 && !isOver;

              return (
                <motion.div
                  key={budget._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-sm border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: cat?.color ? `${cat.color}15` : "oklch(0.92 0 0)" }}>
                        <span className="text-xs text-muted-foreground">{cat?.icon?.[0] || "•"}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{cat?.name || "Sem categoria"}</p>
                        <p className="text-xs text-muted-foreground">
                          {spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / {budget.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium tabular-nums ${isOver ? "text-destructive" : isWarning ? "text-warning" : "text-success"}`}>
                        {percentage.toFixed(0)}%
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(budget._id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-destructive" : isWarning ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3">
              <Percent className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Nenhum orçamento definido para este mês
            </p>
            <Button size="sm" className="text-xs" onClick={() => setDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Criar primeiro orçamento
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
