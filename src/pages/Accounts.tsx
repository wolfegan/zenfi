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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts } from "@/hooks/use-supabase";
import { parseBRLAmount, formatCurrencyInput } from "@/lib/utils";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import { BankLogo, POPULAR_BANKS, POPULAR_BENEFITS } from "@/components/BankLogo";
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
  Utensils,
  ShoppingCart,
  Bus,
  Gift,
  Fuel,
  HeartPulse,
  Sparkles,
  CreditCard,
  Layers,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { demoAccounts } from "@/lib/demo-data";
import { toast } from "sonner";

export const accountTypes = [
  { value: "checking", label: "Conta Corrente", icon: Wallet, category: "bank" },
  { value: "savings", label: "Poupança", icon: PiggyBank, category: "bank" },
  { value: "cash", label: "Dinheiro Físico", icon: Banknote, category: "bank" },
  { value: "benefit_vr", label: "Vale Refeição (VR)", icon: Utensils, category: "benefit" },
  { value: "benefit_va", label: "Vale Alimentação (VA)", icon: ShoppingCart, category: "benefit" },
  { value: "benefit_vt", label: "Vale Transporte (VT)", icon: Bus, category: "benefit" },
  { value: "benefit_flex", label: "Benefício Flex (Caju, Flash, Swile)", icon: Gift, category: "benefit" },
  { value: "benefit_fuel", label: "Vale Combustível", icon: Fuel, category: "benefit" },
  { value: "benefit_health", label: "Vale Saúde / Farmácia", icon: HeartPulse, category: "benefit" },
  { value: "other", label: "Outro", icon: Building2, category: "bank" },
];

function getAccountIcon(type: string) {
  return accountTypes.find((a) => a.value === type)?.icon || Landmark;
}
function getAccountLabel(type: string) {
  return accountTypes.find((a) => a.value === type)?.label || type;
}
function isBenefitType(type: string) {
  return type?.startsWith("benefit_");
}

export default function Accounts() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<any>(null);
  const [presetCategoryTab, setPresetCategoryTab] = useState<"bank" | "benefit">("bank");
  const [filterTab, setFilterTab] = useState<"all" | "bank" | "benefit">("all");

  const [form, setForm] = useState({
    name: "",
    type: "checking",
    balance: "",
    color: "#0a0a0a",
  });

  const colorOptions = [
    "#0a0a0a", // Preto C6 / Dark
    "#820ad1", // Roxo Nubank
    "#ff4b60", // Caju Pink
    "#ff5000", // Flash Laranja
    "#6c42f5", // Swile Roxo
    "#008a00", // Alelo Verde
    "#0070c0", // Pluxee Azul
    "#e2001a", // Ticket Vermelho
    "#0077b6", // SPTrans Azul
    "#ff5700", // Laranja Inter
    "#ec0000", // Vermelho Santander
    "#cc092f", // Vermelho Bradesco
    "#ec7000", // Laranja Itaú
    "#003399", // Azul Caixa
    "#005aa5", // Azul Banco do Brasil
    "#003641", // Verde Sicoob
    "#00aa5b", // Verde Sicredi
    "#0ea5e9", // Azul Safra
    "#10b981", // Emerald
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
  const accounts = useDemo ? demoAccounts : (realAccounts || []);

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const resetForm = () => {
    setForm({ name: "", type: "checking", balance: "", color: "#0a0a0a" });
    setPresetCategoryTab("bank");
  };

  const totalBalance = accounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
  const bankBalance = accounts
    .filter((a: any) => !isBenefitType(a.type))
    .reduce((s: number, a: any) => s + (a.balance || 0), 0);
  const benefitBalance = accounts
    .filter((a: any) => isBenefitType(a.type))
    .reduce((s: number, a: any) => s + (a.balance || 0), 0);

  const filteredAccounts = accounts.filter((a: any) => {
    if (filterTab === "bank") return !isBenefitType(a.type);
    if (filterTab === "benefit") return isBenefitType(a.type);
    return true;
  });

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-warning" /> Modo demonstração
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-medium tracking-tight flex items-center gap-2">
              Contas & Cartões Benefícios
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Acompanhe seu saldo em contas bancárias e cartões de benefício empresa (VT, VR, VA, Flex, Combustível)
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
                <Button size="sm" className="text-xs h-9 font-semibold">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Nova Conta / Benefício
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px] p-5 rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </span>
                    {editingAcc ? "Editar Conta ou Benefício" : "Cadastrar Conta ou Cartão Benefício"}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Adicione contas bancárias, saldo em dinheiro ou cartões de benefícios corporativos (Caju, Flash, Swile, Alelo, Sodexo, VT, etc.).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Presets Toggle: Bancos vs Benefícios */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Atalhos Rápidos (Clique para Selecionar)
                      </span>
                    </div>
                    <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-2">
                      <button
                        type="button"
                        onClick={() => setPresetCategoryTab("bank")}
                        className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          presetCategoryTab === "bank"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Landmark className="w-3.5 h-3.5" />
                        Bancos Populares
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCategoryTab("benefit")}
                        className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          presetCategoryTab === "benefit"
                            ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border border-emerald-500/30 shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Gift className="w-3.5 h-3.5 text-emerald-500" />
                        Cartões Benefícios
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 bg-secondary/20 rounded-xl border border-border/50">
                      {(presetCategoryTab === "bank" ? POPULAR_BANKS : POPULAR_BENEFITS).map((b) => {
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
                                type: b.type || (presetCategoryTab === "benefit" ? "benefit_flex" : form.type),
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
                              <BankLogo bankKeyOrName={b.id} type={b.type} className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[10px] font-medium truncate w-full leading-tight">
                              {b.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-semibold">
                      Nome da Conta / Cartão Benefício *
                    </label>
                    <div className="relative">
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ex: Caju Flex, Alelo VR, Nubank, Bilhete Único..."
                        className="pr-9 h-10 rounded-xl text-xs"
                      />
                      <div
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center pointer-events-none"
                        style={{ backgroundColor: form.color }}
                      >
                        <BankLogo bankKeyOrName={form.name} type={form.type} className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-semibold">
                      Tipo de Conta / Benefício
                    </label>
                    <Select
                      value={form.type}
                      onValueChange={(v) => setForm({ ...form, type: v })}
                    >
                      <SelectTrigger className="text-xs h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Contas Bancárias Tradicionais
                          </SelectLabel>
                          {accountTypes
                            .filter((t) => t.category === "bank")
                            .map((t) => (
                              <SelectItem key={t.value} value={t.value} className="text-xs">
                                {t.label}
                              </SelectItem>
                            ))}
                        </SelectGroup>

                        <SelectGroup>
                          <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-2">
                            Cartões de Benefícios Empresa
                          </SelectLabel>
                          {accountTypes
                            .filter((t) => t.category === "benefit")
                            .map((t) => (
                              <SelectItem key={t.value} value={t.value} className="text-xs font-medium">
                                {t.label}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Saldo Atual */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-semibold">
                      Saldo Atual do Cartão / Conta *
                    </label>
                    <BRLCurrencyInput
                      value={form.balance}
                      onChangeValue={(val) => setForm({ ...form, balance: val })}
                      placeholder="R$ 0,00"
                    />
                  </div>

                  {/* Cor */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center justify-between font-semibold">
                      <span>Cor de Identificação</span>
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
                              ? "border-foreground scale-110 shadow-sm ring-2 ring-primary/20"
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

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 rounded-xl"
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
                    className="text-xs h-9 rounded-xl font-bold"
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
                          editingAcc
                            ? "Registro atualizado com sucesso!"
                            : isBenefitType(form.type)
                            ? "Cartão Benefício cadastrado com sucesso!"
                            : "Conta bancária criada com sucesso!",
                        );
                        setDialogOpen(false);
                        resetForm();
                        setEditingAcc(null);
                      } else {
                        toast.error("Por favor, preencha o nome e o saldo inicial.");
                      }
                    }}
                  >
                    {editingAcc ? "Salvar Alterações" : "Cadastrar Conta / Cartão"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Header Summary Cards: Bancos vs Cartões Benefícios vs Consolidado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border bg-card relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-primary" />
                Contas Bancárias & Dinheiro
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {formatCurrency(bankBalance)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {accounts.filter((a: any) => !isBenefitType(a.type)).length} conta(s) tradicional(is)
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-card-foreground relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-emerald-500" />
                Saldo Cartões Benefícios
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                VT / VR / Flex
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-emerald-950 dark:text-emerald-100">
              {formatCurrency(benefitBalance)}
            </p>
            <p className="text-[10px] text-emerald-800/80 dark:text-emerald-400 mt-1">
              {accounts.filter((a: any) => isBenefitType(a.type)).length} cartão(ões) de benefícios empresa
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl border bg-gradient-to-br from-primary/10 to-card text-card-foreground relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Patrimônio Líquido Total
              </span>
            </div>
            <p className="text-2xl font-black tracking-tight tabular-nums">
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Consolidado de todas as {accounts.length} contas e cartões
            </p>
          </motion.div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/40 rounded-xl w-fit border border-border/40">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTab === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas ({accounts.length})
          </button>
          <button
            onClick={() => setFilterTab("bank")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTab === "bank"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bancárias ({accounts.filter((a: any) => !isBenefitType(a.type)).length})
          </button>
          <button
            onClick={() => setFilterTab("benefit")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              filterTab === "benefit"
                ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-emerald-500" />
            Cartões Benefícios ({accounts.filter((a: any) => isBenefitType(a.type)).length})
          </button>
        </div>

        {/* Accounts & Benefit Cards Grid */}
        {filteredAccounts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((acc: any, i: number) => {
              const Icon = getAccountIcon(acc.type);
              const isBenefit = isBenefitType(acc.type);

              return (
                <motion.div
                  key={acc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border bg-card hover:shadow-md transition-all duration-200 group overflow-hidden relative"
                >
                  <div
                    className="p-5"
                    style={{ backgroundColor: `${acc.color}0a` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: acc.color }}
                        >
                          <BankLogo bankKeyOrName={acc.name} type={acc.type} className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold tracking-tight">{acc.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-muted-foreground font-medium">
                              {getAccountLabel(acc.type)}
                            </p>
                            {isBenefit && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                                Benefício
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
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
                          title="Editar Registro"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => {
                            setDeletingId(acc.id);
                            setDeleteDialogOpen(true);
                          }}
                          title="Excluir Registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-0.5">
                        Saldo Disponível
                      </span>
                      <p className="text-2xl font-bold tracking-tight tabular-nums">
                        {formatCurrency(acc.balance)}
                      </p>
                    </div>

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
                        Editar
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
          <div className="text-center py-16 bg-card border rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold mb-1">
              Nenhuma conta ou cartão de benefício encontrado
            </p>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Cadastre seu cartão VR, VA, VT, Caju, Swile, Flash ou conta bancária para manter seu saldo sempre atualizado.
            </p>
            <Button
              size="sm"
              className="text-xs font-semibold rounded-xl"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Cadastrar Agora
            </Button>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[360px] p-5 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm font-bold">
                Excluir registro?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Esta conta ou cartão de benefício será removido permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs rounded-xl">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className="text-xs bg-destructive hover:bg-destructive/90 rounded-xl font-bold"
                onClick={async () => {
                  if (deletingId) {
                    if (!useDemo) await remove(deletingId);
                    toast.success("Registro excluído com sucesso!");
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
