import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useSafeQuery } from "@/hooks/use-safe-query";
import { motion } from "framer-motion";
import { Landmark, Plus, Pencil, Trash2, PiggyBank, Wallet, Banknote, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { demoAccounts } from "@/lib/demo-data";
import { toast } from "sonner";

const accountTypes = [
  { value: "checking", label: "Conta Corrente", icon: Wallet },
  { value: "savings", label: "Poupança", icon: PiggyBank },
  { value: "cash", label: "Dinheiro Físico", icon: Banknote },
  { value: "other", label: "Outro", icon: Building2 },
];

function getAccountIcon(type: string) {
  return accountTypes.find((a) => a.value === type)?.icon || Landmark;
}

function getAccountLabel(type: string) {
  return accountTypes.find((a) => a.value === type)?.label || type;
}

export default function Accounts() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "checking", balance: "", color: "#0a0a0a" });

  const colorOptions = ["#0a0a0a", "#444444", "#666666", "#2a7", "#27a", "#a72", "#c44", "#74a"];

  const realAccounts = useSafeQuery(api.accounts.getAll);
  const createAcc = useMutation(api.accounts.create);
  const updateAcc = useMutation(api.accounts.update);
  const deleteAcc = useMutation(api.accounts.remove);

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => { if (!isLoading) setUseDemo(realAccounts === undefined); }, [isLoading, realAccounts]);
  const accounts = useDemo ? demoAccounts : (realAccounts ?? []);

  if (isLoading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const resetForm = () => setForm({ name: "", type: "checking", balance: "", color: "#0a0a0a" });
  const totalBalance = accounts.reduce((s: number, a: any) => s + a.balance, 0);

  const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-warning" /> Modo demonstração</div>}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight">Contas Bancárias</h1>
            <p className="text-xs text-muted-foreground mt-1">Acompanhe o saldo das suas contas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { resetForm(); setEditingAcc(null); } }}>
            <DialogTrigger asChild><Button size="sm" className="text-xs h-9"><Plus className="w-3.5 h-3.5 mr-1.5" />Nova Conta</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[380px]">
              <DialogHeader><DialogTitle className="text-sm font-medium">{editingAcc ? "Editar Conta" : "Nova Conta"}</DialogTitle>
                <DialogDescription className="text-xs">Adicione uma conta bancária ou dinheiro físico</DialogDescription></DialogHeader>
              <div className="space-y-4 py-2">
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Nome *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Conta Corrente" /></div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Tipo</label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{accountTypes.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Saldo *</label><Input type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0,00" /></div>
                <div><label className="text-xs text-muted-foreground mb-1.5 block">Cor</label>
                  <div className="flex gap-2 flex-wrap">{colorOptions.map((color) => (<button key={color} type="button" className={`w-7 h-7 rounded-sm border-2 transition-all ${form.color === color ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} onClick={() => setForm({ ...form, color })} />))}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setDialogOpen(false); resetForm(); setEditingAcc(null); }}>Cancelar</Button>
                <Button size="sm" className="text-xs" onClick={async () => {
                  if (form.name && form.balance) {
                    const data = { name: form.name, type: form.type as any, balance: parseFloat(form.balance), color: form.color };
                    if (!useDemo) { if (editingAcc) await updateAcc({ id: editingAcc._id, ...data }); else await createAcc(data); }
                    toast.success(editingAcc ? "Conta atualizada!" : "Conta criada!");
                    setDialogOpen(false); resetForm(); setEditingAcc(null);
                  }
                }}>{editingAcc ? "Salvar" : "Adicionar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total balance */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-sm border bg-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Saldo Total</p>
          <p className="text-3xl font-light tabular-nums">{formatCurrency(totalBalance)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{accounts.length} conta{accounts.length !== 1 ? "s" : ""}</p>
        </motion.div>

        {/* Account list */}
        {accounts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc: any, i: number) => {
              const Icon = getAccountIcon(acc.type);
              return (
                <motion.div key={acc._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-sm border bg-card hover:shadow-sm transition-shadow group overflow-hidden">
                  <div className="p-5" style={{ backgroundColor: `${acc.color}08` }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: acc.color }}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{acc.name}</p>
                          <p className="text-xs text-muted-foreground">{getAccountLabel(acc.type)}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xl font-light tabular-nums">{formatCurrency(acc.balance)}</p>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2" onClick={() => {
                        setEditingAcc(acc); setForm({ name: acc.name, type: acc.type, balance: String(acc.balance), color: acc.color }); setDialogOpen(true);
                      }}><Pencil className="w-3 h-3 mr-1" />Editar</Button>
                      <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 text-destructive" onClick={() => { setDeletingId(acc._id); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-3 h-3 mr-1" />Excluir
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3"><Landmark className="w-5 h-5 text-muted-foreground" /></div>
            <p className="text-xs text-muted-foreground mb-4">Nenhuma conta cadastrada</p>
            <Button size="sm" className="text-xs" onClick={() => setDialogOpen(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Adicionar conta</Button>
          </div>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[340px]">
            <AlertDialogHeader><AlertDialogTitle className="text-sm font-medium">Excluir conta?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">Esta ação não pode ser desfeita. A conta será removida permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
              <AlertDialogAction className="text-xs bg-destructive hover:bg-destructive/90" onClick={async () => {
                if (deletingId) { if (!useDemo) await deleteAcc({ id: deletingId }); toast.success("Conta excluída!"); }
                setDeleteDialogOpen(false); setDeletingId(null);
              }}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
