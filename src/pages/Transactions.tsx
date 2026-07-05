import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions, useCategories, useCreditCards } from "@/hooks/use-supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Pencil, Plus, Trash2, ArrowDown, ArrowUp, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { demoTransactions, demoCategories } from "@/lib/demo-data";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function Transactions() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // All hooks must be called unconditionally before any early returns
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
    isCreditCard: false,
    creditCardId: "",
  });

  const month = currentMonth();
  const { data: realTransactions, loading: txsLoading, create, update, remove } = useTransactions();
  const { data: realCategories } = useCategories();
  const { data: realCreditCards } = useCreditCards();

  const filteredRealTransactions = useMemo(
    () => realTransactions.filter((t: any) => t.date.startsWith(month)),
    [realTransactions, month]
  );

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => {
    if (!isLoading && !txsLoading) {
      setUseDemo(realTransactions.length === 0 && realCategories.length === 0);
    }
  }, [isLoading, txsLoading, realTransactions, realCategories]);

  const allTxs = useDemo ? demoTransactions : filteredRealTransactions;
  const categories = useDemo ? demoCategories : realCategories;
  const creditCards = useDemo ? [] : realCreditCards;

  const txs = useMemo(() => {
    if (!search.trim()) return allTxs;
    const q = search.toLowerCase();
    return allTxs.filter((tx: any) => {
      const cat = categories?.find((c: any) => c.id === tx.category_id);
      return (
        tx.description?.toLowerCase().includes(q) ||
        cat?.name?.toLowerCase().includes(q)
      );
    });
  }, [allTxs, search, categories]);

  if (isLoading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const expenseCategories = categories?.filter((c: any) => c.type === "expense") || [];
  const incomeCategories = categories?.filter((c: any) => c.type === "income") || [];
  const findCategory = (id: string) => categories?.find((c: any) => c.id === id);

  const resetForm = () => {
    setForm({ categoryId: "", amount: "", date: new Date().toISOString().split("T")[0], type: "expense", description: "", isFixed: false, isCreditCard: false, creditCardId: "" });
    setEditingTx(null);
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return;
    try {
      if (!useDemo) {
        const txData: any = {
          category_id: form.categoryId,
          amount,
          date: form.date,
          type: form.type,
          description: form.description || null,
          is_fixed: form.isFixed,
          is_credit_card: form.isCreditCard,
          credit_card_id: form.isCreditCard && form.creditCardId ? form.creditCardId : null,
        };
        if (editingTx) { await update(editingTx.id, txData); toast.success("Transação atualizada!"); }
        else { await create(txData); toast.success("Transação adicionada!"); }
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Transaction error:", error);
    }
  };

  const totalIncome = allTxs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = allTxs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
            <p className="text-sm text-muted-foreground mt-0.5">Registre e gerencie suas receitas e despesas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0 h-9 rounded-lg text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">{editingTx ? "Editar Transação" : "Nova Transação"}</DialogTitle>
                <DialogDescription className="text-xs">Preencha os detalhes da transação</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "expense", categoryId: "" })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${form.type === "expense" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" /> Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "income", categoryId: "" })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${form.type === "income" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" /> Receita
                  </button>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block font-medium">Valor</label><Input type="number" step="0.01" min="0" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-9 rounded-lg" /></div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Categoria</label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger className="text-xs h-9 rounded-lg"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{(form.type === "expense" ? expenseCategories : incomeCategories).map((cat: any) => <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block font-medium">Data</label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 rounded-lg" /></div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block font-medium">Descrição (opcional)</label><Input placeholder="Ex: Supermercado" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-9 rounded-lg" /></div>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFixed} onChange={(e) => setForm({ ...form, isFixed: e.target.checked })} className="w-3.5 h-3.5 rounded border" />
                    <span className="text-xs text-muted-foreground">Gasto Fixo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isCreditCard} onChange={(e) => setForm({ ...form, isCreditCard: e.target.checked })} className="w-3.5 h-3.5 rounded border" />
                    <span className="text-xs text-muted-foreground">Cartão de Crédito</span>
                  </label>
                </div>
                {form.isCreditCard && creditCards && creditCards.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Selecionar Cartão</label>
                    <Select value={form.creditCardId} onValueChange={(v) => setForm({ ...form, creditCardId: v })}>
                      <SelectTrigger className="text-xs h-9 rounded-lg"><SelectValue placeholder="Selecione o cartão..." /></SelectTrigger>
                      <SelectContent>{creditCards.map((card: any) => <SelectItem key={card.id} value={card.id} className="text-xs">{card.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" className="text-xs rounded-lg" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button size="sm" className="text-xs rounded-lg" onClick={handleSubmit}>{editingTx ? "Salvar" : "Adicionar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Receitas do Mês</span>
              <div className="w-7 h-7 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <ArrowUp className="w-3.5 h-3.5 text-chart-2" />
              </div>
            </div>
            <p className="text-lg font-semibold text-chart-2">{formatCurrency(totalIncome)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Despesas do Mês</span>
              <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ArrowDown className="w-3.5 h-3.5 text-destructive" />
              </div>
            </div>
            <p className="text-lg font-semibold text-destructive">{formatCurrency(totalExpense)}</p>
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
            {txs && txs.length > 0 ? txs.map((tx: any, i: number) => {
              const cat = findCategory(tx.category_id);
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
                    style={{ backgroundColor: cat?.color ? `${cat.color}18` : "oklch(0.93 0.006 248)" }}
                  >
                    {tx.type === "income"
                      ? <ArrowUp className="w-4 h-4" style={{ color: "oklch(0.52 0.15 178)" }} />
                      : <ArrowDown className="w-4 h-4" style={{ color: "oklch(0.58 0.19 27.33)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{tx.description || cat?.name || "Sem categoria"}</span>
                      {tx.is_fixed && <span className="tag bg-secondary text-muted-foreground">Fixo</span>}
                      {tx.is_credit_card && <span className="tag bg-secondary text-muted-foreground">Cartão</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{cat?.name}</span>
                      <span className="text-xs text-border">·</span>
                      <span className="text-xs text-muted-foreground">{new Date(tx.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold tabular-nums ${tx.type === "income" ? "text-chart-2" : "text-foreground"}`}>
                    {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                      onClick={() => {
                        if (!useDemo) {
                          setEditingTx(tx);
                          setForm({
                            categoryId: tx.category_id, amount: tx.amount.toString(),
                            date: tx.date, type: tx.type, description: tx.description || "",
                            isFixed: tx.is_fixed, isCreditCard: tx.is_credit_card, creditCardId: tx.credit_card_id || "",
                          });
                          setDialogOpen(true);
                        }
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => { setDeleteId(tx.id); setDeleteDialogOpen(true); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            }) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">{search ? "Nenhum resultado" : "Sem transações"}</p>
                <p className="text-xs text-muted-foreground mb-4">{search ? "Tente outros termos de busca" : "Registre sua primeira transação"}</p>
                {!search && (
                  <Button size="sm" className="text-xs rounded-lg" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />Adicionar transação
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
            <AlertDialogTitle className="text-sm font-semibold">Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs rounded-lg bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (deleteId) { if (!useDemo) await remove(deleteId); toast.success("Transação excluída!"); }
                setDeleteDialogOpen(false); setDeleteId(null);
              }}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
