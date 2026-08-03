import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { resetUserAccountData } from "@/hooks/use-supabase";
import { parseBRLAmount } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Moon,
  Sun,
  Info,
  RotateCcw,
  AlertTriangle,
  Bug,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { BugReportModal } from "@/components/BugReportModal";

export default function Settings() {
  const { isAuthenticated, isLoading, user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [financialGoal, setFinancialGoal] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setMonthlyIncome(
        user.monthly_income ? user.monthly_income.toString() : "",
      );
      setFinancialGoal(user.financial_goal || "");
    }
  }, [user]);

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
      const parsedIncome = parseBRLAmount(monthlyIncome);
      await updateProfile({
        name: name.trim() || null,
        monthly_income: parsedIncome > 0 ? parsedIncome : null,
        financial_goal: financialGoal.trim() || null,
      });
      toast.success("Perfil atualizado com sucesso!");
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

  const handleResetAccount = async () => {
    if (!user?.id) return;
    setIsResetting(true);
    try {
      await resetUserAccountData(user.id);
      toast.success(
        "Sua conta foi redefinida com sucesso! Redirecionando para a tela inicial de dados...",
      );
      setResetDialogOpen(false);
      // Navigate to dashboard which triggers the initial Briefing / Onboarding modal
      navigate("/dashboard");
      window.location.reload();
    } catch (error) {
      toast.error("Erro ao redefinir a conta. Tente novamente.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Configurações</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie suas preferências e dados da conta
          </p>
        </div>

        {/* Profile Card */}
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
                type="text"
                inputMode="decimal"
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

        {/* Appearance Card */}
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

        {/* Feedback / Bug Report Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-xl border bg-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Suporte & Reportar Erros</h2>
              <p className="text-xs text-muted-foreground">
                Encontrou uma falha ou tem uma sugestão? Envie diretamente ao desenvolvedor.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-lg flex items-center gap-2"
            onClick={() => setBugModalOpen(true)}
          >
            <Bug className="w-3.5 h-3.5 text-destructive" />
            Reportar Bug / Enviar Feedback
          </Button>
        </motion.div>

        {/* Reset Account (Start from scratch) Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl border border-destructive/30 bg-destructive/5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-destructive">
                Redefinir Conta (Recomeçar do Zero)
              </h2>
              <p className="text-xs text-muted-foreground">
                Apaga todos os lançamentos, cartões, orçamentos e metas, levando você de volta à tela de briefing inicial.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Se você deseja limpar seu histórico financeiro e reconfigurar seus primeiros dados do zero, use esta opção. Esta ação é irreversível.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="text-xs rounded-lg flex items-center gap-2"
            onClick={() => setResetDialogOpen(true)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Redefinir Minha Conta e Começar do Zero
          </Button>
        </motion.div>

        {/* About Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-5 rounded-xl border bg-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Sobre</h2>
              <p className="text-xs text-muted-foreground">
                Informações do aplicativo
              </p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Zenfi — Suas finanças no zen.</p>
            <p>Versão 1.0.0</p>
            <p>100% gratuito. Armazenamento seguro com Supabase.</p>
          </div>
        </motion.div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-semibold">
                Tem certeza que deseja redefinir sua conta?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              Esta ação apagar permanentemente todas as suas <strong>transações, cartões, faturas, dívidas, orçamentos, investimentos e metas</strong>.
              <br /><br />
              Após o reset, você será redirecionado para a <strong>tela de briefing inicial</strong> para preencher seus primeiros dados e recalcular tudo do zero.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-xl h-9"
              onClick={() => setResetDialogOpen(false)}
              disabled={isResetting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs rounded-xl h-9 flex items-center gap-1.5"
              onClick={handleResetAccount}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Redefinindo conta...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Sim, apagar tudo e recomeçar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bug Report Modal */}
      <BugReportModal open={bugModalOpen} onOpenChange={setBugModalOpen} />
    </DashboardLayout>
  );
}
