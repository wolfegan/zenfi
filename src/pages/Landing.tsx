import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  TrendingUp,
  CreditCard,
  Target,
  ArrowRight,
  BarChart3,
  Shield,
  Menu,
  X,
  ArrowDownUp,
  CheckCircle2,
  Zap,
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
      }, 18);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "oklch(0.48 0.14 145)";
    if (s >= 60) return "oklch(0.65 0.14 100)";
    if (s >= 40) return "oklch(0.72 0.15 75)";
    return "oklch(0.58 0.19 27.33)";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excelente";
    if (s >= 60) return "Bom";
    if (s >= 40) return "Atenção";
    return "Crítico";
  };

  return (
    <div className="relative w-52 h-52 sm:w-64 sm:h-64 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="oklch(0.92 0 0)"
          strokeWidth="8"
          className="dark:stroke-[oklch(0.22 0 0)]"
        />
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
            filter: `drop-shadow(0 0 8px ${getScoreColor(animatedScore)}66)`,
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
        <span className="text-xs text-muted-foreground mt-1 tracking-widest uppercase font-medium">
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
    color: "oklch(0.42 0.18 264)",
  },
  {
    icon: Target,
    title: "Orçamentos Mensais",
    desc: "Defina limites de gastos por categoria e acompanhe seu progresso em tempo real.",
    color: "oklch(0.52 0.15 178)",
  },
  {
    icon: CreditCard,
    title: "Faturas de Cartão",
    desc: "Acompanhe suas faturas, visualize gastos por cartão e nunca perca uma data de vencimento.",
    color: "oklch(0.68 0.16 55)",
  },
  {
    icon: TrendingUp,
    title: "Investimentos",
    desc: "Monitore seus investimentos em um só lugar: ações, cripto, renda fixa e mais.",
    color: "oklch(0.48 0.14 145)",
  },
  {
    icon: BarChart3,
    title: "Saúde Financeira",
    desc: "Score animado estilo Serasa com análise completa da sua saúde financeira.",
    color: "oklch(0.6 0.18 320)",
  },
  {
    icon: Shield,
    title: "100% Gratuito",
    desc: "Sem custos, sem anúncios. Seus dados financeiros protegidos e só seus.",
    color: "oklch(0.52 0.12 250)",
  },
];

const steps = [
  {
    num: "01",
    title: "Crie sua conta",
    desc: "Email ou acesso rápido como convidado em segundos.",
  },
  {
    num: "02",
    title: "Adicione transações",
    desc: "Registre seus gastos fixos e variáveis com categorias.",
  },
  {
    num: "03",
    title: "Defina orçamentos",
    desc: "Estabeleça quanto pode gastar em cada categoria por mês.",
  },
  {
    num: "04",
    title: "Veja sua evolução",
    desc: "Acompanhe seu score de saúde financeira crescer.",
  },
];

const stats = [
  { value: "100%", label: "Gratuito para sempre" },
  { value: "10+", label: "Módulos financeiros" },
  { value: "< 5min", label: "Para começar" },
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/zenfi-icon.png"
                alt="Zenfi"
                className="w-9 h-9 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-200"
              />
              <span className="text-base font-semibold tracking-tight">
                Zenfi
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Recursos
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Como funciona
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(isAuthenticated ? "/dashboard" : "/auth")
                }
                className="text-sm h-9 rounded-lg"
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
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="sm:hidden border-t px-4 py-4 space-y-3 bg-background"
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground py-1"
            >
              Recursos
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground py-1"
            >
              Como funciona
            </a>
            <Button
              className="w-full text-sm mt-2 rounded-lg h-10"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(isAuthenticated ? "/dashboard" : "/auth");
              }}
            >
              {isAuthenticated ? "Dashboard" : "Começar agora"}
            </Button>
          </motion.div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-chart-1/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card text-xs text-muted-foreground mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse-subtle" />
                Controle financeiro simplificado
                <Zap className="w-3 h-3 text-chart-3" />
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-light tracking-tight leading-[1.1]">
                Suas finanças no{" "}
                <span className="font-semibold" style={{ color: "#3d8c6e" }}>
                  zen.
                </span>
              </h1>
              <p className="mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
                Registre gastos, acompanhe faturas, defina orçamentos e veja sua
                saúde financeira evoluir com um score animado. Simples, direto e
                gratuito.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() =>
                    navigate(isAuthenticated ? "/dashboard" : "/auth")
                  }
                  className="text-sm h-11 px-7 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  {isAuthenticated ? "Ir para o Dashboard" : "Começar agora"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => !isAuthenticated && navigate("/auth")}
                  className="text-sm h-11 px-7 rounded-xl"
                >
                  {isAuthenticated ? "Explorar recursos" : "Entrar com email"}
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap gap-6 justify-center lg:justify-start">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="text-center lg:text-left"
                  >
                    <p className="text-xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Health Score Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div className="relative p-8 sm:p-12 rounded-3xl border bg-card/70 backdrop-blur-sm shadow-sm">
                <HealthScoreGauge score={78} />
                <p className="mt-5 text-xs text-muted-foreground text-center max-w-[200px] mx-auto leading-relaxed">
                  Exemplo do score de saúde financeira — descubra o seu
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  {[
                    { label: "Poupança", pct: 60 },
                    { label: "Gastos", pct: 65 },
                    { label: "Orçamento", pct: 78 },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="font-medium text-foreground">
                        {item.pct}%
                      </div>
                      <div>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight">
              Tudo que você precisa
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Ferramentas completas para organizar sua vida financeira
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                >
                  <div className="p-6 rounded-2xl border bg-card hover:shadow-sm transition-all duration-300 card-interactive h-full">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${feature.color}18` }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: feature.color }}
                      />
                    </div>
                    <h3 className="text-sm font-semibold mb-2">
                      {feature.title}
                    </h3>
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

      {/* Product Showcase */}
      <section className="border-t py-16 sm:py-24 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight">
              O Zenfi em ação
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Veja como é simples e intuitivo organizar seu fluxo de caixa
            </p>
          </motion.div>

          {/* Row 1: Dashboard */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                Painel Consolidado
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Visão geral inteligente de todo o seu patrimônio
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Acompanhe o saldo consolidado de suas contas correntes e
                poupanças, deduza as faturas de cartão de crédito e dívidas
                ativas para ver seu patrimônio líquido real instantaneamente.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  Atualização em tempo real de receitas e despesas.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  Alertas inteligentes de dívidas que vencem no dia.
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-shadow"
            >
              <img
                src="/dashboard-screenshot.png"
                alt="Painel consolidado do Zenfi"
                className="w-full object-cover"
              />
            </motion.div>
          </div>

          {/* Row 2: Transactions */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:order-2 space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                Busca & Filtros
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Registre e encontre qualquer transação num piscar de olhos
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Mantenha um histórico completo e organizado de suas entradas e
                saídas. Filtre e busque por descrição ou categoria para saber
                exatamente para onde seu dinheiro está indo.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  Identificação visual de despesas fixas e gastos no cartão.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  Resumo rápido de receitas e despesas no topo da tela.
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:order-1 relative rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-shadow"
            >
              <img
                src="/transactions-screenshot.png"
                alt="Listagem de transações no Zenfi"
                className="w-full object-cover"
              />
            </motion.div>
          </div>

          {/* Row 3: Categories */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                Personalização total
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Crie categorias sob medida para a sua rotina
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Organize seu orçamento separando suas despesas por categorias
                totalmente customizáveis. Escolha a cor e o ícone que melhor
                representam cada hábito financeiro.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  Módulo de despesas e receitas organizadas separadamente.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  Indicador visual de gastos recorrentes em cada card.
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-shadow"
            >
              <img
                src="/categories-screenshot.png"
                alt="Categorização personalizada no Zenfi"
                className="w-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t py-16 sm:py-24 bg-secondary/30"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight">
              Comece em minutos
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Quatro passos simples para assumir o controle
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative text-center"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-[calc(50%+2rem)] right-[-50%] h-px bg-border" />
                )}
                <div className="w-10 h-10 rounded-full border-2 border-border bg-card flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 mb-6 text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-chart-2" />
              Sem necessidade de cartão de crédito
            </div>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight mb-4">
              Pronto para organizar suas finanças?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              Crie sua conta gratuitamente e comece a cuidar do seu dinheiro de
              forma simples e eficaz.
            </p>
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="text-sm h-11 px-10 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              {isAuthenticated ? "Ir para o Dashboard" : "Criar conta gratuita"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/zenfi-icon.png"
              alt="Zenfi"
              className="w-6 h-6 rounded-md object-cover"
            />
            <span className="text-xs text-muted-foreground">
              Zenfi — Suas finanças no zen.
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Zen + Finanças. 100% gratuito.
          </p>
        </div>
      </footer>
    </div>
  );
}
