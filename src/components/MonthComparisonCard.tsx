import React from "react";
import { motion } from "framer-motion";
import { useMonthlySummary, useTransactions, useCategories } from "@/hooks/use-supabase";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Scale, Layers } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { demoMonthlySummary, demoCategories } from "@/lib/demo-data";

interface MonthComparisonCardProps {
  selectedMonth: string; // "YYYY-MM"
}

export function MonthComparisonCard({ selectedMonth }: MonthComparisonCardProps) {
  const { user } = useAuth();
  const useDemo = !!user?.is_anonymous;

  // Calculate previous month string
  const [yStr, mStr] = selectedMonth.split("-");
  let year = parseInt(yStr, 10);
  let month = parseInt(mStr, 10);

  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  // Current Month Summary
  const { data: realCurrSummary } = useMonthlySummary(selectedMonth);
  // Previous Month Summary
  const { data: realPrevSummary } = useMonthlySummary(prevMonthStr);

  const currSummary = useDemo ? demoMonthlySummary() : (realCurrSummary ?? { totalIncome: 0, totalExpenses: 0, balance: 0 });
  const prevSummary = useDemo ? { totalIncome: 4200, totalExpenses: 2800, balance: 1400 } : (realPrevSummary ?? { totalIncome: 0, totalExpenses: 0, balance: 0 });

  // Calculations
  const currIncome = currSummary.totalIncome ?? 0;
  const prevIncome = prevSummary.totalIncome ?? 0;
  const incomeDelta = currIncome - prevIncome;
  const incomePct = prevIncome > 0 ? (incomeDelta / prevIncome) * 100 : 0;

  const currExpenses = currSummary.totalExpenses ?? 0;
  const prevExpenses = prevSummary.totalExpenses ?? 0;
  const expenseDelta = currExpenses - prevExpenses;
  const expensePct = prevExpenses > 0 ? (expenseDelta / prevExpenses) * 100 : 0;

  const currMonthLabel = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "short" });
  const prevMonthLabel = new Date(prevYear, prevMonth - 1, 1).toLocaleDateString("pt-BR", { month: "short" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border border-border/60 bg-card shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Comparativo Mês a Mês ({currMonthLabel} vs {prevMonthLabel})
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Variação de despesas e receitas em relação ao mês anterior
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Receita Comparada */}
        <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Receita Total ({currMonthLabel})
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {currIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            <span
              className={`text-xs font-bold flex items-center ${
                incomeDelta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
              }`}
            >
              {incomeDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {incomeDelta >= 0 ? "+" : ""}
              {incomePct.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground block pt-0.5">
            Mês anterior ({prevMonthLabel}): {prevIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>

        {/* Despesa Comparada */}
        <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Despesa Total ({currMonthLabel})
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
              {currExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            <span
              className={`text-xs font-bold flex items-center ${
                expenseDelta <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
              }`}
            >
              {expenseDelta > 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {expenseDelta > 0 ? "+" : ""}
              {expensePct.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground block pt-0.5">
            Mês anterior ({prevMonthLabel}): {prevExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
