import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useCategories, useTransactions } from "@/hooks/use-supabase";
import { parseBRLAmount } from "@/lib/utils";
import { toast } from "sonner";
import { CreditCard, Calendar, Tag, ShoppingBag, Layers } from "lucide-react";

interface AddCreditPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: any[];
  defaultCardId?: string;
  onSuccess?: () => void;
}

export function AddCreditPurchaseModal({
  open,
  onOpenChange,
  cards,
  defaultCardId,
  onSuccess,
}: AddCreditPurchaseModalProps) {
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const { createInstallments, create: createTransaction } = useTransactions();

  const [cardId, setCardId] = useState(defaultCardId || (cards[0]?.id ?? ""));
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (defaultCardId) setCardId(defaultCardId);
    else if (cards.length > 0 && !cardId) setCardId(cards[0].id);
  }, [defaultCardId, cards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId) {
      toast.error("Selecione o cartão de crédito.");
      return;
    }
    if (!categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }
    const totalAmount = parseBRLAmount(amountStr);
    if (totalAmount <= 0) {
      toast.error("Insira um valor válido maior que zero.");
      return;
    }

    setIsSubmitting(true);
    const count = parseInt(installmentsCount) || 1;

    try {
      if (!user?.is_anonymous) {
        if (count > 1) {
          // Purchase with installments across upcoming months
          await createInstallments({
            creditCardId: cardId,
            categoryId,
            total: totalAmount,
            count,
            purchaseDate,
            description: description.trim() || undefined,
          });
          toast.success(
            `Compra de ${totalAmount.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })} parcelada em ${count}x adicionada com sucesso!`
          );
        } else {
          // Single credit card purchase
          await createTransaction({
            category_id: categoryId,
            amount: totalAmount,
            date: purchaseDate,
            type: "expense",
            description: description.trim() || "Compra no Cartão",
            is_fixed: false,
            is_credit_card: true,
            credit_card_id: cardId,
            payment_method: "Cartão",
          });
          toast.success("Compra no cartão adicionada com sucesso!");
        }
      } else {
        toast.info("Modo demonstração não altera dados reais.");
      }

      if (onSuccess) onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error("Erro ao adicionar compra no cartão:", err);
      toast.error("Erro ao adicionar compra: " + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setAmountStr("");
    setInstallmentsCount("1");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl border-border/80 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Nova Compra no Cartão
              </DialogTitle>
              <DialogDescription className="text-xs">
                Registre uma compra à vista ou parcelada nos próximos meses
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Card Select */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-primary" /> Cartão de Crédito *
            </label>
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger className="text-xs h-10 rounded-xl">
                <SelectValue placeholder="Selecione o cartão" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name} (Disp: R$ {(c.available ?? c.limit).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Descrição da Compra
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Notebook, Supermercado, Passagem"
              className="text-xs h-10 rounded-xl"
            />
          </div>

          {/* Amount & Installments */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Valor Total (R$) *
              </label>
              <BRLCurrencyInput
                value={amountStr}
                onChangeValue={setAmountStr}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" /> Parcelas
              </label>
              <Select
                value={installmentsCount}
                onValueChange={setInstallmentsCount}
              >
                <SelectTrigger className="text-xs h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  <SelectItem value="1" className="text-xs">
                    À vista (1x)
                  </SelectItem>
                  {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-xs">
                      {n}x sem juros
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Data da Compra
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-primary" /> Categoria *
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="text-xs h-10 rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs rounded-xl font-bold bg-[#173b2c] text-white hover:bg-[#102a1f]"
            >
              Adicionar Compra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
