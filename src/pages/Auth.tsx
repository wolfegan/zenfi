import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Lock, Mail, UserX, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

type AuthStep = "login" | "signup" | "loading";

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signInWithEmail, signUpWithEmail, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirectAfterAuth || "/");
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar. Verifique seus dados.");
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password);
      setStep("login");
      setError(null);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar conta.");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInAnonymously();
    } catch (err) {
      setError(`Falha ao entrar como convidado: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-[45%] bg-foreground flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        </div>
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <img src="/zenfi-icon.png" alt="Zenfi" className="w-9 h-9 rounded-xl object-cover" />
          <span className="text-base font-semibold text-white">Zenfi</span>
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-light text-white tracking-tight leading-snug mb-4">
            Suas finanças no <span className="font-semibold">zen.</span>
          </h2>
          <p className="text-sm text-white/60 leading-relaxed max-w-sm">
            Registre gastos, acompanhe orçamentos e veja sua saúde financeira crescer — tudo de forma simples e gratuita.
          </p>
          <div className="mt-8 space-y-3">
            {["Dashboard com score de saúde financeira", "Controle de cartões e dívidas", "Metas e investimentos"].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Shield className="w-3 h-3 text-white/70" />
                </div>
                <span className="text-xs text-white/70">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/30 relative z-10">100% gratuito · Sem anúncios</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <img src="/zenfi-icon.png" alt="Zenfi" className="w-9 h-9 rounded-xl object-cover group-hover:scale-105 transition-transform" />
              <span className="text-base font-semibold">Zenfi</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              {step === "signup" ? "Criar conta" : "Bem-vindo de volta"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {step === "signup" ? "Crie sua conta com email e senha" : "Entre com seu email e senha"}
            </p>
          </div>

          <form onSubmit={step === "signup" ? handleEmailSignUp : handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9 h-10 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="sua senha"
                  className="pl-9 h-10 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-destructive bg-destructive/8 px-3 py-2 rounded-lg"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full h-10 rounded-xl text-sm font-medium"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{step === "signup" ? "Criando..." : "Entrando..."}</>
              ) : (
                <>{step === "signup" ? "Criar Conta" : "Entrar"}<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-background px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-10 rounded-xl text-sm"
            onClick={handleGuestLogin}
            disabled={isLoading}
          >
            <UserX className="mr-2 h-4 w-4" />
            Entrar como Convidado
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {step === "signup" ? "Já tem conta?" : "Não tem conta?"}{" "}
            <button
              type="button"
              onClick={() => { setStep(step === "signup" ? "login" : "signup"); setError(null); }}
              disabled={isLoading}
              className="text-foreground font-medium hover:underline transition-colors"
            >
              {step === "signup" ? "Entre aqui" : "Cadastre-se"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
