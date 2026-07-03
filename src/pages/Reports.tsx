import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useSafeQuery } from "@/hooks/use-safe-query";
import { motion } from "framer-motion";
import { FileText, Download, TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowUp, ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { demoMonthlySummary, demoEvolution, demoCategories, demoTransactions, demoHealthScore } from "@/lib/demo-data";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((row) => headers.map((h) => {
    const val = row[h];
    if (typeof val === "string" && val.includes(",")) return `"${val}"`;
    return val;
  }).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success("Relatório exportado!");
}

export default function Reports() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const realSummary = useSafeQuery(api.transactions.getMonthlySummary, { month: `${selectedYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}` });
  const realEvolution = useSafeQuery(api.transactions.getMonthlyEvolution, { months: 12 });
  const realCategories = useSafeQuery(api.categories.getAll);

  const [useDemo, setUseDemo] = useState(false);
  useEffect(() => {
    if (!isLoading) setUseDemo(realSummary === undefined && realEvolution === undefined);
  }, [isLoading, realSummary, realEvolution]);

  const summary = useDemo ? demoMonthlySummary() : (realSummary ?? undefined);
  const evolution = useDemo ? demoEvolution : (realEvolution ?? []);
  const categories = useDemo ? demoCategories : (realCategories ?? []);

  if (isLoading) return null;
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 2 + i));

  const annualIncome = evolution.reduce((s: number, e: any) => s + e.income, 0);
  const annualExpenses = evolution.reduce((s: number, e: any) => s + e.expenses, 0);
  const annualBalance = annualIncome - annualExpenses;
  const savingsRate = annualIncome > 0 ? (annualBalance / annualIncome) * 100 : 0;

  const handleExportEvolution = () => {
    exportToCSV(evolution.map((e: any) => ({ Mês: e.label, Receitas: e.income, Despesas: e.expenses, Saldo: e.balance })), `evolucao-${selectedYear}.csv`);
  };

  const handleExportTransactions = () => {
    if (useDemo) {
      exportToCSV(demoTransactions.map((t: any) => {
        const cat = demoCategories.find((c) => c._id === t.categoryId);
        return { Data: t.date, Tipo: t.type === "income" ? "Receita" : "Despesa", Categoria: cat?.name || "", Descrição: t.description || "", Valor: t.amount };
      }), `transacoes-${selectedYear}.csv`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {useDemo && <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/50 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-warning" /> Modo demonstração</div>}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight">Relatórios Anuais</h1>
            <p className="text-xs text-muted-foreground mt-1">Visão geral do ano</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs h-9 rounded-sm border bg-background px-3 text-muted-foreground focus:outline-none">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button variant="outline" size="sm" className="text-xs h-9" onClick={handleExportEvolution}>
              <Download className="w-3.5 h-3.5 mr-1.5" />Exportar Evolução
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-9" onClick={handleExportTransactions}>
              <Download className="w-3.5 h-3.5 mr-1.5" />Exportar Transações
            </Button>
          </div>
        </div>

        {/* Annual summary cards */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-sm border bg-card">
            <div className="flex items-center gap-2 mb-2"><ArrowUp className="w-4 h-4 text-success" /><span className="text-xs text-muted-foreground">Receitas Anuais</span></div>
            <p className="text-xl font-light tabular-nums">{annualIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          </div>
          <div className="p-5 rounded-sm border bg-card">
            <div className="flex items-center gap-2 mb-2"><ArrowDown className="w-4 h-4 text-destructive" /><span className="text-xs text-muted-foreground">Despesas Anuais</span></div>
            <p className="text-xl font-light tabular-nums">{annualExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          </div>
          <div className="p-5 rounded-sm border bg-card">
            <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4" /><span className="text-xs text-muted-foreground">Saldo Anual</span></div>
            <p className={`text-xl font-light tabular-nums ${annualBalance >= 0 ? "text-success" : "text-destructive"}`}>{annualBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          </div>
          <div className="p-5 rounded-sm border bg-card">
            <div className="flex items-center gap-2 mb-2"><PiggyBank className="w-4 h-4" /><span className="text-xs text-muted-foreground">Taxa de Economia</span></div>
            <p className={`text-xl font-light tabular-nums ${savingsRate >= 0 ? "text-success" : "text-destructive"}`}>{savingsRate.toFixed(1)}%</p>
          </div>
        </motion.div>

        {/* Yearly evolution chart */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-sm border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium">Evolução Mensal - {selectedYear}</h3>
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          {evolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }} axisLine={false} tickLine={false} dx={-4} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return <div className="rounded-sm border bg-card px-3 py-2 text-xs shadow-sm">
                    <p className="font-medium mb-1.5">{label}</p>
                    {payload.map((entry: any) => <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: entry.color }} /><span className="text-muted-foreground">{entry.name === "income" ? "Receitas" : "Despesas"}</span></div>
                      <span className="tabular-nums">{entry.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>)}
                  </div>;
                }} />
                <Bar dataKey="income" name="income" fill="oklch(0.45 0.13 145)" radius={[2, 2, 0, 0]} maxBarSize={24} />
                <Bar dataKey="expenses" name="expenses" fill="oklch(0.58 0.19 27.33)" radius={[2, 2, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-12">Sem dados para o período selecionado</p>}
        </motion.div>

        {/* Category breakdown */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-sm border bg-card">
          <h3 className="text-xs font-medium mb-4">Distribuição por Categoria</h3>
          {summary && summary.expensesByCategory.length > 0 ? (
            <div className="space-y-3">
              {summary.expensesByCategory.map((item: any) => {
                const pct = summary.totalExpenses > 0 ? (item.total / summary.totalExpenses) * 100 : 0;
                return (
                  <div key={item.category._id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.category.color }} />
                        <span className="text-xs">{item.category.name}</span>
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">{pct.toFixed(1)}% · {item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-foreground/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-8">Nenhuma despesa registrada</p>}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
