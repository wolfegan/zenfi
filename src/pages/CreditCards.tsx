import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCreditCards } from "@/hooks/use-supabase";
import { motion } from "framer-motion";
import { CreditCard, Plus, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", limit: "", closingDay: "5", dueDay: "10", color: "#0a0a0a" });

  const { data: realCards, loading: cardsLoading, create } = useCreditCards();

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => {
    if (!isLoading && !cardsLoading) {
      setUseDemo(!!user?.is_anonymous && realCards.length === 0);
    }
  }, [isLoading, cardsLoading, realCards, user]);
  const cards = useDemo ? demoCreditCards : realCards;

  if (isLoading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const resetForm = () => setForm({ name: "", limit: "", closingDay: "5", dueDay: "10", color: "#0a0a0a" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-warning" /> Modo demonstração</div>}

        <div className="flex items-center justify-between">
          <div><h1 className="text-lg font-medium tracking-tight">Cartões de Crédito</h1><p className="text-xs text-muted-foreground mt-1">Acompanhe suas faturas e limites</p></div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm" className="text-xs h-9"><Plus className="w-3.5 h-3.5 mr-1.5" />Novo Cartão</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[380px]">
              <DialogHeader><DialogTitle className="text-sm font-medium">Novo Cartão</DialogTitle><DialogDescription className="text-xs">Adicione os detalhes do seu cartão de crédito</DialogDescription></DialogHeader>
              <div className="space-y-4 py-2">
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Nome</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Nubank" /></div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Limite</label><Input type="number" step="0.01" min="0" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground mb-1.5 block">Fechamento</label><Select value={form.closingDay} onValueChange={(v) => setForm({ ...form, closingDay: v })}><SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <SelectItem key={d} value={String(d)} className="text-xs">{d}</SelectItem>)}</SelectContent></Select></div>
                  <div><label className="text-xs text-muted-foreground mb-1.5 block">Vencimento</label><Select value={form.dueDay} onValueChange={(v) => setForm({ ...form, dueDay: v })}><SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <SelectItem key={d} value={String(d)} className="text-xs">{d}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Cor</label>
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
                        !colorOptions.includes(form.color) ? "border-foreground scale-110 ring-2 ring-primary/20" : ""
                      }`}
                      style={{ backgroundColor: !colorOptions.includes(form.color) ? form.color : undefined }}
                      title="Cor personalizada"
                    >
                      <span className={`text-[10px] font-bold leading-none ${!colorOptions.includes(form.color) ? "mix-blend-difference text-white" : "text-muted-foreground"}`}>🎨</span>
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" size="sm" className="text-xs" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button><Button size="sm" className="text-xs" onClick={async () => { if (form.name && form.limit) { if (!useDemo) await create({ name: form.name, limit: parseFloat(form.limit), closing_day: parseInt(form.closingDay), due_day: parseInt(form.dueDay), color: form.color }); setDialogOpen(false); resetForm(); }}}>Adicionar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {cards && cards.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {cards.map((card: any, i: number) => {
              const spending = (card as any).bills?.reduce?.((s: number, b: any) => s + (b.is_paid ? 0 : b.total_amount), 0) || 0;
              const utilization = card.limit > 0 ? (spending / card.limit) * 100 : 0;
              return (
                <motion.div key={card.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-sm border bg-card overflow-hidden">
                  <div className="p-5" style={{ backgroundColor: `${card.color}08` }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ backgroundColor: card.color }}><CreditCard className="w-4 h-4 text-white" /></div>
                        <div><p className="text-sm font-medium">{card.name}</p><p className="text-xs text-muted-foreground">Fechamento dia {card.closing_day} · Vence dia {card.due_day}</p></div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="w-3.5 h-3.5" /></Button>
                    </div>
                    <div className="flex items-center justify-between mb-1.5"><span className="text-xs text-muted-foreground">Limite utilizado</span><span className="text-xs tabular-nums">{spending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / {card.limit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${utilization > 80 ? "bg-destructive" : utilization > 50 ? "bg-warning" : "bg-success"}`} style={{ width: `${Math.min(utilization, 100)}%` }} /></div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">{utilization.toFixed(0)}% utilizado</p>
                  </div>
                  {(card as any).bills?.length > 0 && (
                    <div className="border-t divide-y">
                      {(card as any).bills.map((bill: any) => (
                        <div key={bill.id} className="flex items-center justify-between px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            {bill.is_paid ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                            <div><span className="text-xs">{new Date(bill.month + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>{bill.is_paid && <span className="text-[10px] text-success ml-2">Pago</span>}</div>
                          </div>
                          <span className="text-xs tabular-nums">{bill.total_amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
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
            <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3"><CreditCard className="w-5 h-5 text-muted-foreground" /></div>
            <p className="text-xs text-muted-foreground mb-4">Nenhum cartão cadastrado</p>
            <Button size="sm" className="text-xs" onClick={() => setDialogOpen(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Adicionar cartão</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
