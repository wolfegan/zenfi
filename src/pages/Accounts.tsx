import { DashboardLayout, openTransfer } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useAccounts } from "@/hooks/use-supabase";
import { parseBRLAmount, formatCurrencyInput } from "@/lib/utils";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import { BankLogo, POPULAR_BANKS } from "@/components/BankLogo";
import { motion } from "framer-motion";
import { OFXImportModal } from "@/components/OFXImportModal";
import {
  Landmark,
  Plus,
  Pencil,
  Trash2,
  PiggyBank,
  Wallet,
  Banknote,
  Building2,
  FileText,
  ArrowLeftRight,
} from "lucide-react";
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
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    type: "checking",
    balance: "",
    color: "#0a0a0a",
  });
  const colorOptions = [
    "#0a0a0a", // Preto C6 / Dark
    "#820ad1", // Roxo Nubank
    "#ff5700", // Laranja Inter
    "#ec0000", // Vermelho Santander
    "#cc092f", // Vermelho Bradesco
    "#ec7000", // Laranja Itaú
    "#003399", // Azul Caixa
    "#005aa5", // Azul Banco do Brasil
    "#003641", // Verde Sicoob
    "#00aa5b", // Verde Sicredi
    "#121212", // BTG Pactual
    "#0ea5e9", // Azul Safra
    "#eab308", // Dourado Wealth
    "#6366f1", // Indigo
    "#a855f7", // Purple
    "#ec4899", // Pink
    "#ef4444", // Red
    "#f97316", // Orange
    "#10b981", // Emerald
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#64748b", // Slate
  ];

  const [ofxOpen, setOfxOpen] = useState(false);

  const {
    data: realAccounts,
    loading: accsLoading,
    create,
    update,
    remove,
    refetch: refetchAccounts,
  } = useAccounts();

  const useDemo = !!user?.is_anonymous;
  const accounts = useDemo ? demoAccounts : realAccounts;

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const resetForm = () =>
    setForm({ name: "", type: "checking", balance: "", color: "#0a0a0a" });
  const totalBalance = accounts.reduce((s: number, a: any) => s + a.balance, 0);
  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-warning" /> Modo
            demonstração
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-medium tracking-tight">
              Contas Bancárias
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Acompanhe o saldo consolidado de suas contas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={openTransfer}
              className="text-xs h-9 font-semibold border-cyan-500/30 bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 hover:bg-cyan-500/20"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5 text-cyan-500" />
              Transferir entre Contas
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setOfxOpen(true)}
              className="text-xs h-9 font-semibold border-border/80"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Importar Extrato (OFX/CSV)
            </Button>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  resetForm();
                  setEditingAcc(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs h-9">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Nova Conta
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[380px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-medium">
                  {editingAcc ? "Editar Conta" : "Nova Conta"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Adicione uma conta bancária ou dinheiro físico
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center justify-between">
                    <span>Bancos Populares (Clique para Selecionar)</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 bg-secondary/20 rounded-xl border border-border/50">
                    {POPULAR_BANKS.map((b) => {
                      const isSelected =
                        form.name.toLowerCase().trim() === b.name.toLowerCase().trim();
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              name: b.name,
                              color: b.color,
                            })
                          }
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-105"
                              : "border-border/60 bg-background hover:border-primary/40 hover:bg-secondary/40"
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center mb-1 shrink-0 shadow-xs"
                            style={{ backgroundColor: b.color }}
                          >
                            <BankLogo bankKeyOrName={b.id} className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] font-medium truncate w-full leading-tight">
                            {b.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                    Nome da Conta / Banco *
                  </label>
                  <div className="relative">
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Nubank, Itaú, Bradesco..."
                      className="pr-9"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center pointer-events-none" style={{ backgroundColor: form.color }}>
                      <BankLogo bankKeyOrName={form.name} type={form.type} className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Tipo
                  </label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((t) => (
                        <SelectItem
                          key={t.value}
                          value={t.value}
                          className="text-xs"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                    Saldo *
                  </label>
                  <BRLCurrencyInput
                    value={form.balance}
                    onChangeValue={(val) => setForm({ ...form, balance: val })}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 flex items-center justify-between font-medium">
                    <span>Cor da Conta</span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded border border-border"
                      style={{ color: form.color }}
                    >
                      {form.color}
                    </span>
                  </label>
                  <div className="flex gap-2 flex-wrap items-center">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-7 h-7 rounded-lg border-2 transition-all ${
                          form.color === color
                            ? "border-foreground scale-110 shadow-sm"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setForm({ ...form, color })}
                      />
                    ))}
                    <label
                      title="Seletor de cor personalizada"
                      className="w-7 h-7 rounded-lg border-2 border-dashed border-muted-foreground/50 hover:border-foreground flex items-center justify-center cursor-pointer transition-all bg-secondary/30 relative overflow-hidden shrink-0"
                    >
                      <span className="text-xs font-bold select-none">🎨</span>
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
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                    setEditingAcc(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    const balanceVal = parseBRLAmount(form.balance);
                    if (form.name && form.balance) {
                      const data = {
                        name: form.name,
                        type: form.type as any,
                        balance: balanceVal,
                        color: form.color,
                      };
                      if (!useDemo) {
                        if (editingAcc) await update(editingAcc.id, data);
                        else await create(data);
                      }
                      toast.success(
                        editingAcc ? "Conta atualizada!" : "Conta criada!",
                      );
                      setDialogOpen(false);
                      resetForm();
                      setEditingAcc(null);
                    }
                  }}
                >
                  {editingAcc ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-sm border bg-card text-center"
        >
          <p className="text-xs text-muted-foreground mb-1">Saldo Total</p>
          <p className="text-3xl font-light tabular-nums">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {accounts.length} conta{accounts.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {accounts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc: any, i: number) => {
              const Icon = getAccountIcon(acc.type);
              return (
                <motion.div
                  key={acc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-sm border bg-card hover:shadow-sm transition-shadow group overflow-hidden"
                >
                  <div
                    className="p-5"
                    style={{ backgroundColor: `${acc.color}08` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: acc.color }}
                        >
                          <BankLogo bankKeyOrName={acc.name} type={acc.type} className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{acc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getAccountLabel(acc.type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingAcc(acc);
                            setForm({
                              name: acc.name,
                              type: acc.type,
                              balance: formatCurrencyInput(acc.balance),
                              color: acc.color,
                            });
                            setDialogOpen(true);
                          }}
                          title="Editar Conta"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setDeletingId(acc.id);
                            setDeleteDialogOpen(true);
                          }}
                          title="Excluir Conta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xl font-medium tracking-tight tabular-nums">
                      {formatCurrency(acc.balance)}
                    </p>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2.5 rounded-lg flex-1 justify-center border-border/60"
                        onClick={() => {
                          setEditingAcc(acc);
                          setForm({
                            name: acc.name,
                            type: acc.type,
                            balance: formatCurrencyInput(acc.balance),
                            color: acc.color,
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-3 h-3 mr-1.5" />
                        Editar Conta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2.5 rounded-lg text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setDeletingId(acc.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1.5" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center mx-auto mb-3">
              <Landmark className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Nenhuma conta cadastrada
            </p>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Adicionar conta
            </Button>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[340px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm font-medium">
                Excluir conta?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className="text-xs bg-destructive hover:bg-destructive/90"
                onClick={async () => {
                  if (deletingId) {
                    if (!useDemo) await remove(deletingId);
                    toast.success("Conta excluída!");
                  }
                  setDeleteDialogOpen(false);
                  setDeletingId(null);
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <OFXImportModal
          open={ofxOpen}
          onOpenChange={setOfxOpen}
          onSuccess={() => {
            refetchAccounts();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
