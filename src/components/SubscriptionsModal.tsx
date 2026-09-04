import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import {
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Calendar,
  Tag,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { parseBRLAmount } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-supabase";

interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  active: boolean;
}

const DEFAULT_SUBSCRIPTIONS: SubscriptionItem[] = [
  { id: "1", name: "Aluguel / Condomínio", amount: 1500, dueDay: 5, category: "Moradia", active: true },
  { id: "2", name: "Internet Banda Larga", amount: 120, dueDay: 10, category: "Contas", active: true },
  { id: "3", name: "Netflix / Streaming", amount: 55.90, dueDay: 15, category: "Lazer", active: true },
  { id: "4", name: "Academia", amount: 110, dueDay: 20, category: "Saúde", active: true },
  { id: "5", name: "Spotify Premium", amount: 21.90, dueDay: 25, category: "Lazer", active: true },
];

interface SubscriptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionsModal({
  open,
  onOpenChange,
}: SubscriptionsModalProps) {
  const { create: createTransaction } = useTransactions();
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zenfi_subscriptions");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_SUBSCRIPTIONS;
        }
      }
    }
    return DEFAULT_SUBSCRIPTIONS;
  });

  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDay, setNewDueDay] = useState("10");
  const [newCategory, setNewCategory] = useState("Assinaturas");

  useEffect(() => {
    localStorage.setItem("zenfi_subscriptions", JSON.stringify(subscriptions));
  }, [subscriptions]);

  const totalMonthly = subscriptions
    .filter((s) => s.active)
    .reduce((s, item) => s + item.amount, 0);

  const totalAnnual = totalMonthly * 12;

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseBRLAmount(newAmount);
    if (!newName.trim() || numAmount <= 0) {
      toast.error("Preencha o nome e o valor da assinatura!");
      return;
    }

    const newItem: SubscriptionItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      amount: numAmount,
      dueDay: parseInt(newDueDay, 10) || 1,
      category: newCategory,
      active: true,
    };

    setSubscriptions((prev) => [...prev, newItem]);
    setNewName("");
    setNewAmount("");
    toast.success("Assinatura cadastrada!");
  };

  const handleToggleActive = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Assinatura removida!");
  };

  const handleRegisterAsTransaction = async (item: SubscriptionItem) => {
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(item.dueDay).padStart(2, "0")}`;

      await createTransaction({
        type: "expense",
        amount: item.amount,
        description: `Recorrência: ${item.name}`,
        date: dateStr,
        category_id: "",
        payment_method: "pix",
        is_fixed: true,
        is_credit_card: false,
        credit_card_id: null,
      });

      toast.success(`Despesa "${item.name}" lançada no mês atual com sucesso!`);
    } catch {
      toast.error("Erro ao registrar transação!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-5 sm:p-6 rounded-3xl border-border/80 shadow-2xl bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Gestor de Assinaturas & Recorrências
              </DialogTitle>
              <DialogDescription className="text-xs">
                Controle de custos fixos mensais e projeção de assinaturas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Summary Card Banner */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-secondary/50 border border-border/60">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total Fixo Mensal
            </span>
            <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
              {totalMonthly.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Projeção Anual Total
            </span>
            <span className="text-lg font-bold font-mono text-foreground">
              {totalAnnual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>

        {/* Form to Add New Subscription */}
        <form onSubmit={handleAddSubscription} className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Nova Assinatura / Recorrência
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Netflix, Academia, Aluguel"
              className="text-xs h-9 rounded-xl"
            />
            <BRLCurrencyInput
              value={newAmount}
              onChangeValue={setNewAmount}
              placeholder="R$ 0,00"
            />
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={31}
              value={newDueDay}
              onChange={(e) => setNewDueDay(e.target.value)}
              placeholder="Dia de Vencimento (1-31)"
              className="text-xs h-9 rounded-xl w-32"
            />
            <Button
              type="submit"
              className="h-9 px-4 text-xs font-bold bg-[#173b2c] hover:bg-[#102a1f] text-white rounded-xl ml-auto shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </form>

        {/* Subscriptions List */}
        <div className="space-y-2 pt-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Minhas Assinaturas Ativas ({subscriptions.length})
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {subscriptions.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  item.active
                    ? "bg-card border-border/60"
                    : "bg-secondary/30 border-border/30 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item.id)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      item.active
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/80"
                    }`}
                  >
                    {item.active && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground truncate block">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Vence todo dia {item.dueDay} · {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                    {item.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegisterAsTransaction(item)}
                    className="h-7 px-2 text-[10px] font-semibold rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                    title="Lançar como despesa no mês"
                  >
                    Lançar Mês
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
