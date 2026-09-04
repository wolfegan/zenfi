import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  ArrowDownUp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Percent,
  Tags,
  TrendingUp,
  User,
  Menu,
  X,
  HandCoins,
  Target,
  FileText,
  Settings,
  Landmark,
  Moon,
  Sun,
  Bug,
  Plus,
  Calculator,
  Sparkles,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { BugReportModal } from "@/components/BugReportModal";
import { QuickTransactionModal } from "@/components/QuickTransactionModal";
import { FinancialCalculatorModal } from "@/components/FinancialCalculatorModal";
import { PurchaseSimulatorModal } from "@/components/PurchaseSimulatorModal";
import { FinancialCalendarModal } from "@/components/FinancialCalendarModal";
import { SubscriptionsModal } from "@/components/SubscriptionsModal";

export function openCalculator() {
  window.dispatchEvent(new CustomEvent("zenfi:open-calculator"));
}

export function openSimulator() {
  window.dispatchEvent(new CustomEvent("zenfi:open-simulator"));
}

export function openCalendar() {
  window.dispatchEvent(new CustomEvent("zenfi:open-calendar"));
}

export function openSubscriptions() {
  window.dispatchEvent(new CustomEvent("zenfi:open-subscriptions"));
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transações", icon: ArrowDownUp },
  { to: "/categories", label: "Categorias", icon: Tags },
  { to: "/budgets", label: "Orçamentos", icon: Percent },
  { to: "/accounts", label: "Contas", icon: Landmark },
  { to: "/credit-cards", label: "Cartões", icon: CreditCard },
  { to: "/investments", label: "Investimentos", icon: TrendingUp },
  { to: "/debts", label: "Dívidas & Crediários", icon: HandCoins },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/reports", label: "Relatórios", icon: FileText },
];

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 group ${
        isActive
          ? "bg-secondary text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
      )}
      <Icon
        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [subsModalOpen, setSubsModalOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Global event listeners for tool modals
  useEffect(() => {
    const handleOpenCalc = () => setCalcModalOpen(true);
    const handleOpenSim = () => setSimulatorModalOpen(true);
    const handleOpenCal = () => setCalendarModalOpen(true);
    const handleOpenSub = () => setSubsModalOpen(true);

    window.addEventListener("zenfi:open-calculator", handleOpenCalc);
    window.addEventListener("zenfi:open-simulator", handleOpenSim);
    window.addEventListener("zenfi:open-calendar", handleOpenCal);
    window.addEventListener("zenfi:open-subscriptions", handleOpenSub);

    return () => {
      window.removeEventListener("zenfi:open-calculator", handleOpenCalc);
      window.removeEventListener("zenfi:open-simulator", handleOpenSim);
      window.removeEventListener("zenfi:open-calendar", handleOpenCal);
      window.removeEventListener("zenfi:open-subscriptions", handleOpenSub);
    };
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-border/60">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <img
            src="/favicon-2.png"
            alt="Zenfi"
            className="w-8 h-8 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-200"
          />
          <span className="text-sm font-semibold tracking-tight">Zenfi</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
          >
            <NavItem
              item={item}
              isActive={location.pathname === item.to}
              onClick={() => setSidebarOpen(false)}
            />
          </motion.div>
        ))}

        {/* Ferramentas Práticas */}
        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Ferramentas
          </span>
        </div>

        <button
          onClick={() => {
            setSidebarOpen(false);
            setCalendarModalOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all font-medium"
        >
          <CalendarIcon className="w-4 h-4 text-blue-500 shrink-0" />
          <span>Calendário Financeiro</span>
        </button>

        <button
          onClick={() => {
            setSidebarOpen(false);
            setSubsModalOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all font-medium"
        >
          <RefreshCw className="w-4 h-4 text-purple-500 shrink-0" />
          <span>Assinaturas & Recorrências</span>
        </button>

        <button
          onClick={() => {
            setSidebarOpen(false);
            setCalcModalOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all font-medium"
        >
          <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Calculadora Rápida</span>
        </button>

        <button
          onClick={() => {
            setSidebarOpen(false);
            setSimulatorModalOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all font-medium"
        >
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Simular Compras Futuras</span>
        </button>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border/60 px-3 py-3 space-y-0.5">
        <Link
          to="/settings"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
            location.pathname === "/settings"
              ? "bg-secondary text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Configurações
        </Link>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 w-full text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          {darkMode ? "Modo claro" : "Modo escuro"}
        </button>
        <button
          onClick={() => {
            setSidebarOpen(false);
            setBugModalOpen(true);
          }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 w-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 text-destructive/90 hover:text-destructive hover:bg-destructive/10"
        >
          <Bug className="w-4 h-4 shrink-0" />
          Reportar Bug
        </button>
      </div>

      {/* User profile */}
      <div className="border-t border-border/60 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-all duration-200 group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-border flex items-center justify-center shrink-0 text-[11px] font-semibold">
                {initials || (
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium truncate">{displayName}</p>
                {user?.is_anonymous && (
                  <p className="text-[10px] text-muted-foreground">Convidado</p>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="text-xs"
            >
              <Settings className="w-3.5 h-3.5 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-xs text-destructive focus:text-destructive"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 border-r bg-sidebar fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-60 border-r bg-sidebar"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Top bar — mobile only */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-14 border-b bg-background/90 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src="/favicon-2.png"
              alt="Zenfi"
              className="w-7 h-7 rounded-lg object-cover"
            />
            <span className="text-sm font-semibold">Zenfi</span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setCalcModalOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-emerald-600 dark:text-emerald-400"
              title="Calculadora"
            >
              <Calculator className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSimulatorModalOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-amber-500"
              title="Simulador de Compras"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-5 sm:px-8 sm:py-8 pb-24 sm:pb-8 max-w-7xl w-full mx-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
              location.pathname === "/dashboard"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Início</span>
          </Link>

          <Link
            to="/transactions"
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
              location.pathname === "/transactions"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownUp className="w-5 h-5" />
            <span>Transações</span>
          </Link>

          <button
            onClick={() => setQuickModalOpen(true)}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-105 transition-transform active:scale-95 -mt-4 border-2 border-background cursor-pointer"
            title="Nova Transação Rápida"
          >
            <Plus className="w-6 h-6" />
          </button>

          <Link
            to="/accounts"
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
              location.pathname === "/accounts"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Landmark className="w-5 h-5" />
            <span>Contas</span>
          </Link>

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span>Mais</span>
          </button>
        </nav>
      </div>

      <BugReportModal open={bugModalOpen} onOpenChange={setBugModalOpen} />
      <QuickTransactionModal open={quickModalOpen} onOpenChange={setQuickModalOpen} />
      <FinancialCalculatorModal open={calcModalOpen} onOpenChange={setCalcModalOpen} />
      <PurchaseSimulatorModal open={simulatorModalOpen} onOpenChange={setSimulatorModalOpen} />
      <FinancialCalendarModal open={calendarModalOpen} onOpenChange={setCalendarModalOpen} />
      <SubscriptionsModal open={subsModalOpen} onOpenChange={setSubsModalOpen} />
    </div>
  );
}

