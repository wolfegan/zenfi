import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDesc, AlertDialogFooter as AlertFoot, AlertDialogHeader as AlertHead, AlertDialogTitle as AlertTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-supabase";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { demoCategories } from "@/lib/demo-data";

const colorOptions = ["#0a0a0a", "#444444", "#666666", "#888888", "#aaaaaa", "#c44", "#2a7", "#27a", "#a72", "#74a"];

export default function Categories() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "expense" as "income" | "expense", icon: "ShoppingCart", color: "#0a0a0a", isFixed: false });

  const { data: realCategories, loading: catsLoading, create, update, remove } = useCategories();

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => { if (!isLoading && !catsLoading) setUseDemo(realCategories.length === 0); }, [isLoading, catsLoading, realCategories]);
  const categories = useDemo ? demoCategories : realCategories;

  if (isLoading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const resetForm = () => { setForm({ name: "", type: "expense", icon: "ShoppingCart", color: "#0a0a0a", isFixed: false }); setEditingCat(null); };

  const handleSubmit = async () => {
    if (!form.name) return;
    try {
      if (!useDemo) { if (editingCat) await update(editingCat.id, { name: form.name, icon: form.icon, color: form.color, is_fixed: form.isFixed }); else await create({ name: form.name, type: form.type, icon: form.icon, color: form.color, is_fixed: form.isFixed }); }
      setDialogOpen(false); resetForm();
    } catch (error) { console.error(error); }
  };

  const [deleteId, setDeleteId] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const expenseCats = categories?.filter((c: any) => c.type === "expense") || [];
  const incomeCats = categories?.filter((c: any) => c.type === "income") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-warning" /> Modo demonstração</div>}

        <div className="flex items-center justify-between">
          <div><h1 className="text-lg font-medium tracking-tight">Categorias</h1><p className="text-xs text-muted-foreground mt-1">Organize seus gastos e receitas por categorias</p></div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm" className="text-xs h-9"><Plus className="w-3.5 h-3.5 mr-1.5" />Nova Categoria</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader><DialogTitle className="text-sm font-medium">{editingCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle><DialogDescription className="text-xs">Preencha os detalhes da categoria</DialogDescription></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex gap-2">
                  <Button type="button" variant={form.type === "expense" ? "default" : "outline"} size="sm" className="flex-1 text-xs h-9" onClick={() => setForm({ ...form, type: "expense" })}>Despesa</Button>
                  <Button type="button" variant={form.type === "income" ? "default" : "outline"} size="sm" className="flex-1 text-xs h-9" onClick={() => setForm({ ...form, type: "income" })}>Receita</Button>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Nome</label><Input placeholder="Ex: Alimentação" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Cor</label>
                  <div className="flex gap-2 flex-wrap">{colorOptions.map((color) => (<button key={color} type="button" className={`w-8 h-8 rounded-sm border-2 transition-all ${form.color === color ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} onClick={() => setForm({ ...form, color })} />))}</div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFixed} onChange={(e) => setForm({ ...form, isFixed: e.target.checked })} className="w-3.5 h-3.5 rounded-sm border" /><span className="text-xs text-muted-foreground">Gasto Fixo (ex: aluguel, assinaturas)</span></label>
              </div>
              <DialogFooter><Button variant="outline" size="sm" className="text-xs" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button><Button size="sm" className="text-xs" onClick={handleSubmit}>{editingCat ? "Salvar" : "Criar"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div><h2 className="text-xs font-medium text-muted-foreground mb-3 tracking-wider uppercase">Despesas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expenseCats.map((cat: any, i: number) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 p-4 rounded-sm border bg-card group card-hover">
                <div className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}><span className="text-xs font-medium text-muted-foreground">{cat.icon[0]}</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm truncate">{cat.name}</p>{cat.is_fixed && <p className="text-[10px] text-muted-foreground">Fixo</p>}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCat(cat); setForm({ name: cat.name, type: cat.type, icon: cat.icon, color: cat.color, isFixed: cat.is_fixed }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteId(cat.id); setDeleteDialogOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </motion.div>
            ))}
            {expenseCats.length === 0 && <p className="text-xs text-muted-foreground col-span-full text-center py-8">Nenhuma categoria de despesa.</p>}
          </div>
        </div>

        <div><h2 className="text-xs font-medium text-muted-foreground mb-3 tracking-wider uppercase">Receitas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {incomeCats.map((cat: any, i: number) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 p-4 rounded-sm border bg-card group card-hover">
                <div className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}><span className="text-xs font-medium text-muted-foreground">{cat.icon[0]}</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm truncate">{cat.name}</p></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCat(cat); setForm({ name: cat.name, type: cat.type, icon: cat.icon, color: cat.color, isFixed: cat.is_fixed }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteId(cat.id); setDeleteDialogOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </motion.div>
            ))}
            {incomeCats.length === 0 && <p className="text-xs text-muted-foreground col-span-full text-center py-8">Nenhuma categoria de receita.</p>}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[340px]">
          <AlertHead><AlertTitle className="text-sm font-medium">Excluir categoria?</AlertTitle>
            <AlertDesc className="text-xs">Esta ação não pode ser desfeita. Todas as transações e orçamentos vinculados também serão removidos.</AlertDesc>
          </AlertHead>
          <AlertFoot>
            <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="text-xs bg-destructive hover:bg-destructive/90" onClick={async () => {
              if (deleteId) { if (!useDemo) await remove(deleteId); toast.success("Categoria excluída!"); }
              setDeleteDialogOpen(false); setDeleteId(null);
            }}>Excluir</AlertDialogAction>
          </AlertFoot>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
