import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import { useAuth } from "@/hooks/use-auth";
import {
  useTransactions,
  useCreditCards,
  useCategories,
} from "@/hooks/use-supabase";
import { parseBRLAmount } from "@/lib/utils";
import { addMonthsYm, ymParts, ym } from "@/lib/credit-card";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

interface PurchaseSimulatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseSimulatorModal({
  open,
  onOpenChange,
}: PurchaseSimulatorModalProps) {
  const { user } = useAuth();
  const { data: allTransactions, createInstallments, create: createTransaction } = useTransactions();
  const { data: creditCards } = useCreditCards();
  const { data: categories } = useCategories();

  const now = new Date();
  const currentMonthYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [title, setTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"installment" | "cash">("installment");
  const [installmentsCount, setInstallmentsCount] = useState("10");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [startMonth, setStartMonth] = useState(currentMonthYm);
  const [isApplying, setIsApplying] = useState(false);

  React.useEffect(() => {
    if (creditCards.length > 0 && !selectedCardId) {
      setSelectedCardId(creditCards[0].id);
    }
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [creditCards, categories, selectedCardId, selectedCategoryId]);

  const totalAmount = parseBRLAmount(amountStr);
  const count = parseInt(installmentsCount) || 1;
  const installmentVal = totalAmount > 0 ? totalAmount / count : 0;

  // Compute fixed monthly income & expenses from active fixed transactions
  const fixedIncome = (allTransactions ?? [])
    .filter((t) => t.is_fixed && t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const fixedExpenses = (allTransactions ?? [])
    .filter((t) => t.is_fixed && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // Generate 6 upcoming months for simulation preview
  const simulationMonths = Array.from({ length: 6 }, (_, i) => addMonthsYm(startMonth, i));

  const monthlyImpacts = simulationMonths.map((m) => {
    // Existing card bills for month `m`
    const existingCardBills = creditCards.reduce((sum, card) => {
      const b = (card.bills ?? []).find((bill: any) => bill.month === m);
      if (!b) return sum;
      return sum + Math.max(0, Number(b.total_amount) + Number(b.rollover_amount ?? 0) - Number(b.paid_amount ?? 0));
    }, 0);

    const baseExpenses = fixedExpenses + existingCardBills;
    const marginBefore = fixedIncome - baseExpenses;

    const addedInstallment = paymentMethod === "installment" ? installmentVal : m === startMonth ? totalAmount : 0;
    const marginAfter = marginBefore - addedInstallment;

    return {
      month: m,
      label: new Date(m + "-01T12:00:00").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      baseExpenses,
      marginBefore,
      addedInstallment,
      marginAfter,
    };
  });

  const minMarginAfter = Math.min(...monthlyImpacts.map((i) => i.marginAfter));
  const isDeficit = minMarginAfter < 0;
  const isWarning = minMarginAfter >= 0 && minMarginAfter < 200;

  const handleApplyPurchase = async () => {
    if (!user) return;
    if (totalAmount <= 0) {
      toast.error("Informe um valor válido para a compra.");
      return;
    }
    if (paymentMethod === "installment" && !selectedCardId) {
      toast.error("Selecione um cartão de crédito.");
      return;
    }
    if (!selectedCategoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }

    setIsApplying(true);
    try {
      if (!user.is_anonymous) {
        const purchaseDate = `${startMonth}-05`;
        if (paymentMethod === "installment" && count > 1) {
          await createInstallments({
            creditCardId: selectedCardId,
            categoryId: selectedCategoryId,
            total: totalAmount,
            count,
            purchaseDate,
            description: title.trim() || "Compra Simulada",
          });
        } else {
          await createTransaction({
            category_id: selectedCategoryId,
            amount: totalAmount,
            date: purchaseDate,
            type: "expense",
            description: title.trim() || "Compra Simulada",
            is_fixed: false,
            is_credit_card: paymentMethod === "installment",
            credit_card_id: paymentMethod === "installment" ? selectedCardId : null,
            payment_method: paymentMethod === "installment" ? "Cartão" : "PIX",
          });
        }
        toast.success("Compra efetivada com sucesso no Zenfi!");
      } else {
        toast.info("Modo demonstração não altera dados.");
      }
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error("Erro ao efetivar compra:", err);
      toast.error("Erro ao efetivar compra: " + (err?.message || err));
    } finally {
      setIsApplying(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setAmountStr("");
    setInstallmentsCount("10");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 rounded-3xl overflow-hidden border-border/80 shadow-2xl bg-card">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#173b2c] to-emerald-900 p-5 text-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-lime-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" /> Simulador de Compras
            </span>
            <span className="text-[10px] text-white/70">Análise de Impacto Futuro</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Simular Compra & Impacto no Orçamento
          </h2>
          <p className="text-xs text-white/80 mt-1">
            Veja exatamente quanto você pagará nos próximos meses antes de tomar uma decisão.
          </p>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Inputs Section */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Nome do Item / Compra
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Celular Novo, Viagem, Notebook"
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Valor Total (R$) *
                </label>
                <BRLCurrencyInput
                  value={amountStr}
                  onChangeValue={setAmountStr}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Forma de Pagamento
                </label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v: any) => setPaymentMethod(v)}
                >
                  <SelectTrigger className="text-xs h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installment" className="text-xs">
                      Parcelado no Cartão
                    </SelectItem>
                    <SelectItem value="cash" className="text-xs">
                      À vista (Débito/PIX)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {paymentMethod === "installment" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Número de Parcelas
                  </label>
                  <Select
                    value={installmentsCount}
                    onValueChange={setInstallmentsCount}
                  >
                    <SelectTrigger className="text-xs h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-40">
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)} className="text-xs">
                          {n}x de R$ {(totalAmount > 0 ? totalAmount / n : 0).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Cartão de Crédito
                  </label>
                  <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                    <SelectTrigger className="text-xs h-9 rounded-xl">
                      <SelectValue placeholder="Selecione o cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditCards.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Simulation Result Header Card */}
          {totalAmount > 0 && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isDeficit
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200"
                  : isWarning
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {isDeficit ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <h4 className="text-xs font-bold tracking-tight">
                  {isDeficit
                    ? "Risco de Orçamento Negativo"
                    : isWarning
                    ? "Atenção à Margem de Segurança"
                    : "Compra Viável e Segura!"}
                </h4>
              </div>

              <p className="text-[11px] leading-relaxed opacity-90">
                {isDeficit
                  ? `Esta parcela de R$ ${installmentVal.toFixed(2)} deixará sua sobra mensal negativa em alguns dos próximos meses.`
                  : isWarning
                  ? `A parcela de R$ ${installmentVal.toFixed(2)} reduz sua sobra mensal para próximo do limite seguro.`
                  : `A parcela de R$ ${installmentVal.toFixed(2)} cabe confortavelmente na sua receita fixa de R$ ${fixedIncome.toFixed(2)}.`}
              </p>
            </div>
          )}

          {/* Month by Month Breakdown Table */}
          {totalAmount > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Impacto Mês a Mês (Próximos 6 Meses)
              </label>

              <div className="rounded-2xl border divide-y overflow-hidden text-xs bg-card">
                {monthlyImpacts.map((imp) => (
                  <div key={imp.month} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground capitalize block">
                        {imp.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Parcela: R$ {imp.addedInstallment.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[11px] text-muted-foreground line-through">
                          R$ {imp.marginBefore.toFixed(2)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span
                          className={`font-bold tabular-nums ${
                            imp.marginAfter < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          R$ {imp.marginAfter.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground block">
                        {imp.marginAfter >= 0 ? "Sombra Livre Disponível" : "Déficit Mensal"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply Purchase Action Button */}
          {totalAmount > 0 && (
            <Button
              onClick={handleApplyPurchase}
              disabled={isApplying}
              className="w-full h-11 rounded-2xl bg-[#173b2c] hover:bg-[#102a1f] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Efetivar esta Compra no Sistema</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
