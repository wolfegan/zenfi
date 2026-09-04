import { DashboardLayout, openSimulator } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import { supabase } from "@/lib/supabase";
import {
  useCreditCards,
  useAccounts,
  useCategories,
  useTransactions,
  computeCardStats,
} from "@/hooks/use-supabase";
import { parseBRLAmount, formatCurrencyInput } from "@/lib/utils";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import { PayBillModal } from "@/components/PayBillModal";
import { AddCreditPurchaseModal } from "@/components/AddCreditPurchaseModal";
import { motion } from "framer-motion";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  ShoppingBag,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { demoCreditCards } from "@/lib/demo-data";
import { currentBillMonth, addMonthsYm, billDatesForMonth } from "@/lib/credit-card";

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

function dueLabel(dueDate: string): string {
  const n = daysUntil(dueDate);
  if (n < -1) return `venceu há ${-n} dias`;
  if (n === -1) return "venceu ontem";
  if (n === 0) return "vence hoje";
  if (n === 1) return "vence amanhã";
  return `vence em ${n} dias`;
}

const colorOptions = [
  "#0a0a0a", // Preto C6 / Dark
  "#820ad1", // Roxo Nubank
  "#ff7a00", // Laranja Inter / Itaú
  "#cc092f", // Vermelho Santander / Bradesco
  "#005ca9", // Azul Caixa
  "#00d68f", // Verde XP
  "#6366f1", // Indigo
  "#8b5cf6", // Violeta
  "#ec4899", // Rosa Hot
  "#ef4444", // Vermelho Vivo
  "#f97316", // Laranja Coral
  "#eab308", // Dourado
  "#22c55e", // Verde Esmeralda
  "#10b981", // Menta
  "#06b6d4", // Ciano
  "#3b82f6", // Azul Royal
  "#1e40af", // Azul Marinho
  "#475569", // Grafite Slate
  "#d97706", // Ámbar / Bronze
  "#be185d", // Vinho / Magenta
  "#4c1d95", // Roxo Escuro
  "#065f46", // Verde Floresta
];

export default function CreditCardsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payBillOpen, setPayBillOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<any>(null);
  const [billTab, setBillTab] = useState<"open" | "closed">("open");

  // Purchase Modal state
  const [addPurchaseOpen, setAddPurchaseOpen] = useState(false);
  const [selectedCardForPurchase, setSelectedCardForPurchase] = useState<string | undefined>(undefined);

  // Form states for creating/editing card
  const [form, setForm] = useState({
    name: "",
    limit: "",
    customUsedLimit: "",
    closingDay: "5",
    dueDay: "10",
    color: "#0a0a0a",
    interestRate: "",
  });

  // Initial open invoice amounts for upcoming months
  const [initialBillCurrent, setInitialBillCurrent] = useState("");
  const [initialBillMonth1, setInitialBillMonth1] = useState("");
  const [initialBillMonth2, setInitialBillMonth2] = useState("");
  const [initialBillMonth3, setInitialBillMonth3] = useState("");
  const [initialBillMonth4, setInitialBillMonth4] = useState("");
  const [initialBillMonth5, setInitialBillMonth5] = useState("");

  const {
    data: realCards,
    loading: cardsLoading,
    create,
    update,
    remove,
    toggleBillPaid,
    payBill,
    deleteBill,
    refetch: refetchCards,
  } = useCreditCards();

  const { refetch: refetchAccounts } = useAccounts();
  const { data: categories } = useCategories();
  const { create: createTransaction } = useTransactions();

  const useDemo = !!user?.is_anonymous;
  const [demoCardsState, setDemoCardsState] = useState<any[]>(demoCreditCards);

  const cards = useDemo
    ? demoCardsState.map((c: any) => ({
        ...c,
        ...computeCardStats(c, c.bills ?? []),
      }))
    : realCards;

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const resetForm = () => {
    setForm({
      name: "",
      limit: "",
      customUsedLimit: "",
      closingDay: "5",
      dueDay: "10",
      color: "#0a0a0a",
      interestRate: "",
    });
    setInitialBillCurrent("");
    setInitialBillMonth1("");
    setInitialBillMonth2("");
    setInitialBillMonth3("");
    setInitialBillMonth4("");
    setInitialBillMonth5("");
    setEditingCard(null);
  };

  const handleSaveCard = async () => {
    if (!form.name || !form.limit) {
      toast.error("Por favor informe o nome e o limite do cartão.");
      return;
    }

    const limitVal = parseBRLAmount(form.limit);
    const closingDayNum = parseInt(form.closingDay) || 5;
    const dueDayNum = parseInt(form.dueDay) || 10;
    const interestVal = parseFloat(form.interestRate.replace(",", ".")) || 0;

    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month1 = addMonthsYm(curMonth, 1);
    const month2 = addMonthsYm(curMonth, 2);
    const month3 = addMonthsYm(curMonth, 3);
    const month4 = addMonthsYm(curMonth, 4);
    const month5 = addMonthsYm(curMonth, 5);

    const defaultCatId = categories?.[0]?.id || "";

    const initialItems = [
      { amountStr: initialBillCurrent, month: curMonth, label: "Fatura Mês Atual" },
      { amountStr: initialBillMonth1, month: month1, label: "Fatura +1m" },
      { amountStr: initialBillMonth2, month: month2, label: "Fatura +2m" },
      { amountStr: initialBillMonth3, month: month3, label: "Fatura +3m" },
      { amountStr: initialBillMonth4, month: month4, label: "Fatura +4m" },
      { amountStr: initialBillMonth5, month: month5, label: "Fatura +5m" },
    ];

    const customUsedVal = form.customUsedLimit ? parseBRLAmount(form.customUsedLimit) : null;

    if (!useDemo) {
      const cardPayload = {
        name: form.name,
        limit: limitVal,
        custom_used_amount: customUsedVal,
        closing_day: closingDayNum,
        due_day: dueDayNum,
        color: form.color,
        interest_rate: interestVal,
      };

      let targetCardId = editingCard?.id;

      if (editingCard) {
        await update(editingCard.id, cardPayload);
        // Exclui lançamentos anteriores de faturas em aberto para sobrescrever com novos valores
        await supabase
          .from("transactions")
          .delete()
          .eq("user_id", user!.id)
          .eq("credit_card_id", targetCardId)
          .or("description.ilike.%Fatura em aberto%,description.ilike.%Saldo em aberto%,description.ilike.%Parcela/Fatura%");

        toast.success("Cartão atualizado com sucesso!");
      } else {
        const newCard = await create(cardPayload);
        if (newCard) {
          targetCardId = newCard.id;
          toast.success("Cartão adicionado com sucesso!");
        }
      }

      if (targetCardId) {
        for (const item of initialItems) {
          const val = parseBRLAmount(item.amountStr);
          if (val > 0 && defaultCatId) {
            const { dueDate } = billDatesForMonth(item.month, closingDayNum, dueDayNum);
            await createTransaction({
              category_id: defaultCatId,
              amount: val,
              date: dueDate,
              type: "expense",
              description: `Parcela/Fatura em aberto (${item.label})`,
              is_fixed: false,
              is_credit_card: true,
              credit_card_id: targetCardId,
              payment_method: "Cartão",
            });
          }
        }
      }
      await refetchCards();
    } else {
      // MODO DEMONSTRAÇÃO / TESTE: Atualiza o estado local em memória imediatamente
      const newBills: any[] = [];
      initialItems.forEach((item, idx) => {
        const val = parseBRLAmount(item.amountStr);
        if (val > 0) {
          const { dueDate, closingDate } = billDatesForMonth(item.month, closingDayNum, dueDayNum);
          newBills.push({
            id: `demo-bill-${Date.now()}-${idx}`,
            user_id: user?.id || "user-1",
            credit_card_id: editingCard?.id || `demo-card-${Date.now()}`,
            month: item.month,
            total_amount: val,
            is_paid: false,
            due_date: dueDate,
            closing_date: closingDate,
            created_at: Date.now(),
          });
        }
      });

      if (editingCard) {
        setDemoCardsState((prev) =>
          prev.map((c) =>
            c.id === editingCard.id
              ? {
                  ...c,
                  name: form.name,
                  limit: limitVal,
                  custom_used_amount: customUsedVal,
                  closing_day: closingDayNum,
                  due_day: dueDayNum,
                  color: form.color,
                  interest_rate: interestVal,
                  bills: newBills,
                }
              : c
          )
        );
        toast.success("Cartão atualizado com sucesso!");
      } else {
        const newCardObj = {
          id: `demo-card-${Date.now()}`,
          user_id: user?.id || "user-1",
          name: form.name,
          limit: limitVal,
          custom_used_amount: customUsedVal,
          closing_day: closingDayNum,
          due_day: dueDayNum,
          color: form.color,
          interest_rate: interestVal,
          created_at: Date.now(),
          bills: newBills,
        };
        setDemoCardsState((prev) => [...prev, newCardObj]);
        toast.success("Cartão adicionado com sucesso!");
      }
    }

    setDialogOpen(false);
    resetForm();
  };

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
              Cartões de Crédito
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Acompanhe faturas abertas, parcelamentos futuros e limites disponíveis
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={openSimulator}
              className="text-xs h-9 font-semibold border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Simular Compra Futura
            </Button>

            {cards && cards.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedCardForPurchase(cards[0]?.id);
                  setAddPurchaseOpen(true);
                }}
                className="text-xs h-9 font-semibold border-border/80"
              >
                <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Lançar Compra / Parcelas
              </Button>
            )}

            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs h-9 font-bold bg-[#173b2c] text-white hover:bg-[#102a1f]">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Novo Cartão
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px] rounded-3xl border-border/80 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold">
                    {editingCard ? "Editar Cartão de Crédito" : "Novo Cartão de Crédito"}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {editingCard
                      ? "Edite as configurações do seu cartão de crédito"
                      : "Cadastre os detalhes do cartão e faturas em aberto para os próximos meses"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 max-h-[75vh] overflow-y-auto pr-1">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                      Nome do Cartão *
                    </label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Nubank, Itaú Personnalité, Inter"
                      className="text-xs h-10 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                      Limite Total do Cartão (R$) *
                    </label>
                    <BRLCurrencyInput
                      value={form.limit}
                      onChangeValue={(val) => setForm({ ...form, limit: val })}
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                      Limite Utilizado Real no Banco (opcional)
                    </label>
                    <BRLCurrencyInput
                      value={form.customUsedLimit}
                      onChangeValue={(val) => setForm({ ...form, customUsedLimit: val })}
                      placeholder="Ex: R$ 600,02 (opcional)"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Preencha se o limite utilizado exibido no app do seu banco for diferente da soma das faturas.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Dia de Fechamento
                      </label>
                      <Select
                        value={form.closingDay}
                        onValueChange={(v) => setForm({ ...form, closingDay: v })}
                      >
                        <SelectTrigger className="text-xs h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                            <SelectItem key={d} value={String(d)} className="text-xs">
                              Dia {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                        Dia de Vencimento
                      </label>
                      <Select
                        value={form.dueDay}
                        onValueChange={(v) => setForm({ ...form, dueDay: v })}
                      >
                        <SelectTrigger className="text-xs h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                            <SelectItem key={d} value={String(d)} className="text-xs">
                              Dia {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>Parcelas & Faturas em Aberto (Mês Atual e Futuros)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Informe o valor das parcelas e faturas que já estão em aberto para este cartão nos próximos meses:
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      {(() => {
                        const now = new Date();
                        const getLabel = (offset: number) => {
                          const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
                          const name = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
                          const fmt = name.charAt(0).toUpperCase() + name.slice(1);
                          return offset === 0 ? `${fmt} (Mês Atual)` : `${fmt} (+${offset}m)`;
                        };

                        return (
                          <>
                            <div>
                              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                                {getLabel(0)} (R$)
                              </label>
                              <BRLCurrencyInput
                                value={initialBillCurrent}
                                onChangeValue={setInitialBillCurrent}
                                placeholder="R$ 0,00"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                                {getLabel(1)} (R$)
                              </label>
                              <BRLCurrencyInput
                                value={initialBillMonth1}
                                onChangeValue={setInitialBillMonth1}
                                placeholder="R$ 0,00"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                                {getLabel(2)} (R$)
                              </label>
                              <BRLCurrencyInput
                                value={initialBillMonth2}
                                onChangeValue={setInitialBillMonth2}
                                placeholder="R$ 0,00"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                                {getLabel(3)} (R$)
                              </label>
                              <BRLCurrencyInput
                                value={initialBillMonth3}
                                onChangeValue={setInitialBillMonth3}
                                placeholder="R$ 0,00"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                                {getLabel(4)} (R$)
                              </label>
                              <BRLCurrencyInput
                                value={initialBillMonth4}
                                onChangeValue={setInitialBillMonth4}
                                placeholder="R$ 0,00"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                                {getLabel(5)} (R$)
                              </label>
                              <BRLCurrencyInput
                                value={initialBillMonth5}
                                onChangeValue={setInitialBillMonth5}
                                placeholder="R$ 0,00"
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                      Juros do rotativo (% ao mês) <span className="text-muted-foreground/60">— opcional</span>
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={form.interestRate}
                      onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                      placeholder="Ex: 12,5"
                      className="text-xs h-10 rounded-xl"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-muted-foreground block font-medium">
                        Cor do Cartão
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border shadow-xs"
                          style={{ backgroundColor: form.color }}
                        />
                        <span className="text-[11px] font-mono text-muted-foreground uppercase">
                          {form.color}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            form.color === color
                              ? "border-foreground scale-110 shadow-sm"
                              : "border-transparent opacity-90 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setForm({ ...form, color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-xl"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs rounded-xl font-bold bg-[#173b2c] text-white hover:bg-[#102a1f]"
                    onClick={handleSaveCard}
                  >
                    {editingCard ? "Salvar Alterações" : "Adicionar Cartão"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Cards Grid */}
        {cards && cards.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {cards.map((card: any, i: number) => {
              const used = card.used ?? 0;
              const available = card.available ?? Math.max(0, card.limit - used);
              const utilization = card.utilization ?? 0;
              const spending = used;
              const allBills = (card.bills as any[]) ?? [];

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border bg-card overflow-hidden shadow-xs"
                >
                  {/* Card Banner Header */}
                  <div
                    className="p-5"
                    style={{ backgroundColor: `${card.color}0D` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: card.color }}
                        >
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-tight">{card.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span>Fechamento dia {card.closing_day} · Vence dia {card.due_day}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                              Melhor dia compra dia {card.closing_day >= 28 ? "01" : String(card.closing_day + 1).padStart(2, "0")}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-7 px-2.5 rounded-lg border-border/80 hover:bg-secondary font-semibold"
                          onClick={() => {
                            setSelectedCardForPurchase(card.id);
                            setAddPurchaseOpen(true);
                          }}
                        >
                          <ShoppingBag className="w-3 h-3 mr-1 text-primary" />
                          + Compra
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingCard(card);
                            setForm({
                              name: card.name,
                              limit: formatCurrencyInput(card.limit),
                              customUsedLimit: card.custom_used_amount ? formatCurrencyInput(card.custom_used_amount) : "",
                              closingDay: card.closing_day.toString(),
                              dueDay: card.due_day.toString(),
                              color: card.color,
                              interestRate: String(card.interest_rate ?? ""),
                            });

                            const now = new Date();
                            const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                            const m1 = addMonthsYm(curMonth, 1);
                            const m2 = addMonthsYm(curMonth, 2);
                            const m3 = addMonthsYm(curMonth, 3);
                            const m4 = addMonthsYm(curMonth, 4);
                            const m5 = addMonthsYm(curMonth, 5);

                            const bCur = allBills.find((b: any) => b.month === curMonth);
                            const b1 = allBills.find((b: any) => b.month === m1);
                            const b2 = allBills.find((b: any) => b.month === m2);
                            const b3 = allBills.find((b: any) => b.month === m3);
                            const b4 = allBills.find((b: any) => b.month === m4);
                            const b5 = allBills.find((b: any) => b.month === m5);

                            setInitialBillCurrent(bCur?.total_amount ? formatCurrencyInput(bCur.total_amount) : "");
                            setInitialBillMonth1(b1?.total_amount ? formatCurrencyInput(b1.total_amount) : "");
                            setInitialBillMonth2(b2?.total_amount ? formatCurrencyInput(b2.total_amount) : "");
                            setInitialBillMonth3(b3?.total_amount ? formatCurrencyInput(b3.total_amount) : "");
                            setInitialBillMonth4(b4?.total_amount ? formatCurrencyInput(b4.total_amount) : "");
                            setInitialBillMonth5(b5?.total_amount ? formatCurrencyInput(b5.total_amount) : "");

                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setDeleteCardId(card.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Utilization Progress Bar */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        Limite Utilizado
                      </span>
                      <span className="text-xs font-semibold tabular-nums">
                        {spending.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}{" "}
                        /{" "}
                        {card.limit.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>

                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          utilization > 80 ? "bg-destructive" : utilization > 50 ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {utilization.toFixed(0)}% comprometido
                      </p>
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Disponível:{" "}
                        {available.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Monthly Bills Timeline */}
                  {allBills.length > 0 && (
                    <div className="border-t bg-card">
                      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 border-b overflow-x-auto">
                        {allBills.map((bill: any) => {
                          const monthLabel = new Date(bill.month + "-01T12:00:00").toLocaleDateString(
                            "pt-BR",
                            { month: "short", year: "2-digit" }
                          );
                          const isPaid = bill.is_paid;
                          const billTotal = Number(bill.total_amount) + Number(bill.rollover_amount ?? 0);
                          const paidAmount = Number(bill.paid_amount ?? 0);
                          const outstanding = Math.max(0, billTotal - paidAmount);

                          return (
                            <div
                              key={bill.id}
                              className={`px-3 py-1.5 rounded-xl border shrink-0 text-left transition-all ${
                                isPaid
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : outstanding > 0
                                  ? "border-border bg-secondary/50 text-foreground"
                                  : "border-border/40 bg-secondary/20 text-muted-foreground"
                              }`}
                            >
                              <div className="text-[10px] font-bold uppercase tracking-wider">
                                {monthLabel}
                              </div>
                              <div className="text-xs font-semibold tabular-nums">
                                {isPaid ? "Quitada" : `R$ ${outstanding.toFixed(2)}`}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed Bill List */}
                      <div className="divide-y max-h-56 overflow-y-auto">
                        {allBills.map((bill: any) => {
                          const monthLabel = new Date(
                            bill.month + "-01T12:00:00"
                          ).toLocaleDateString("pt-BR", {
                            month: "long",
                            year: "numeric",
                          });
                          const paidAmount = Number(bill.paid_amount ?? 0);
                          const billTotal =
                            Number(bill.total_amount) + Number(bill.rollover_amount ?? 0);
                          const outstanding = Math.max(0, billTotal - paidAmount);
                          const isPartial = !bill.is_paid && paidAmount > 0.005;
                          const isRolled = !!bill.rolled_forward;

                          return (
                            <div
                              key={bill.id}
                              className={`flex items-center justify-between px-5 py-3 group/bill ${
                                isRolled ? "opacity-60" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <button
                                  disabled={isRolled}
                                  onClick={async () => {
                                    if (isRolled) return;
                                    if (bill.is_paid) {
                                      if (!useDemo) {
                                        await toggleBillPaid(bill.id, false);
                                        await refetchCards();
                                        toast.success("Fatura reaberta!");
                                      } else {
                                        toast.info("Modo demonstração não altera dados.");
                                      }
                                    } else {
                                      setPayingBill(bill);
                                      setPayBillOpen(true);
                                    }
                                  }}
                                  className="shrink-0 hover:scale-105 transition-transform"
                                  title={bill.is_paid ? "Marcar como pendente" : "Pagar Fatura"}
                                >
                                  {bill.is_paid ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                  )}
                                </button>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold capitalize">
                                      Fatura {monthLabel}
                                    </span>
                                    {!bill.is_paid && !isRolled && (
                                      <span
                                        className={`text-[10px] font-semibold ${
                                          daysUntil(bill.due_date) < 0
                                            ? "text-rose-600 dark:text-rose-400"
                                            : daysUntil(bill.due_date) <= 3
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {dueLabel(bill.due_date)}
                                      </span>
                                    )}
                                  </div>
                                  {bill.is_paid && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                      Paga integralmente
                                    </span>
                                  )}
                                  {isPartial && !isRolled && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                      Parcial · {paidAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} pagos
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-xs font-bold tabular-nums ${
                                    bill.is_paid || isRolled ? "text-muted-foreground line-through" : ""
                                  }`}
                                >
                                  {(bill.is_paid || isRolled ? billTotal : outstanding).toLocaleString(
                                    "pt-BR",
                                    { style: "currency", currency: "BRL" }
                                  )}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
                                  title="Excluir Fatura"
                                  onClick={async () => {
                                    if (confirm(`Tem certeza que deseja excluir a fatura de ${monthLabel}?`)) {
                                      if (!useDemo) {
                                        await deleteBill(bill.id);
                                        await refetchCards();
                                        toast.success("Fatura excluída!");
                                      } else {
                                        toast.info("Modo demonstração não altera dados.");
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Nenhum cartão de crédito cadastrado
            </p>
            <Button
              size="sm"
              className="text-xs font-bold bg-[#173b2c] text-white hover:bg-[#102a1f]"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Adicionar Cartão
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Excluir cartão de crédito?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Todas as faturas e compras vinculadas a este cartão serão removidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-lg"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteCardId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="text-xs rounded-lg bg-destructive hover:bg-destructive/90 text-white"
              onClick={async () => {
                if (deleteCardId) {
                  if (!useDemo) await remove(deleteCardId);
                  toast.success("Cartão excluído com sucesso!");
                }
                setDeleteDialogOpen(false);
                setDeleteCardId(null);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Bill Modal */}
      <PayBillModal
        open={payBillOpen}
        onOpenChange={(o) => {
          setPayBillOpen(o);
          if (!o) setPayingBill(null);
        }}
        bill={payingBill}
        cardName={cards.find((c: any) => c.id === payingBill?.credit_card_id)?.name}
        onPaid={() => {
          refetchCards();
          refetchAccounts();
        }}
      />

      {/* Add Purchase / Installments Modal */}
      <AddCreditPurchaseModal
        open={addPurchaseOpen}
        onOpenChange={setAddPurchaseOpen}
        cards={cards}
        defaultCardId={selectedCardForPurchase}
        onSuccess={() => {
          refetchCards();
        }}
      />
    </DashboardLayout>
  );
}
