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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import { useAccounts, useTransactions, useCategories } from "@/hooks/use-supabase";
import { parseBRLAmount } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeftRight, Landmark, Calendar, FileText, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { demoAccounts } from "@/lib/demo-data";
import { supabase } from "@/lib/supabase";

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TransferModal({
  open,
  onOpenChange,
  onSuccess,
}: TransferModalProps) {
  const { user } = useAuth();
  const useDemo = !!user?.is_anonymous;

  const { data: realAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: categories } = useCategories();
  const { create: createTransaction } = useTransactions();

  const accounts = useDemo ? demoAccounts : (realAccounts ?? []);

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [description, setDescription] = useState("");
  const [dateStr, setDateStr] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (accounts.length >= 2) {
      if (!fromAccountId) setFromAccountId(accounts[0].id);
      if (!toAccountId) setToAccountId(accounts[1].id);
    } else if (accounts.length === 1) {
      if (!fromAccountId) setFromAccountId(accounts[0].id);
    }
  }, [accounts, fromAccountId, toAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      toast.error("Selecione a conta de origem e a conta de destino.");
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error("A conta de destino deve ser diferente da conta de origem.");
      return;
    }

    const amount = parseBRLAmount(amountStr);
    if (amount <= 0) {
      toast.error("Informe um valor de transferência válido maior que zero.");
      return;
    }

    const fromAcc = accounts.find((a: any) => a.id === fromAccountId);
    const toAcc = accounts.find((a: any) => a.id === toAccountId);

    if (!fromAcc || !toAcc) {
      toast.error("Conta não encontrada.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!useDemo) {
        const expenseCatId =
          categories?.find((c: any) => c.type === "expense")?.id ||
          categories?.[0]?.id ||
          "";
        const incomeCatId =
          categories?.find((c: any) => c.type === "income")?.id ||
          categories?.[0]?.id ||
          "";

        // 1. Registra saída da conta de origem (createTransaction já ajusta o saldo via adjustAccountBalance no banco)
        await createTransaction({
          account_id: fromAcc.id,
          type: "expense",
          amount: amount,
          date: dateStr,
          description: description.trim()
            ? `Transferência p/ ${toAcc.name}: ${description.trim()}`
            : `Transferência para ${toAcc.name}`,
          category_id: expenseCatId,
          payment_method: "pix",
          is_fixed: false,
          is_credit_card: false,
          credit_card_id: null,
        });

        // 2. Registra entrada na conta de destino (createTransaction já ajusta o saldo via adjustAccountBalance no banco)
        await createTransaction({
          account_id: toAcc.id,
          type: "income",
          amount: amount,
          date: dateStr,
          description: description.trim()
            ? `Transferência rcbda de ${fromAcc.name}: ${description.trim()}`
            : `Transferência recebida de ${fromAcc.name}`,
          category_id: incomeCatId,
          payment_method: "pix",
          is_fixed: false,
          is_credit_card: false,
          credit_card_id: null,
        });

        await refetchAccounts();
      } else {
        // Modo Demonstração: atualiza os saldos em memória
        fromAcc.balance = Number(fromAcc.balance) - amount;
        toAcc.balance = Number(toAcc.balance) + amount;
      }

      toast.success(
        `Transferência de ${amount.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })} realizada de "${fromAcc.name}" para "${toAcc.name}"!`
      );

      setAmountStr("");
      setDescription("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Erro ao realizar transferência entre contas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-5 sm:p-6 rounded-3xl border-border/80 shadow-2xl bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Transferência Entre Contas
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mova saldo entre suas contas bancárias instantaneamente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Origem e Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-secondary/40 border border-border/60">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                De (Conta Origem)
              </label>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger className="text-xs h-9 rounded-xl bg-background border-border">
                  <SelectValue placeholder="Selecione origem" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a: any) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.name} ({Number(a.balance).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Para (Conta Destino)
              </label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger className="text-xs h-9 rounded-xl bg-background border-border">
                  <SelectValue placeholder="Selecione destino" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a: any) => a.id !== fromAccountId)
                    .map((a: any) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.name} ({Number(a.balance).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
              Valor da Transferência (R$) *
            </label>
            <BRLCurrencyInput
              value={amountStr}
              onChangeValue={setAmountStr}
              placeholder="R$ 0,00"
            />
          </div>

          {/* Data e Descrição */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                Data *
              </label>
              <Input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="text-xs h-10 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                Observação (Opcional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Resgate poupança"
                className="text-xs h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 font-bold text-xs bg-[#173b2c] hover:bg-[#102a1f] text-white rounded-2xl shadow-md"
            >
              {isSubmitting ? "Transferindo..." : "Confirmar Transferência"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
