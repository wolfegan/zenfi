import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useTransactions,
  useDebts,
  useCreditCards,
  useAccounts,
} from "@/hooks/use-supabase";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  HandCoins,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { demoTransactions, demoDebts, demoCreditCards } from "@/lib/demo-data";

interface FinancialCalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinancialCalendarModal({
  open,
  onOpenChange,
}: FinancialCalendarModalProps) {
  const { user } = useAuth();
  const useDemo = !!user?.is_anonymous;

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  // Supabase Data
  const { data: realTransactions } = useTransactions();
  const { data: realDebts } = useDebts();
  const { data: realCreditCards } = useCreditCards();
  const { data: realAccounts } = useAccounts();

  const transactions = useDemo ? demoTransactions : (realTransactions ?? []);
  const debts = useDemo ? demoDebts : (realDebts ?? []);
  const cards = useDemo ? demoCreditCards : (realCreditCards ?? []);
  const accounts = useDemo ? (demoTransactions as any) : (realAccounts ?? []);

  // Calendar matrix calculations
  const firstDayOfMonthIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0=Sun, 1=Mon...
  const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Aggregate items by day (1..31)
  const itemsByDay = useMemo(() => {
    const map: Record<
      number,
      Array<{
        type: "income" | "expense" | "card_bill" | "debt";
        description: string;
        amount: number;
        status?: string;
      }>
    > = {};

    for (let i = 1; i <= totalDaysInMonth; i++) {
      map[i] = [];
    }

    // 1. Transactions
    (transactions ?? []).forEach((t) => {
      if (!t.date) return;
      const [y, m, d] = t.date.split("-").map(Number);
      if (y === currentYear && m === currentMonth && d >= 1 && d <= totalDaysInMonth) {
        map[d].push({
          type: t.type === "income" ? "income" : "expense",
          description: t.description || "Transação",
          amount: t.amount,
        });
      }
    });

    // 2. Debts due
    (debts ?? []).forEach((d: any) => {
      const debtDay = d.due_date ? parseInt(d.due_date.split("-")[2], 10) : 1;
      if (debtDay >= 1 && debtDay <= totalDaysInMonth) {
        map[debtDay].push({
          type: "debt",
          description: `Vencimento Dívida: ${d.creditor}`,
          amount: d.remaining_amount,
          status: d.is_paid ? "paga" : "pendente",
        });
      }
    });

    // 3. Credit Card Bill due dates
    (cards ?? []).forEach((c: any) => {
      const dueDay = c.due_day ?? c.closing_day;
      if (dueDay && dueDay >= 1 && dueDay <= totalDaysInMonth) {
        const b = (c.bills ?? []).find((bill: any) => bill.month === monthStr);
        const billTotal = b ? Number(b.total_amount) : 0;
        if (billTotal > 0) {
          map[dueDay].push({
            type: "card_bill",
            description: `Fatura Cartão ${c.name}`,
            amount: billTotal,
            status: b?.is_paid ? "paga" : "aberta",
          });
        }
      }
    });

    return map;
  }, [currentYear, currentMonth, totalDaysInMonth, transactions, debts, cards, monthStr]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString(
    "pt-BR",
    { month: "long", year: "numeric" }
  );

  const selectedDayItems = selectedDay ? itemsByDay[selectedDay] || [] : [];
  const selectedDayIncome = selectedDayItems
    .filter((i) => i.type === "income")
    .reduce((s, i) => s + i.amount, 0);
  const selectedDayExpense = selectedDayItems
    .filter((i) => i.type !== "income")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-4 sm:p-6 rounded-3xl border-border/80 shadow-2xl bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Calendário Financeiro Interativo
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Fluxo de caixa e vencimentos dia a dia
                </DialogDescription>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-1.5 bg-secondary/60 p-1 rounded-2xl border border-border/60">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-xl"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-bold capitalize px-2 min-w-[120px] text-center">
                {monthName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-xl"
                onClick={handleNextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center pt-2 pb-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <span>Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Blank padding cells */}
          {Array.from({ length: firstDayOfMonthIndex }).map((_, idx) => (
            <div key={`blank-${idx}`} className="h-14 rounded-2xl bg-secondary/20" />
          ))}

          {/* Day tiles */}
          {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const items = itemsByDay[dayNum] || [];
            const hasIncome = items.some((i) => i.type === "income");
            const hasExpense = items.some((i) => i.type === "expense");
            const hasBill = items.some((i) => i.type === "card_bill" || i.type === "debt");
            const isSelected = selectedDay === dayNum;
            const isToday =
              now.getDate() === dayNum &&
              now.getMonth() + 1 === currentMonth &&
              now.getFullYear() === currentYear;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`h-14 p-1.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                    : isToday
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-border/60 hover:bg-secondary/60 bg-card"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-bold font-mono ${
                      isSelected
                        ? "text-primary"
                        : isToday
                        ? "text-amber-600 dark:text-amber-400 font-extrabold"
                        : "text-foreground"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[9px] font-bold px-1 rounded-full bg-secondary text-muted-foreground">
                      {items.length}
                    </span>
                  )}
                </div>

                {/* Event Dots */}
                <div className="flex items-center gap-1 mt-auto">
                  {hasIncome && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Receita" />
                  )}
                  {hasExpense && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" title="Despesa" />
                  )}
                  {hasBill && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" title="Conta/Cartão" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Details Panel */}
        {selectedDay && (
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-3 mt-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Compromissos do dia {selectedDay} de {monthName}
              </h4>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{selectedDayIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  -{selectedDayExpense.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>

            {selectedDayItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                Nenhuma conta ou movimentação registrada para este dia.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {selectedDayItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-card border border-border/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.type === "income" && (
                        <ArrowUpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      {item.type === "expense" && (
                        <ArrowDownCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      {item.type === "card_bill" && (
                        <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      {item.type === "debt" && (
                        <HandCoins className="w-4 h-4 text-purple-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-medium text-foreground block">
                          {item.description}
                        </span>
                        {item.status && (
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`font-bold font-mono ${
                        item.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {item.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
