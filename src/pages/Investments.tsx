import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useSafeQuery } from "@/hooks/use-safe-query";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { demoInvestments, demoInvestmentsSummary } from "@/lib/demo-data";

const investmentTypes = [
  { value: "stocks", label: "Ações" }, { value: "crypto", label: "Criptomoedas" }, { value: "real_estate", label: "Imóveis" }, { value: "fixed_income", label: "Renda Fixa" }, { value: "other", label: "Outros" },
];

export default function Investments() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "stocks", amount: "", currentValue: "", monthlyContribution: "0" });

  const realInvestments = useSafeQuery(api.investments.getAll);
  const realSummary = useSafeQuery(api.investments.getSummary);
  const createInv = useMutation(api.investments.create);
  const updateInv = useMutation(api.investments.update);
  const deleteInv = useMutation(api.investments.remove);

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => { if (!isLoading) setUseDemo(realInvestments === undefined); }, [isLoading, realInvestments]);

  const investments = useDemo ? demoInvestments : (realInvestments ?? []);
  const summary = useDemo ? demoInvestmentsSummary : (realSummary ?? null);

  if (isLoading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const resetForm = () => setForm({ name: "", type: "stocks", amount: "", currentValue: "", monthlyContribution: "0" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-warning" /> Modo demonstração</div>}

        <div className="flex items-center justify-between">
          <div><h1 className="text-lg font-medium tracking-tight">Investimentos</h1><p className="text-xs text-muted-foreground mt-1">Acompanhe seus investimentos em um só lugar</p></div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm" className="text-xs h-9"><Plus className="w-3.5 h-3.5 mr-1.5" />Novo Investimento</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[380px]">
              <DialogHeader><DialogTitle className="text-sm font-medium">{editingInv ? "Editar Investimento" : "Novo Investimento"}</DialogTitle><DialogDescription className="text-xs">Registre seus investimentos</DialogDescription></DialogHeader>
              <div className="space-y-4 py-2">
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Nome</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Tesouro Direto" /></div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Tipo</label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger><SelectContent>{investmentTypes.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground mb-1.5 block">Total Investido</label><Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><label className="text-xs text-muted-foreground mb-1.5 block">Valor Atual</label><Input type="number" step="0.01" min="0" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} /></div>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Aporte Mensal</label><Input type="number" step="0.01" min="0" value={form.monthlyContribution} onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })} /></div>
              </div>
              <DialogFooter><Button variant="outline" size="sm" className="text-xs" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button><Button size="sm" className="text-xs" onClick={async () => {
                if (form.name && form.amount && form.currentValue) {
                  if (!useDemo) { if (editingInv) await updateInv({ id: editingInv._id, name: form.name, type: form.type as any, amount: parseFloat(form.amount), currentValue: parseFloat(form.currentValue), monthlyContribution: parseFloat(form.monthlyContribution) }); else await createInv({ name: form.name, type: form.type as any, amount: parseFloat(form.amount), currentValue: parseFloat(form.currentValue), monthlyContribution: parseFloat(form.monthlyContribution) }); }
                  setDialogOpen(false); resetForm();
                }
              }}>{editingInv ? "Salvar" : "Adicionar"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {summary && investments && investments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-sm border bg-card"><p className="text-xs text-muted-foreground mb-1">Total Investido</p><p className="text-lg font-light tabular-nums">{summary.totalInvested.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
            <div className="p-5 rounded-sm border bg-card"><p className="text-xs text-muted-foreground mb-1">Valor Atual</p><p className="text-lg font-light tabular-nums">{summary.totalCurrentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
            <div className="p-5 rounded-sm border bg-card"><p className="text-xs text-muted-foreground mb-1">Rentabilidade</p>
              <div className="flex items-center gap-1.5">{summary.returnPercentage >= 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}<span className={`text-lg font-light tabular-nums ${summary.returnPercentage >= 0 ? "text-success" : "text-destructive"}`}>{summary.returnPercentage >= 0 ? "+" : ""}{summary.returnPercentage.toFixed(1)}%</span></div>
            </div>
          </motion.div>
        )}

        {investments && investments.length > 0 ? (
          <div className="space-y-2">
            {investments.map((inv: any, i: number) => {
              const returnPct = inv.amount > 0 ? ((inv.currentValue - inv.amount) / inv.amount) * 100 : 0;
              const typeLabel = investmentTypes.find((t) => t.value === inv.type)?.label || inv.type;
              return (
                <motion.div key={inv._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 p-4 rounded-sm border bg-card hover:shadow-sm transition-shadow group">
                  <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center shrink-0"><PiggyBank className="w-4 h-4 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium truncate">{inv.name}</span><span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-secondary text-muted-foreground">{typeLabel}</span></div>
                    <div className="flex items-center gap-2 mt-0.5"><span className="text-xs text-muted-foreground">Investido: {inv.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>{inv.monthlyContribution > 0 && <><span className="text-xs text-muted-foreground">·</span><span className="text-xs text-muted-foreground">+{inv.monthlyContribution.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês</span></>}</div>
                  </div>
                  <div className="text-right"><p className="text-sm tabular-nums">{inv.currentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><p className={`text-xs tabular-nums ${returnPct >= 0 ? "text-success" : "text-destructive"}`}>{returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%</p></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingInv(inv); setForm({ name: inv.name, type: inv.type, amount: String(inv.amount), currentValue: String(inv.currentValue), monthlyContribution: String(inv.monthlyContribution) }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (!useDemo) deleteInv({ id: inv._id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3"><TrendingUp className="w-5 h-5 text-muted-foreground" /></div>
            <p className="text-xs text-muted-foreground mb-4">Nenhum investimento cadastrado</p>
            <Button size="sm" className="text-xs" onClick={() => setDialogOpen(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Adicionar investimento</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
