import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useGoals } from "@/hooks/use-supabase";
import { motion } from "framer-motion";
import { Target, Plus, Pencil, Trash2, TrendingUp, GraduationCap, Home, Plane, Shield, Coins, PiggyBank } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { demoGoals, demoGoalsSummary } from "@/lib/demo-data";
import { toast } from "sonner";

const goalCategories = [
  { value: "emergency", label: "Reserva de Emergência", icon: Shield },
  { value: "travel", label: "Viagem", icon: Plane },
  { value: "purchase", label: "Compra", icon: Home },
  { value: "investment", label: "Investimento", icon: TrendingUp },
  { value: "education", label: "Educação", icon: GraduationCap },
  { value: "retirement", label: "Aposentadoria", icon: Coins },
  { value: "other", label: "Outro", icon: PiggyBank },
];

function getCategoryIcon(cat: string) { return goalCategories.find((c) => c.value === cat)?.icon || Target; }
function getCategoryLabel(cat: string) { return goalCategories.find((c) => c.value === cat)?.label || cat; }

export default function Goals() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contributeDialogOpen, setContributeDialogOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<any>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<any>(null);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "0", monthlyContribution: "0", targetDate: "", category: "emergency" });
  const [filter, setFilter] = useState<"all" | "active" | "achieved">("active");
  const [summary, setSummary] = useState<any>(null);

  const { data: realGoals, loading: goalsLoading, getSummary, create, update, remove, contribute, markAsAchieved } = useGoals();

  useEffect(() => {
    if (!goalsLoading && realGoals.length > 0) { getSummary().then(setSummary); }
  }, [goalsLoading, realGoals, getSummary]);

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => { if (!isLoading && !goalsLoading) setUseDemo(realGoals.length === 0); }, [isLoading, goalsLoading, realGoals]);

  const goals = useDemo ? demoGoals : realGoals;
  const summaryData = useDemo ? demoGoalsSummary : summary;

  if (isLoading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const resetForm = () => setForm({ name: "", targetAmount: "", currentAmount: "0", monthlyContribution: "0", targetDate: "", category: "emergency" });
  const filteredGoals = goals.filter((g: any) => { if (filter === "active") return !g.is_achieved; if (filter === "achieved") return g.is_achieved; return true; });
  const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-warning" /> Modo demonstração</div>}

        <div className="flex items-center justify-between">
          <div><h1 className="text-lg font-medium tracking-tight">Metas Financeiras</h1><p className="text-xs text-muted-foreground mt-1">Defina objetivos e acompanhe seu progresso</p></div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { resetForm(); setEditingGoal(null); } }}>
            <DialogTrigger asChild><Button size="sm" className="text-xs h-9"><Plus className="w-3.5 h-3.5 mr-1.5" />Nova Meta</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader><DialogTitle className="text-sm font-medium">{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle><DialogDescription className="text-xs">Defina um objetivo financeiro para alcançar</DialogDescription></DialogHeader>
              <div className="space-y-4 py-2">
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Nome da Meta *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Reserva de Emergência" /></div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger><SelectContent>{goalCategories.map((c) => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground mb-1.5 block">Valor Total *</label><Input type="number" step="0.01" min="0" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="10000" /></div>
                  <div><label className="text-xs text-muted-foreground mb-1.5 block">Já tem guardado</label><Input type="number" step="0.01" min="0" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground mb-1.5 block">Aporte Mensal</label><Input type="number" step="0.01" min="0" value={form.monthlyContribution} onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })} placeholder="500" /></div>
                  <div><label className="text-xs text-muted-foreground mb-1.5 block">Data Alvo</label><Input type="month" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" size="sm" className="text-xs" onClick={() => { setDialogOpen(false); resetForm(); setEditingGoal(null); }}>Cancelar</Button>
                <Button size="sm" className="text-xs" onClick={async () => {
                  if (form.name && form.targetAmount) {
                    const data = { name: form.name, target_amount: parseFloat(form.targetAmount), current_amount: parseFloat(form.currentAmount) || 0, monthly_contribution: parseFloat(form.monthlyContribution) || 0, target_date: form.targetDate || undefined, category: form.category as any };
                    if (!useDemo) { if (editingGoal) await update(editingGoal.id, data); else await create(data); }
                    toast.success(editingGoal ? "Meta atualizada!" : "Meta criada!"); setDialogOpen(false); resetForm(); setEditingGoal(null);
                  }
                }}>{editingGoal ? "Salvar" : "Criar Meta"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {summaryData && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-sm border bg-card"><p className="text-xs text-muted-foreground mb-1">Progresso Total</p><p className="text-lg font-light tabular-nums">{summaryData.totalProgress.toFixed(1)}%</p><div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.min(summaryData.totalProgress, 100)}%` }} /></div></div>
            <div className="p-5 rounded-sm border bg-card"><p className="text-xs text-muted-foreground mb-1">Guardado</p><p className="text-lg font-light tabular-nums">{formatCurrency(summaryData.totalCurrent)}</p></div>
            <div className="p-5 rounded-sm border bg-card"><p className="text-xs text-muted-foreground mb-1">Meta Total</p><p className="text-lg font-light tabular-nums">{formatCurrency(summaryData.totalTarget)}</p></div>
            <div className="p-5 rounded-sm border bg-card"><p className="text-xs text-muted-foreground mb-1">Atingidas</p><p className="text-lg font-light tabular-nums">{summaryData.achievedGoals}/{summaryData.count}</p></div>
          </motion.div>
        )}

        <div className="flex items-center gap-1 border-b pb-0">
          {(["active", "achieved", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-2 border-b-2 transition-colors -mb-px ${filter === f ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{f === "active" ? "Ativas" : f === "achieved" ? "Atingidas" : "Todas"}</button>
          ))}
          {summaryData && <span className="ml-auto text-[10px] text-muted-foreground">{summaryData.activeGoals} ativas · {summaryData.achievedGoals} atingidas</span>}
        </div>

        {filteredGoals.length > 0 ? (
          <div className="space-y-3">
            {filteredGoals.map((goal: any, i: number) => {
              const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              const Icon = getCategoryIcon(goal.category);
              const monthsUntilTarget = goal.target_date ? Math.max(0, (new Date(goal.target_date).getFullYear() - new Date().getFullYear()) * 12 + new Date(goal.target_date).getMonth() - new Date().getMonth()) : null;
              const projectedByTarget = monthsUntilTarget && goal.monthly_contribution > 0 ? (goal.current_amount + goal.monthly_contribution * monthsUntilTarget) >= goal.target_amount : null;
              return (
                <motion.div key={goal.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`rounded-sm border bg-card hover:shadow-sm transition-shadow group ${goal.is_achieved ? "opacity-60" : ""}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${goal.is_achieved ? "bg-success/10" : "bg-secondary"}`}>
                        <Icon className={`w-4 h-4 ${goal.is_achieved ? "text-success" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${goal.is_achieved ? "line-through text-muted-foreground" : ""}`}>{goal.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-secondary text-muted-foreground">{getCategoryLabel(goal.category)}</span>
                          {goal.is_achieved && <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-success/10 text-success font-medium">Atingida ✓</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs tabular-nums">{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
                          {goal.monthly_contribution > 0 && <span className="text-xs text-muted-foreground">+{formatCurrency(goal.monthly_contribution)}/mês</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-light tabular-nums ${progress >= 100 ? "text-success" : ""}`}>{progress.toFixed(0)}%</p>
                        {!goal.is_achieved && (
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <Button variant="secondary" size="sm" className="text-[10px] h-7 px-2"
                              onClick={() => { setContributingGoal(goal); setContributeAmount(String(goal.monthly_contribution || "")); setContributeDialogOpen(true); }}>
                              <Coins className="w-3 h-3 mr-1" />Guardar
                            </Button>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingGoal(goal); setForm({ name: goal.name, targetAmount: String(goal.target_amount), currentAmount: String(goal.current_amount), monthlyContribution: String(goal.monthly_contribution), targetDate: goal.target_date || "", category: goal.category }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeletingId(goal.id); setDeleteDialogOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? "bg-success" : progress > 50 ? "bg-primary" : "bg-muted-foreground/30"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      {monthsUntilTarget !== null && monthsUntilTarget > 0 && !goal.is_achieved && (
                        <p className={`text-[10px] mt-1 ${projectedByTarget ? "text-success" : "text-warning"}`}>
                          {projectedByTarget ? "Dentro do prazo" : `Ritmo atual: ${monthsUntilTarget} meses restantes — precisa aumentar aporte`}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3"><Target className="w-5 h-5 text-muted-foreground" /></div>
            <p className="text-xs text-muted-foreground mb-4">{filter === "active" ? "Nenhuma meta ativa!" : filter === "achieved" ? "Nenhuma meta atingida ainda" : "Nenhuma meta cadastrada"}</p>
            {filter !== "achieved" && <Button size="sm" className="text-xs" onClick={() => setDialogOpen(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Criar meta</Button>}
          </div>
        )}

        <Dialog open={contributeDialogOpen} onOpenChange={(open) => { setContributeDialogOpen(open); if (!open) { setContributingGoal(null); setContributeAmount(""); } }}>
          <DialogContent className="sm:max-w-[320px]">
            <DialogHeader><DialogTitle className="text-sm font-medium">Guardar para Meta</DialogTitle><DialogDescription className="text-xs">{contributingGoal ? `Quanto você quer guardar para "${contributingGoal.name}"?` : ""}</DialogDescription></DialogHeader>
            {contributingGoal && (
              <div className="space-y-4 py-2">
                <div className="bg-secondary/30 rounded-sm px-3 py-2 text-xs space-y-1">
                  <div className="flex items-center justify-between"><span>Progresso</span><span className="font-medium">{formatCurrency(contributingGoal.current_amount)} / {formatCurrency(contributingGoal.target_amount)}</span></div>
                  <div className="flex items-center justify-between"><span>Faltam</span><span className="text-muted-foreground">{formatCurrency(contributingGoal.target_amount - contributingGoal.current_amount)}</span></div>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Valor para guardar *</label><Input type="number" step="0.01" min="0" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} autoFocus /></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" size="sm" className="text-xs" onClick={() => { setContributeDialogOpen(false); setContributingGoal(null); setContributeAmount(""); }}>Cancelar</Button>
              <Button size="sm" className="text-xs" onClick={async () => {
                if (contributingGoal && contributeAmount && parseFloat(contributeAmount) > 0) {
                  if (!useDemo) await contribute(contributingGoal.id, parseFloat(contributeAmount));
                  toast.success(`${formatCurrency(parseFloat(contributeAmount))} guardado em "${contributingGoal.name}"!`);
                  setContributeDialogOpen(false); setContributingGoal(null); setContributeAmount("");
                }
              }}>Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[340px]">
            <AlertDialogHeader><AlertDialogTitle className="text-sm font-medium">Excluir meta?</AlertDialogTitle><AlertDialogDescription className="text-xs">Esta ação não pode ser desfeita. A meta será removida permanentemente.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
              <AlertDialogAction className="text-xs bg-destructive hover:bg-destructive/90" onClick={async () => { if (deletingId) { if (!useDemo) await remove(deletingId); toast.success("Meta excluída!"); } setDeleteDialogOpen(false); setDeletingId(null); }}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
