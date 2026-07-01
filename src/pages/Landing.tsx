import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  PiggyBank,
  TrendingUp,
  CreditCard,
  Target,
  ArrowRight,
  BarChart3,
  Shield,
  Menu,
  X,
  ArrowDownUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

function HealthScoreGauge({ score = 78 }: { score?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const gaugeRef = useRef<SVGCircleElement>(null);

  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedScore((prev) => {
          if (prev >= score) {
            clearInterval(interval);
            return score;
          }
          return prev + 1;
        });
      }, 20);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "oklch(0.45 0.13 145)";
    if (s >= 60) return "oklch(0.65 0.14 100)";
    if (s >= 40) return "oklch(0.75 0.14 75)";
    return "oklch(0.58 0.19 27.33)";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excelente";
    if (s >= 60) return "Bom";
    if (s >= 40) return "Atenção";
    return "Crítico";
  };

  return (
    <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="oklch(0.92 0 0)"
          strokeWidth="8"
          className="dark:stroke-[oklch(0.22 0 0)]"
        />
        {/* Active circle */}
        <circle
          ref={gaugeRef}
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={getScoreColor(animatedScore)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-200 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${getScoreColor(animatedScore)}55)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl sm:text-6xl font-light tabular-nums transition-colors duration-500"
          style={{ color: getScoreColor(animatedScore) }}
        >
          {animatedScore}
        </span>
        <span className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
          {getScoreLabel(animatedScore)}
        </span>
      </div>
    </div>
  );
}

const features = [
  {
    icon: ArrowDownUp,
    title: "Controle de Gastos",
    desc: "Registre entradas e saídas com categorias personalizadas. Diferencie gastos fixos de variáveis.",
  },
  {
    icon: Target,
    title: "Orçamentos Mensais",
    desc: "Defina limites de gastos por categoria e acompanhe seu progresso em tempo real.",
  },
  {
    icon: CreditCard,
    title: "Faturas de Cartão",
    desc: "Acompanhe suas faturas, visualize gastos por cartão e nunca perca uma data de vencimento.",
  },
  {
    icon: TrendingUp,
    title: "Investimentos",
    desc: "Monitore seus investimentos em um só lugar: ações, cripto, renda fixa e mais.",
  },
  {
    icon: BarChart3,
    title: "Saúde Financeira",
    desc: "Score animado estilo Serasa com análise completa da sua saúde financeira.",
  },
  {
    icon: Shield,
    title: "100% Gratuito",
    desc: "Sem custos, sem anúncios. Seus dados financeiros protegidos e só seus.",
  },
];

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Email ou acesso rápido como convidado." },
  { num: "02", title: "Adicione receitas e despesas", desc: "Registre seus gastos fixos e variáveis com categorias." },
  { num: "03", title: "Defina orçamentos", desc: "Estabeleça quanto pode gastar em cada categoria por mês." },
  { num: "04", title: "Acompanhe seu score", desc: "Veja sua saúde financeira melhorar a cada mês." },
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-background" />
              </div>
              <span className="text-base font-medium tracking-tight">Finanças</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Como funciona
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                className="text-sm"
              >
                {isLoading ? "..." : isAuthenticated ? "Dashboard" : "Entrar"}
              </Button>
            </nav>

            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t px-4 py-4 space-y-3 bg-background">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground"
            >
              Recursos
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground"
            >
              Como funciona
            </a>
            <Button
              className="w-full text-sm mt-2"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(isAuthenticated ? "/dashboard" : "/auth");
              }}
            >
              {isAuthenticated ? "Dashboard" : "Começar agora"}
            </Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-subtle" />
                Controle financeiro simplificado
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight leading-[1.1]">
                Suas finanças com{" "}
                <span className="font-medium">clareza</span>
              </h1>
              <p className="mt-4 sm:mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
                Registre gastos, acompanhe faturas, defina orçamentos e veja sua saúde financeira
                evoluir com um score animado. Simples, direto e gratuito.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                  className="text-sm h-11 px-6"
                >
                  {isAuthenticated ? "Ir para o Dashboard" : "Começar agora"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => !isAuthenticated && navigate("/auth")}
                  className="text-sm h-11 px-6"
                >
                  {isAuthenticated ? "Explorar recursos" : "Entrar com email"}
                </Button>
              </div>
            </motion.div>

            {/* Right: Health Score Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <HealthScoreGauge score={78} />
              <p className="mt-4 text-xs text-muted-foreground text-center max-w-[200px]">
                Exemplo do score de saúde financeira — descubra o seu
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight">
              Tudo que você precisa
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Ferramentas completas para organizar sua vida financeira
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="group"
                >
                  <div className="p-5 rounded-sm border bg-card hover:shadow-sm transition-all duration-200">
                    <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center mb-4">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-medium mb-2">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t py-16 sm:py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight">
              Comece em minutos
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Quatro passos simples para assumir o controle
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl font-light text-muted-foreground/30 mb-3">
                  {step.num}
                </div>
                <h3 className="text-sm font-medium mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight mb-4">
            Pronto para organizar suas finanças?
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            Crie sua conta gratuitamente e comece a cuidar do seu dinheiro de forma simples e divertida.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
            className="text-sm h-11 px-8"
          >
            {isAuthenticated ? "Ir para o Dashboard" : "Criar conta gratuita"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
              <PiggyBank className="w-3 h-3 text-background" />
            </div>
            <span className="text-xs text-muted-foreground">
              Finanças — Controle financeiro simplificado
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Feito com clareza. 100% gratuito.
          </p>
        </div>
      </footer>
    </div>
  );
}

