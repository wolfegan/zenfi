import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, Trash2, Tags } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { demoCategories } from "@/lib/demo-data";

const colorOptions = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#10b981", "#14b8a6", "#3b82f6",
  "#0ea5e9", "#6b7280",
];

const iconOptions = ["ShoppingCart", "Home", "Car", "Coffee", "Wifi", "Heart", "Briefcase", "PiggyBank", "Book", "Music", "Dumbbell", "Plane"];

export default function Categories() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // All hooks declared before any early return
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    icon: "ShoppingCart",
    color: "#6366f1",
    isFixed: false,
  });

  const { data: realCategories, loading: catsLoading, create, update, remove } = useCategories();

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => {
    if (!isLoading && !catsLoading) {
      setUseDemo(!!user?.is_anonymous && realCategories.length === 0);
    }
  }, [isLoading, catsLoading, realCategories, user]);

  const categories = useDemo ? demoCategories : realCategories;

  if (isLoading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const resetForm = () => {
    setForm({ name: "", type: "expense", icon: "ShoppingCart", color: "#6366f1", isFixed: false });
    setEditingCat(null);
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    try {
      if (!useDemo) {
        if (editingCat) {
          await update(editingCat.id, { name: form.name, icon: form.icon, color: form.color, is_fixed: form.isFixed });
          toast.success("Categoria atualizada!");
        } else {
          await create({ name: form.name, type: form.type, icon: form.icon, color: form.color, is_fixed: form.isFixed });
          toast.success("Categoria criada!");
        }
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) { console.error(error); }
  };

  const expenseCats = categories?.filter((c: any) => c.type === "expense") || [];
  const incomeCats = categories?.filter((c: any) => c.type === "income") || [];

  function CategoryCard({ cat, index }: { cat: any; index: number }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.2 }}
        className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-card/80 transition-all duration-200 group card-hover"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ backgroundColor: cat.color }}
        >
          {cat.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{cat.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {cat.is_fixed && <span className="tag bg-secondary text-muted-foreground">Fixo</span>}
            <span className="text-xs text-muted-foreground">{cat.icon}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
            onClick={() => {
              setEditingCat(cat);
              setForm({ name: cat.name, type: cat.type, icon: cat.icon, color: cat.color, isFixed: cat.is_fixed });
              setDialogOpen(true);
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
            onClick={() => { setDeleteId(cat.id); setDeleteDialogOpen(true); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
    );
  }

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
            <h1 className="text-xl font-semibold tracking-tight">Categorias</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Organize seus gastos e receitas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0 h-9 rounded-lg text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">{editingCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                <DialogDescription className="text-xs">Preencha os detalhes da categoria</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Type toggle */}
                <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
                  {(["expense", "income"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${form.type === type ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {type === "expense" ? "Despesa" : "Receita"}
                    </button>
                  ))}
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Nome</label>
                  <Input placeholder="Ex: Alimentação" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 rounded-lg" />
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">Cor</label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-150 ${form.color === color ? "border-foreground scale-110 shadow-sm" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setForm({ ...form, color })}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon name */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">Ícone</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all duration-150 ${form.icon === icon ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30"}`}
                        onClick={() => setForm({ ...form, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fixed toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => setForm({ ...form, isFixed: !form.isFixed })}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${form.isFixed ? "bg-foreground" : "bg-secondary"}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${form.isFixed ? "translate-x-4" : ""}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">Gasto Fixo (ex: aluguel, assinaturas)</span>
                </label>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" className="text-xs rounded-lg" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button size="sm" className="text-xs rounded-lg" onClick={handleSubmit}>{editingCat ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-xs text-muted-foreground mb-1">Categorias de Despesa</p>
            <p className="text-2xl font-light">{expenseCats.length}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-xs text-muted-foreground mb-1">Categorias de Receita</p>
            <p className="text-2xl font-light">{incomeCats.length}</p>
          </div>
        </div>

        {/* Expense categories */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider uppercase">Despesas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <AnimatePresence>
              {expenseCats.map((cat: any, i: number) => <CategoryCard key={cat.id} cat={cat} index={i} />)}
            </AnimatePresence>
            {expenseCats.length === 0 && (
              <div className="col-span-full py-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-2">
                  <Tags className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Nenhuma categoria de despesa</p>
              </div>
            )}
          </div>
        </div>

        {/* Income categories */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider uppercase">Receitas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <AnimatePresence>
              {incomeCats.map((cat: any, i: number) => <CategoryCard key={cat.id} cat={cat} index={i} />)}
            </AnimatePresence>
            {incomeCats.length === 0 && (
              <div className="col-span-full py-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-2">
                  <Tags className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Nenhuma categoria de receita</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">Esta ação não pode ser desfeita. Todas as transações e orçamentos vinculados também serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs rounded-lg bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (deleteId) { if (!useDemo) await remove(deleteId); toast.success("Categoria excluída!"); }
                setDeleteDialogOpen(false); setDeleteId(null);
              }}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
