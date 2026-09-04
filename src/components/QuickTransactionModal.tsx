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
} from "@/hooks/use-supabase";
import { useAuth } from "@/hooks/use-auth";
import { parseBRLAmount } from "@/lib/utils";
import { BankLogo } from "@/components/BankLogo";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  CreditCard,
  Gift,
  Smartphone,
  Banknote,
  Building2,
  Plus,
} from "lucide-react";
import { demoCategories, demoAccounts, demoCreditCards } from "@/lib/demo-data";
import { isBenefitType } from "@/pages/Accounts";

interface QuickTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function numAmountFor(amountStr: string, n: number): string {
  const val = parseBRLAmount(amountStr);
  if (val <= 0 || n <= 0) return "";
  return (val / n).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function QuickTransactionModal({
  open,
  onOpenChange,
}: QuickTransactionModalProps) {
  const { user } = useAuth();
  const { data: realCategories } = useCategories();
  const { data: realAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: realCreditCards } = useCreditCards();
  const { create: createTransaction, createInstallments } = useTransactions();

  const useDemo = !!user?.is_anonymous;
  const categories = useDemo ? demoCategories : (realCategories || []);
  const accounts = useDemo ? demoAccounts : (realAccounts || []);
  const creditCards = useDemo ? demoCreditCards : (realCreditCards || []);

  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [creditCardId, setCreditCardId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [installments, setInstallments] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCategoryId("");
    setPaymentMethod("pix");
    setCreditCardId("");
    setAccountId("");
    setToAccountId("");
    setInstallments("1");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseBRLAmount(amount);
    if (numAmount <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }

    setSubmitting(true);
    try {
      if (type === "transfer") {
        if (!accountId || !toAccountId) {
          toast.error("Selecione a conta de origem e a conta de destino.");
          setSubmitting(false);
          return;
        }
        if (accountId === toAccountId) {
          toast.error("A conta de destino deve ser diferente da conta de origem.");
          setSubmitting(false);
          return;
        }

        const fromAcc = accounts.find((a: any) => a.id === accountId);
        const toAcc = accounts.find((a: any) => a.id === toAccountId);

        if (!useDemo) {
          const expenseCatId = categories.find((c: any) => c.type === "expense")?.id || categories[0]?.id || "";
          const incomeCatId = categories.find((c: any) => c.type === "income")?.id || categories[0]?.id || "";

          await createTransaction({
            account_id: accountId,
            type: "expense",
            amount: numAmount,
            date,
            description: description.trim() ? `Transferência p/ ${toAcc?.name}: ${description.trim()}` : `Transferência para ${toAcc?.name}`,
            category_id: expenseCatId,
            payment_method: "pix",
            is_fixed: false,
            is_credit_card: false,
            credit_card_id: null,
          });

          await createTransaction({
            account_id: toAccountId,
            type: "income",
            amount: numAmount,
            date,
            description: description.trim() ? `Transferência rcbda de ${fromAcc?.name}: ${description.trim()}` : `Transferência recebida de ${fromAcc?.name}`,
            category_id: incomeCatId,
            payment_method: "pix",
            is_fixed: false,
            is_credit_card: false,
            credit_card_id: null,
          });

          await refetchAccounts();
        }

        toast.success(`Transferência realizada com sucesso!`);
        resetForm();
        onOpenChange(false);
        setSubmitting(false);
        return;
      }

      if (!categoryId) {
        toast.error("Por favor, selecione a categoria.");
        setSubmitting(false);
        return;
      }

      if (user && !user.is_anonymous) {
        const isCreditCard = type === "expense" && paymentMethod === "credit_card";
        const nInstallments = Math.max(1, parseInt(installments) || 1);

        if (isCreditCard && nInstallments > 1) {
          if (!creditCardId) {
            toast.error("Selecione o cartão da compra parcelada.");
            setSubmitting(false);
            return;
          }
          await createInstallments({
            creditCardId,
            categoryId,
            total: numAmount,
            count: nInstallments,
            purchaseDate: date,
            description: description.trim() || null,
          });
          toast.success(`Compra parcelada em ${nInstallments}x registrada!`);
          resetForm();
          onOpenChange(false);
          setSubmitting(false);
          return;
        }

        const selectedAcc = accounts.find((a: any) => a.id === accountId);
        await createTransaction({
          category_id: categoryId,
          amount: numAmount,
          date,
          type,
          description: description.trim() || null,
          is_fixed: false,
          is_credit_card: isCreditCard,
          credit_card_id: isCreditCard && creditCardId ? creditCardId : null,
          account_id: !isCreditCard && selectedAcc ? selectedAcc.id : null,
          payment_method: isCreditCard
            ? "Cartão"
            : paymentMethod === "benefit_card"
              ? "Benefício"
              : paymentMethod === "pix"
                ? "PIX"
                : paymentMethod === "cash"
                  ? "Dinheiro"
                  : paymentMethod === "debit"
                    ? "Débito"
                    : null,
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
            Registre despesas, receitas ou transferências de forma rápida.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tipo: Saída vs Entrada vs Transferência */}
          <div className="flex gap-1.5 p-1 bg-secondary/60 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setCategoryId("");
                setPaymentMethod("pix");
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === "expense"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income");
                setCategoryId("");
                setPaymentMethod("pix");
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === "income"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Receita
            </button>
            <button
              type="button"
              onClick={() => {
                setType("transfer");
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === "transfer"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Transferência
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

          {type === "transfer" ? (
            /* Formulário de Transferência */
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Conta Origem *
                </label>
                {accounts && accounts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                    {accounts.map((acc: any) => {
                      const isBenefit = isBenefitType(acc.type, acc.name);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setAccountId(acc.id);
                            if (toAccountId === acc.id) setToAccountId("");
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                            accountId === acc.id
                              ? "border-cyan-500 bg-cyan-500/10 font-semibold"
                              : "border-border bg-background hover:border-primary/40"
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: acc.color || "#6366f1" }}
                          >
                            <BankLogo bankKeyOrName={acc.name} type={acc.type} className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs truncate">{acc.name}</span>
                              {isBenefit && (
                                <span className="text-[8px] px-1 bg-emerald-500/15 text-emerald-600 rounded font-medium shrink-0">
                                  Benefício
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-xl">
                    Nenhuma conta cadastrada.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Conta Destino *
                </label>
                {accounts && accounts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                    {accounts
                      .filter((acc: any) => acc.id !== accountId)
                      .map((acc: any) => {
                        const isBenefit = isBenefitType(acc.type, acc.name);
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => setToAccountId(acc.id)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                              toAccountId === acc.id
                                ? "border-emerald-500 bg-emerald-500/10 font-semibold"
                                : "border-border bg-background hover:border-primary/40"
                            }`}
                          >
                            <div
                              className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: acc.color || "#6366f1" }}
                            >
                              <BankLogo bankKeyOrName={acc.name} type={acc.type} className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs truncate">{acc.name}</span>
                                {isBenefit && (
                                  <span className="text-[8px] px-1 bg-emerald-500/15 text-emerald-600 rounded font-medium shrink-0">
                                    Benefício
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-xl">
                    Nenhuma conta de destino disponível.
                  </p>
                )}
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

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Transferência de poupança..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            /* Formulário de Despesa/Receita */
            <>
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
                  placeholder="Ex: Mercado, almoço VR, combustível..."
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
                <div className={`grid gap-1.5 ${type === "expense" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2"}`}>
                  {(type === "expense"
                    ? [
                        { value: "credit_card", label: "Cartão", icon: CreditCard, color: "#8b5cf6" },
                        { value: "benefit_card", label: "Benefício", icon: Gift, color: "#10b981" },
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
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border text-center transition-all ${
                          selected
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border bg-background hover:border-primary/40 text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: selected ? opt.color : undefined }} />
                        <span className="text-[9px] leading-tight">{opt.label}</span>
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

                  <div className="mt-2">
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      Parcelas
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-full text-xs h-9 px-2.5 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => {
                        const per = numAmountFor(amount, n);
                        return (
                          <option key={n} value={String(n)}>
                            {n === 1
                              ? "À vista (1x)"
                              : `${n}x${per ? ` de ${per}` : ""}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              {/* Seleção de Conta Bancária ou Cartão Benefício */}
              {paymentMethod !== "credit_card" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Debitar/Creditar da Conta / Cartão Benefício
                  </label>
                  {accounts && accounts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                      {accounts.map((acc: any) => {
                        const isBenefit = isBenefitType(acc.type, acc.name);
                        return (
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
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs truncate">{acc.name}</span>
                                {isBenefit && (
                                  <span className="text-[8px] px-1 bg-emerald-500/15 text-emerald-600 rounded font-medium shrink-0">
                                    Benefício
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-xl">
                      Nenhuma conta cadastrada.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            disabled={submitting || (type !== "transfer" && !categoryId) || !amount}
            className="w-full h-10 rounded-xl font-bold mt-2"
          >
            {submitting ? "Salvando..." : type === "transfer" ? "Confirmar Transferência" : "Confirmar Transação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
