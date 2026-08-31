import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BRLCurrencyInput } from "@/components/ui/BRLCurrencyInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreditCards,
  useAccounts,
  useCategories,
  useTransactions,
  billOutstanding,
} from "@/hooks/use-supabase";
import { parseBRLAmount, formatCurrencyInput, formatCurrency } from "@/lib/utils";

interface PayBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A fatura a ser paga (linha de credit_card_bills). */
  bill: any | null;
  cardName?: string;
  onPaid?: () => void;
}

export function PayBillModal({
  open,
  onOpenChange,
  bill,
  cardName,
  onPaid,
}: PayBillModalProps) {
  const { payBill, refetch: refetchCards } = useCreditCards();
  const { data: accounts, refetch: refetchAccounts } = useAccounts();
  const { data: categories } = useCategories();
  const { create: createTx } = useTransactions();

  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const outstanding = bill ? billOutstanding(bill) : 0;

  useEffect(() => {
    if (open && bill) {
      setAmount(formatCurrencyInput(billOutstanding(bill)));
      setAccountId((prev) => prev || accounts[0]?.id || "");
    }
  }, [open, bill, accounts]);

  const handlePay = async () => {
    if (!bill || !accountId) return;
    const payAmount = parseBRLAmount(amount);
    if (payAmount <= 0) return;
    setSubmitting(true);
    try {
      const acc = accounts.find((a: any) => a.id === accountId);
      const expenseCat =
        categories.find(
          (c: any) =>
            c.name.toLowerCase().includes("outros") ||
            c.name.toLowerCase().includes("fatura"),
        ) || categories.find((c: any) => c.type === "expense");
      const monthLabel = new Date(
        bill.month + "-01T12:00:00",
      ).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

      await createTx({
        category_id: expenseCat ? expenseCat.id : null,
        type: "expense",
        amount: payAmount,
        description: `[Fatura] ${cardName || "Cartão"} - ${monthLabel}`,
        date: new Date().toISOString().split("T")[0],
        is_fixed: false,
        is_credit_card: false,
        credit_card_id: null,
        account_id: acc?.id ?? null,
        payment_method: "Pagamento de fatura",
      } as any);
      await payBill(bill.id, payAmount);

      await Promise.all([refetchCards(), refetchAccounts()]);
      toast.success("Pagamento de fatura registrado!");
      onPaid?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao processar pagamento: " + (e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Pagar Fatura de Cartão
          </DialogTitle>
          <DialogDescription className="text-xs">
            Selecione de qual conta o dinheiro deve ser debitado.
          </DialogDescription>
        </DialogHeader>

        {bill && (
          <div className="space-y-4 py-2">
            <div className="bg-secondary/30 rounded-xl px-3 py-2 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span>Cartão</span>
                <span className="font-semibold text-foreground">
                  {cardName || "Cartão"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Mês da Fatura</span>
                <span className="text-muted-foreground">
                  {new Date(bill.month + "-01T12:00:00").toLocaleDateString(
                    "pt-BR",
                    { month: "long", year: "numeric" },
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between font-semibold border-t pt-1.5 mt-1.5">
                <span>Em aberto</span>
                <span className="text-destructive">
                  {formatCurrency(outstanding)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Valor a pagar *
              </label>
              <BRLCurrencyInput
                value={amount}
                onChangeValue={setAmount}
                placeholder="R$ 0,00"
                className="h-9 text-xs rounded-lg"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Pague o total ou um valor parcial (o restante continua ocupando
                o limite).
              </p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Conta Bancária *
              </label>
              {accounts.length > 0 ? (
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="text-xs h-9 rounded-lg">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} (Saldo: {formatCurrency(acc.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-[10px] text-destructive font-medium">
                  Nenhuma conta bancária cadastrada para débito. Cadastre uma
                  conta primeiro.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="text-xs rounded-lg"
            disabled={
              submitting || !accountId || parseBRLAmount(amount) <= 0
            }
            onClick={handlePay}
          >
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
