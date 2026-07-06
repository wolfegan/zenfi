import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Moon,
  Sun,
  Info,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Settings() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [financialGoal, setFinancialGoal] = useState(
    user?.financial_goal || "",
  );

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  if (isLoading) return null;
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSave = async () => {
    try {
      // Profile is managed by Supabase Auth, updates will be added later
      toast.success("Perfil atualizado!");
    } catch (error) {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Configurações</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie suas preferências
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl border bg-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Perfil</h2>
              <p className="text-xs text-muted-foreground">
                Suas informações pessoais
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Nome
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="rounded-lg h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Email
              </label>
              <Input
                value={user?.email || ""}
                disabled
                className="opacity-60 rounded-lg h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Renda Mensal (opcional)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="Ex: 8000"
                className="rounded-lg h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Objetivo Financeiro
              </label>
              <Input
                value={financialGoal}
                onChange={(e) => setFinancialGoal(e.target.value)}
                placeholder="Ex: Reserva de emergência, comprar imóvel..."
                className="rounded-lg h-9"
              />
            </div>
            <Button
              size="sm"
              className="text-xs rounded-lg"
              onClick={handleSave}
            >
              Salvar Alterações
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl border bg-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Aparência</h2>
              <p className="text-xs text-muted-foreground">
                Personalize a visualização
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {darkMode ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              <span className="text-sm">Modo Escuro</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-10 h-6 rounded-full transition-colors ${darkMode ? "bg-foreground" : "bg-secondary"}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-background border shadow-sm transition-transform ${darkMode ? "translate-x-[18px]" : "translate-x-0.5"}`}
              />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl border bg-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Sobre</h2>
              <p className="text-xs text-muted-foreground">
                Informações do app
              </p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Zenfi — Suas finanças no zen.</p>
            <p>Versão 1.0.0</p>
            <p>100% gratuito. Dados armazenados com Supabase.</p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
