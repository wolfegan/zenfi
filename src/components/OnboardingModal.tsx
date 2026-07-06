import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Wallet, Tags, CheckCircle2, ChevronRight, ChevronLeft,
  Briefcase, Building2, GraduationCap, TrendingDown, PiggyBank,
  TrendingUp, LayoutGrid, Pencil, Trash2, Plus, X, Check,
  ShoppingCart, Car, Home, Coffee, Wifi, Heart, Dumbbell, Plane,
  Book, Music, Utensils, Bus, Smartphone, Zap, Stethoscope,
  Baby, Dog, Gift, Gamepad2, CreditCard, CircleDollarSign, Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Profile } from "@/lib/supabase-types";

// ─── Icon Registry ──────────────────────────────────────────────────────────
const ICONS: Record<string, React.ElementType> = {
  ShoppingCart, Car, Home, Coffee, Wifi, Heart, Dumbbell, Plane,
  Book, Music, Utensils, Bus, Smartphone, Zap, Stethoscope,
  Baby, Dog, Gift, Gamepad2, CreditCard, CircleDollarSign, Banknote,
  Briefcase, Wallet: Wallet, TrendingUp,
};

const ICON_LIST = Object.keys(ICONS);

const COLOR_PALETTE = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#10b981", "#14b8a6", "#3b82f6",
  "#0ea5e9", "#64748b", "#a16207", "#be185d", "#7c3aed",
];

// ─── Default Categories ──────────────────────────────────────────────────────
interface CategoryDraft {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  is_fixed: boolean;
}

const DEFAULT_EXPENSE_CATEGORIES: Omit<CategoryDraft, "id">[] = [
  { name: "Alimentação", type: "expense", icon: "ShoppingCart", color: "#f97316", is_fixed: false },
  { name: "Transporte", type: "expense", icon: "Car", color: "#3b82f6", is_fixed: false },
  { name: "Moradia", type: "expense", icon: "Home", color: "#8b5cf6", is_fixed: true },
  { name: "Saúde", type: "expense", icon: "Stethoscope", color: "#ec4899", is_fixed: false },
  { name: "Lazer", type: "expense", icon: "Gamepad2", color: "#eab308", is_fixed: false },
  { name: "Educação", type: "expense", icon: "Book", color: "#14b8a6", is_fixed: false },
  { name: "Contas", type: "expense", icon: "Zap", color: "#6366f1", is_fixed: true },
  { name: "Vestuário", type: "expense", icon: "Gift", color: "#a16207", is_fixed: false },
];

const DEFAULT_INCOME_CATEGORIES: Omit<CategoryDraft, "id">[] = [
  { name: "Salário", type: "income", icon: "Briefcase", color: "#22c55e", is_fixed: true },
  { name: "Freelance", type: "income", icon: "CircleDollarSign", color: "#10b981", is_fixed: false },
  { name: "Investimentos", type: "income", icon: "TrendingUp", color: "#0ea5e9", is_fixed: false },
];

const makeDrafts = (): CategoryDraft[] => [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
].map((c, i) => ({ ...c, id: `draft-${i}` }));

// ─── Profile Types ───────────────────────────────────────────────────────────
const PROFILE_TYPES = [
  { value: "clt", label: "CLT", icon: Briefcase, desc: "Empregado com carteira assinada" },
  { value: "autonomo", label: "Autônomo", icon: CircleDollarSign, desc: "Trabalho por conta própria" },
  { value: "empresario", label: "Empresário", icon: Building2, desc: "Tenho meu próprio negócio" },
  { value: "estudante", label: "Estudante", icon: GraduationCap, desc: "Estudante ou estagiário" },
];

// ─── Financial Goals ─────────────────────────────────────────────────────────
const FINANCIAL_GOALS = [
  { value: "economizar", label: "Economizar mais", icon: PiggyBank, color: "#22c55e" },
  { value: "dividas", label: "Sair das dívidas", icon: TrendingDown, color: "#ef4444" },
  { value: "investir", label: "Começar a investir", icon: TrendingUp, color: "#3b82f6" },
  { value: "controlar", label: "Controlar gastos", icon: LayoutGrid, color: "#8b5cf6" },
  { value: "aposentadoria", label: "Planejar aposentadoria", icon: Heart, color: "#ec4899" },
  { value: "viagem", label: "Realizar uma viagem", icon: Plane, color: "#f97316" },
];

// ─── Props ───────────────────────────────────────────────────────────────────
interface OnboardingModalProps {
  user: Profile;
  open: boolean;
  onComplete: () => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function OnboardingModal({ user, open, onComplete }: OnboardingModalProps) {
  const totalSteps = 4;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Profile
  const [name, setName] = useState(
    user.name && !user.name.includes("@") ? user.name : ""
  );
  const [age, setAge] = useState("");
  const [profileType, setProfileType] = useState("");

  // Step 2 — Financial
  const [incomeLabel, setIncomeLabel] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");

  // Step 3 — Categories
  const [categories, setCategories] = useState<CategoryDraft[]>(makeDrafts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<"income" | "expense" | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("ShoppingCart");
  const [newCatColor, setNewCatColor] = useState("#6366f1");
  const [editForm, setEditForm] = useState<Partial<CategoryDraft>>({});

  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep2 = monthlyIncome.length > 0 && selectedGoal.length > 0;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  // ── Category helpers ─────────────────────────────────────────────────────────
  const startEdit = (cat: CategoryDraft) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, icon: cat.icon, color: cat.color, is_fixed: cat.is_fixed });
  };
  const saveEdit = () => {
    setCategories((prev) =>
      prev.map((c) => (c.id === editingId ? { ...c, ...editForm } : c))
    );
    setEditingId(null);
    setEditForm({});
  };
  const removeCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };
  const addCategory = () => {
    if (!newCatName.trim() || !addingType) return;
    const newCat: CategoryDraft = {
      id: `draft-${Date.now()}`,
      name: newCatName,
      type: addingType,
      icon: newCatIcon,
      color: newCatColor,
      is_fixed: false,
    };
    setCategories((prev) => [...prev, newCat]);
    setNewCatName("");
    setNewCatIcon("ShoppingCart");
    setNewCatColor("#6366f1");
    setAddingType(null);
  };

  // ── Final submit ─────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      // 1. Update profile
      await supabase.from("profiles").update({
        name: name.trim(),
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
        financial_goal: selectedGoal || null,
        onboarding_completed: true,
      }).eq("id", authUser.id);

      // 2. Insert categories in bulk
      if (categories.length > 0) {
        const rows = categories.map((c, i) => ({
          user_id: authUser.id,
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
          is_fixed: c.is_fixed,
          order: i,
        }));
        const { error: catError } = await supabase.from("categories").insert(rows);
        if (catError) console.warn("Category insert error:", catError.message);
      }

      onComplete();
      toast.success(`Bem-vindo ao Zenfi, ${name}! Tudo configurado. 🎉`);
    } catch (err: any) {
      toast.error("Erro ao salvar configurações: " + (err?.message || "Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-lg rounded-2xl bg-card border text-foreground p-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress bar */}
        <div className="h-1 bg-secondary w-full">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-5 px-6">
          {[
            { icon: User, label: "Perfil" },
            { icon: Wallet, label: "Finanças" },
            { icon: Tags, label: "Categorias" },
            { icon: CheckCircle2, label: "Pronto!" },
          ].map(({ icon: Icon, label }, i) => {
            const n = i + 1;
            const isActive = n === step;
            const isDone = n < step;
            return (
              <div key={n} className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isDone ? "bg-primary text-primary-foreground" :
                    isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-[9px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                </div>
                {i < 3 && (
                  <div className={`h-0.5 w-8 rounded-full mb-4 transition-all duration-300 ${isDone ? "bg-primary" : "bg-secondary"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="px-6 pb-2 pt-2 min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Profile ─────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-4">
                <div>
                  <h2 className="font-bold text-base">Seu Perfil</h2>
                  <p className="text-xs text-muted-foreground">Vamos nos conhecer para personalizar sua experiência.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Como você se chama? <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 rounded-xl border bg-background"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Sua idade <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <Input
                    type="number"
                    placeholder="Ex: 28"
                    min={10}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-10 rounded-xl border bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Como você se identifica? <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROFILE_TYPES.map((pt) => {
                      const Icon = pt.icon;
                      const selected = profileType === pt.value;
                      return (
                        <button
                          key={pt.value}
                          onClick={() => setProfileType(selected ? "" : pt.value)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                            selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/40 hover:bg-secondary/60"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold">{pt.label}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">{pt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Financial ───────────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-4">
                <div>
                  <h2 className="font-bold text-base">Situação Financeira</h2>
                  <p className="text-xs text-muted-foreground">Essas informações calculam sua saúde financeira.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tipo de renda</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["Salário", "Pró-labore", "Freelance", "Outra"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setIncomeLabel(opt === incomeLabel ? "" : opt)}
                        className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all ${
                          incomeLabel === opt ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Valor mensal <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">R$</span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="pl-9 h-10 rounded-xl border bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Principal objetivo financeiro <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FINANCIAL_GOALS.map((g) => {
                      const Icon = g.icon;
                      const selected = selectedGoal === g.value;
                      return (
                        <button
                          key={g.value}
                          onClick={() => setSelectedGoal(selected ? "" : g.value)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                            selected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40 hover:bg-secondary/60"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: g.color + "22" }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: g.color }} />
                          </div>
                          <span className={`text-xs font-medium leading-tight ${selected ? "text-primary" : ""}`}>{g.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Categories ──────────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-3">
                <div>
                  <h2 className="font-bold text-base">Suas Categorias</h2>
                  <p className="text-xs text-muted-foreground">Padrões prontos para usar. Edite, remova ou adicione novas!</p>
                </div>

                <div className="max-h-[340px] overflow-y-auto space-y-3 pr-1">
                  {(["expense", "income"] as const).map((type) => (
                    <div key={type}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        {type === "expense" ? "💸 Despesas" : "💰 Receitas"}
                      </p>
                      <div className="space-y-1">
                        {categories.filter((c) => c.type === type).map((cat) => {
                          const Icon = ICONS[cat.icon] || ShoppingCart;
                          const isEditing = editingId === cat.id;
                          return (
                            <div key={cat.id} className="rounded-xl border bg-background p-2.5">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editForm.name || ""}
                                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                    className="h-8 text-xs rounded-lg"
                                    placeholder="Nome da categoria"
                                    autoFocus
                                  />
                                  <div>
                                    <p className="text-[10px] text-muted-foreground font-semibold mb-1">Ícone:</p>
                                    <div className="flex gap-1 flex-wrap">
                                      {ICON_LIST.map((iconKey) => {
                                        const IcoComp = ICONS[iconKey];
                                        return (
                                          <button
                                            key={iconKey}
                                            onClick={() => setEditForm((f) => ({ ...f, icon: iconKey }))}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${editForm.icon === iconKey ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                                          >
                                            <IcoComp className="w-3.5 h-3.5" />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-muted-foreground font-semibold mb-1">Cor:</p>
                                    <div className="flex gap-1.5 flex-wrap">
                                      {COLOR_PALETTE.map((c) => (
                                        <button
                                          key={c}
                                          onClick={() => setEditForm((f) => ({ ...f, color: c }))}
                                          className={`w-5 h-5 rounded-full border-2 transition-all ${editForm.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                                          style={{ backgroundColor: c }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" className="h-7 text-xs rounded-lg flex-1" onClick={saveEdit}>
                                      <Check className="w-3 h-3 mr-1" /> Salvar
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => { setEditingId(null); setEditForm({}); }}>
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + "22" }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                                  </div>
                                  <span className="text-xs font-medium flex-1">{cat.name}</span>
                                  {cat.is_fixed && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">Fixo</span>}
                                  <button onClick={() => startEdit(cat)} className="p-1 hover:text-primary transition-colors" title="Editar">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => removeCategory(cat.id)} className="p-1 hover:text-destructive transition-colors" title="Remover">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add new category */}
                      {addingType === type ? (
                        <div className="mt-1 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-2.5 space-y-2">
                          <Input
                            placeholder="Nome da categoria"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className="h-8 text-xs rounded-lg"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && addCategory()}
                          />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold mb-1">Ícone:</p>
                            <div className="flex gap-1 flex-wrap">
                              {ICON_LIST.map((iconKey) => {
                                const IcoComp = ICONS[iconKey];
                                return (
                                  <button
                                    key={iconKey}
                                    onClick={() => setNewCatIcon(iconKey)}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${newCatIcon === iconKey ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                                  >
                                    <IcoComp className="w-3.5 h-3.5" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold mb-1">Cor:</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {COLOR_PALETTE.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setNewCatColor(c)}
                                  className={`w-5 h-5 rounded-full border-2 transition-all ${newCatColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs rounded-lg flex-1" onClick={addCategory} disabled={!newCatName.trim()}>
                              <Plus className="w-3 h-3 mr-1" /> Adicionar
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => setAddingType(null)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingType(type)}
                          className="mt-1.5 w-full text-[11px] text-muted-foreground border border-dashed rounded-xl py-2 hover:border-primary/40 hover:text-primary transition-all"
                        >
                          + Adicionar {type === "expense" ? "despesa" : "receita"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Done ────────────────────────────────────────────── */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col items-center justify-center text-center space-y-5 py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <h2 className="text-2xl font-bold tracking-tight">Tudo pronto, {name}! 🎉</h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
                    Seu espaço no Zenfi está configurado. Comece adicionando sua primeira transação!
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="w-full space-y-2">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground p-3 bg-secondary/50 rounded-xl text-left">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      Perfil: <strong className="text-foreground">{name}{age ? `, ${age} anos` : ""}</strong>
                      {profileType ? ` · ${PROFILE_TYPES.find(p => p.value === profileType)?.label}` : ""}
                    </span>
                  </div>
                  {monthlyIncome && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground p-3 bg-secondary/50 rounded-xl text-left">
                      <Wallet className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        Renda: <strong className="text-foreground">R$ {parseFloat(monthlyIncome).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>/mês
                        {incomeLabel ? ` (${incomeLabel})` : ""}
                      </span>
                    </div>
                  )}
                  {selectedGoal && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground p-3 bg-secondary/50 rounded-xl text-left">
                      <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Objetivo: <strong className="text-foreground">{FINANCIAL_GOALS.find(g => g.value === selectedGoal)?.label}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground p-3 bg-secondary/50 rounded-xl text-left">
                    <Tags className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span><strong className="text-foreground">{categories.length} categorias</strong> configuradas</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 border-t pt-4">
          {step > 1 && step < totalSteps && (
            <Button variant="outline" onClick={prev} className="rounded-xl h-10 flex items-center gap-1 text-sm">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>
          )}
          {step < 3 && (
            <Button
              onClick={next}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex-1 rounded-xl h-10 text-sm font-semibold flex items-center justify-center gap-1"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={next} className="flex-1 rounded-xl h-10 text-sm font-semibold flex items-center justify-center gap-1">
              Revisar e Finalizar <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          {step === totalSteps && (
            <Button onClick={handleFinish} disabled={submitting} className="flex-1 rounded-xl h-10 text-sm font-semibold">
              {submitting ? "Configurando..." : "Entrar no Zenfi 🚀"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
