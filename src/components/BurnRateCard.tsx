import React from "react";
import { motion } from "framer-motion";
import { Gauge, AlertTriangle, CheckCircle2, TrendingUp, Calendar, Zap } from "lucide-react";

interface BurnRateCardProps {
  totalIncome: number;
  totalExpenses: number;
  selectedMonth: string; // "YYYY-MM"
}

export function BurnRateCard({
  totalIncome,
  totalExpenses,
  selectedMonth,
}: BurnRateCardProps) {
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month;

  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const currentDay = isCurrentMonth
    ? now.getDate()
    : now > new Date(year, month - 1, totalDaysInMonth)
    ? totalDaysInMonth
    : 1;

  const timeElapsedRatio = currentDay / totalDaysInMonth; // e.g. 0.5 for day 15/30
  const spendingRatio = totalIncome > 0 ? totalExpenses / totalIncome : 0;

  const dailyAvgSpent = currentDay > 0 ? totalExpenses / currentDay : 0;
  const remainingIncome = Math.max(0, totalIncome - totalExpenses);
  const remainingDays = Math.max(1, totalDaysInMonth - currentDay);
  const maxSafeDailySpending = remainingIncome / remainingDays;

  // Pace Status
  let paceStatus: "safe" | "warning" | "danger" = "safe";
  let paceTitle = "Ritmo Controlado e Seguro";
  let paceDescription = `Você está gastando em média ${dailyAvgSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/dia. Seu orçamento está protegido.`;
  let projectedDepletionDay: number | null = null;

  if (spendingRatio > 1) {
    paceStatus = "danger";
    paceTitle = "Orçamento Ultrapassado!";
    paceDescription = `Seus gastos já superaram sua receita do mês em ${(totalExpenses - totalIncome).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`;
  } else if (spendingRatio > timeElapsedRatio + 0.12 && totalIncome > 0) {
    paceStatus = "danger";
    paceTitle = "Ritmo Acelerado de Gastos";
    // Project when money runs out at current daily pace
    projectedDepletionDay = Math.min(
      totalDaysInMonth,
      Math.floor(totalIncome / (dailyAvgSpent || 1))
    );
    paceDescription = `No ritmo atual (${dailyAvgSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/dia), o orçamento total do mês poderá se esgotar por volta do dia ${projectedDepletionDay}.`;
  } else if (spendingRatio > timeElapsedRatio && totalIncome > 0) {
    paceStatus = "warning";
    paceTitle = "Atenção ao Ritmo de Gastos";
    paceDescription = `Seus gastos estão ligeiramente acima da proporção de dias passados (${Math.round(timeElapsedRatio * 100)}% do mês decorrido).`;
  }

  const getTheme = () => {
    switch (paceStatus) {
      case "danger":
        return {
          bg: "bg-rose-500/10 dark:bg-rose-500/15",
          border: "border-rose-500/30",
          text: "text-rose-900 dark:text-rose-200",
          iconBg: "bg-rose-500/20 text-rose-600 dark:text-rose-400",
          barColor: "bg-rose-500",
          badgeBg: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
          badgeText: "Acelerado",
        };
      case "warning":
        return {
          bg: "bg-amber-500/10 dark:bg-amber-500/15",
          border: "border-amber-500/30",
          text: "text-amber-900 dark:text-amber-200",
          iconBg: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
          barColor: "bg-amber-500",
          badgeBg: "bg-amber-500/20 text-amber-800 dark:text-amber-200",
          badgeText: "Atenção",
        };
      default:
        return {
          bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
          border: "border-emerald-500/30",
          text: "text-emerald-900 dark:text-emerald-200",
          iconBg: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          barColor: "bg-emerald-500",
          badgeBg: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200",
          badgeText: "Controlado",
        };
    }
  };

  const theme = getTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${theme.border} ${theme.bg} p-4 sm:p-5 shadow-xs space-y-4`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold ${theme.text}`}>{paceTitle}</h3>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${theme.badgeBg}`}>
                {theme.badgeText}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {paceDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Comparison Bars */}
      <div className="space-y-2 pt-1">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-primary" /> Tempo decorrido do mês (Dia {currentDay} de {totalDaysInMonth})
            </span>
            <span className="font-mono font-bold text-foreground">{Math.round(timeElapsedRatio * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, timeElapsedRatio * 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Renda/Orçamento comprometido
            </span>
            <span className="font-mono font-bold text-foreground">{Math.round(spendingRatio * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden">
            <div
              className={`h-full ${theme.barColor} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, spendingRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary Pill Box */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="p-2.5 rounded-xl bg-card border border-border/60">
          <span className="text-[10px] font-semibold text-muted-foreground block uppercase">Média Gasta/Dia</span>
          <span className="text-xs font-bold font-mono tracking-tight text-foreground">
            {dailyAvgSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-card border border-border/60">
          <span className="text-[10px] font-semibold text-muted-foreground block uppercase">Limite Seguro p/ Dia Restante</span>
          <span className={`text-xs font-bold font-mono tracking-tight ${maxSafeDailySpending > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
            {maxSafeDailySpending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-card border border-border/60 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-semibold text-muted-foreground block uppercase">Dias Restantes no Mês</span>
          <span className="text-xs font-bold font-mono tracking-tight text-foreground">
            {remainingDays} dias
          </span>
        </div>
      </div>
    </motion.div>
  );
}
