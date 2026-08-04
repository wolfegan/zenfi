import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import {
  useCategories,
  useAccounts,
  useCreditCards,
  useTransactions,
  useMonthlySummary,
} from "@/hooks/use-supabase";
import { useAuth } from "@/hooks/use-auth";
import { parseBRLAmount, formatCurrencyInput, getCategoryIcon } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { BankLogo } from "@/components/BankLogo";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Plus,
} from "lucide-react";
import { demoCategories, demoAccounts, demoCreditCards } from "@/lib/demo-data";

interface QuickTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickTransactionModal({
  open,
  onOpenChange,
}: QuickTransactionModalProps) {
  const { user } = useAuth();
  const { data: realCategories } = useCategories();
  const { data: realAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: realCreditCards } = useCreditCards();
  const { create: createTransaction } = useTransactions();

  const useDemo = !!user?.is_anonymous;
  const categories = useDemo ? demoCategories : (realCategories || []);
  const accounts = useDemo ? demoAccounts : (realAccounts || []);
  const creditCards = useDemo ? demoCreditCards : (realCreditCards || []);

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [creditCardId, setCreditCardId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCategoryId("");
    setPaymentMethod("pix");
    setCreditCardId("");
    setAccountId("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) {
      toast.error("Por favor, preencha o valor e a categoria.");
      return;
    }

    const numAmount = parseBRLAmount(amount);
    if (numAmount <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }

    setSubmitting(true);
    try {
      if (user && !user.is_anonymous) {
        const isCreditCard = type === "expense" && paymentMethod === "credit_card";

        if (!isCreditCard && accountId) {
          const selectedAcc = accounts.find((a: any) => a.id === accountId);
          if (selectedAcc) {
            const newBalance =
              type === "income"
                ? selectedAcc.balance + numAmount
                : selectedAcc.balance - numAmount;
            await supabase
              .from("accounts")
              .update({ balance: newBalance })
              .eq("id", selectedAcc.id);
          }
        }

        await createTransaction({
          category_id: categoryId,
          amount: numAmount,
          date,
          type,
          description: description.trim() || null,
          is_fixed: false,
          is_credit_card: isCreditCard,
          credit_card_id: isCreditCard && creditCardId ? creditCardId : null,
        });

        toast.success("Transação registrada com sucesso!");
        await refetchAccounts();
      } else {
        toast.info("Transação simulada no modo de demonstração.");
      }

      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar transação.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-5 rounded-2xl">
        <DialogHeader className="pb-2 border-b border-border/50">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </span>
            Nova Transação Rápida
          </DialogTitle>
          <DialogDescription className="text-xs">
            Registre entradas ou saídas de forma simples e rápida.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tipo: Saída vs Entrada */}
          <div className="flex gap-2 p-1 bg-secondary/60 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setCategoryId("");
                setPaymentMethod("pix");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === "expense"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              Saída (Despesa)
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income");
                setCategoryId("");
                setPaymentMethod("pix");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === "income"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Entrada (Receita)
            </button>
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Valor *
            </label>
            <BRLCurrencyInput
              value={amount}
              onChangeValue={setAmount}
              placeholder="R$ 0,00"
              autoFocus
              className="text-lg font-bold h-11 rounded-xl"
            />
          </div>

          {/* Categoria & Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Categoria *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full text-xs h-9 px-2.5 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecione...</option>
                {categories
                  .filter((c: any) => c.type === type)
                  .map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs h-9 px-2.5 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Descrição (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Mercado, combustível, café..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs h-9 px-3 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(type === "expense"
                ? [
                    { value: "credit_card", label: "Cartão", icon: CreditCard, color: "#8b5cf6" },
                    { value: "pix", label: "PIX", icon: Smartphone, color: "#22c55e" },
                    { value: "cash", label: "Dinheiro", icon: Banknote, color: "#f97316" },
                    { value: "debit", label: "Débito", icon: Building2, color: "#3b82f6" },
                  ]
                : [
                    { value: "pix", label: "PIX", icon: Smartphone, color: "#22c55e" },
                    { value: "cash", label: "Dinheiro", icon: Banknote, color: "#f97316" },
                  ]
              ).map((opt) => {
                const Icon = opt.icon;
                const selected = paymentMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                      selected
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" style={{ color: selected ? opt.color : undefined }} />
                    <span className="text-[10px] leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção de Cartão de Crédito */}
          {type === "expense" && paymentMethod === "credit_card" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Selecionar Cartão de Crédito
              </label>
              {creditCards && creditCards.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                  {creditCards.map((card: any) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setCreditCardId(card.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        creditCardId === card.id
                          ? "border-primary bg-primary/10 font-semibold"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: card.color || "#8b5cf6" }}
                      >
                        <BankLogo bankKeyOrName={card.name} className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs truncate">{card.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-xl">
                  Nenhum cartão cadastrado.
                </p>
              )}
            </div>
          )}

          {/* Seleção de Conta Bancária */}
          {paymentMethod !== "credit_card" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Debitar/Creditar da Conta
              </label>
              {accounts && accounts.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                  {accounts.map((acc: any) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        accountId === acc.id
                          ? "border-primary bg-primary/10 font-semibold"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: acc.color || "#6366f1" }}
                      >
                        <BankLogo bankKeyOrName={acc.name} type={acc.type} className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs truncate">{acc.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-xl">
                  Nenhuma conta cadastrada.
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting || !categoryId || !amount}
            className="w-full h-10 rounded-xl font-bold mt-2"
          >
            {submitting ? "Salvação..." : "Confirmar Transação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
