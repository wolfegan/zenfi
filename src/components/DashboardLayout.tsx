import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowDownUp,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Percent,
  Tags,
  TrendingUp,
  User,
  Menu,
  X,
  HandCoins,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transações", icon: ArrowDownUp },
  { to: "/categories", label: "Categorias", icon: Tags },
  { to: "/budgets", label: "Orçamentos", icon: Percent },
  { to: "/credit-cards", label: "Cartões", icon: CreditCard },
  { to: "/investments", label: "Investimentos", icon: TrendingUp },
  { to: "/debts", label: "Dívidas", icon: HandCoins },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r bg-card transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 h-16 border-b">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-foreground flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-background" />
              </div>
              <span className="text-sm font-medium tracking-tight">Finanças</span>
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
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-all duration-150 ${
                    isActive
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User area */}
          <div className="border-t p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="truncate font-medium">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email || ""}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar (mobile) */}
        <div className="sticky top-0 z-30 lg:hidden flex items-center h-14 px-4 border-b bg-background/95 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
              <PiggyBank className="w-3.5 h-3.5 text-background" />
            </div>
            <span className="text-sm font-medium">Finanças</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
