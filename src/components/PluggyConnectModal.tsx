import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { POPULAR_BANKS, BankLogo } from "@/components/BankLogo";
import { syncOpenFinanceBank, fetchPluggyConnectToken } from "@/lib/pluggy";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PluggyConnect } from "react-pluggy-connect";
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  Lock,
  ArrowRight,
  Globe,
} from "lucide-react";

interface PluggyConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PluggyConnectModal({
  open,
  onOpenChange,
  onSuccess,
}: PluggyConnectModalProps) {
  const { user } = useAuth();
  const [selectedBankId, setSelectedBankId] = useState<string>("nubank");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedBankName, setConnectedBankName] = useState<string | null>(null);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [useWidgetMode, setUseWidgetMode] = useState(false);

  useEffect(() => {
    if (open) {
      // Try to fetch connect token from Pluggy API
      fetchPluggyConnectToken()
        .then((token) => {
          if (token) setConnectToken(token);
        })
        .catch((err) => {
          console.warn("Connect token error:", err);
        });
    } else {
      setConnectToken(null);
      setUseWidgetMode(false);
    }
  }, [open]);

  const handleConnectPreset = async () => {
    if (!user) {
      toast.error("Por favor, faça login para conectar seu banco.");
      return;
    }

    setIsConnecting(true);
    const selectedPreset = POPULAR_BANKS.find((b) => b.id === selectedBankId);
    const toastId = toast.loading(
      `Conectando ao ${selectedPreset?.name || "Banco"} via Open Finance (Pluggy.ai)...`
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await syncOpenFinanceBank(selectedBankId, user.id);

      toast.success(
        `Banco ${result.bankName} conectado com sucesso! ${result.accountsCreated > 0 ? `${result.accountsCreated} conta(s)` : "Saldos"} e ${result.transactionsCreated} transação(ões) sincronizada(s).`,
        { id: toastId }
      );

      setConnectedBankName(result.bankName);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setIsConnecting(false);
        setConnectedBankName(null);
        onOpenChange(false);
      }, 1800);
    } catch (err: any) {
      console.error("Erro na conexão Open Finance:", err);
      toast.error("Erro ao conectar banco via Open Finance: " + (err?.message || err), {
        id: toastId,
      });
      setIsConnecting(false);
    }
  };

  const handleWidgetSuccess = async (itemData: any) => {
    if (!user) return;
    toast.success("Banco conectado via Pluggy Connect Widget!");
    if (onSuccess) onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/80 shadow-2xl rounded-3xl">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#173b2c] to-emerald-900 p-6 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-lime-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-lime-300 border border-white/10">
              <Zap className="w-3.5 h-3.5" /> Open Finance Pluggy.ai
            </div>
            <div className="flex items-center gap-1 text-[10px] text-white/70 font-medium">
              <Lock className="w-3 h-3 text-emerald-400" /> Criptografia 256-bit
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Sincronização Bancária Automática
          </h2>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            Conecte suas contas com segurança pelo protocolo BACEN. Transações e saldos serão atualizados sozinhos no Zenfi.
          </p>
        </div>

        <div className="p-6 space-y-5 bg-background">
          <AnimatePresence mode="wait">
            {connectedBankName ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8 text-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">
                  {connectedBankName} Conectado!
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Sua conta e extrato foram sincronizados com sucesso no Zenfi. O painel e os gráficos foram atualizados.
                </p>
              </motion.div>
            ) : isConnecting ? (
              <motion.div
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center space-y-4"
              >
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <RefreshCw className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    Estabelecendo Conexão Segura
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Autenticando via Open Finance Pluggy.ai...
                  </p>
                </div>
              </motion.div>
            ) : useWidgetMode && connectToken ? (
              <div className="py-2">
                <PluggyConnect
                  connectToken={connectToken}
                  includeSandbox={true}
                  onSuccess={handleWidgetSuccess}
                  onError={(error) => {
                    console.error("Connection failed", error);
                    toast.error("Erro no widget Pluggy Connect.");
                  }}
                  onClose={() => setUseWidgetMode(false)}
                />
              </div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Select Bank Label */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                      Selecione sua Instituição Bancária
                    </label>
                    {connectToken && (
                      <button
                        type="button"
                        onClick={() => setUseWidgetMode(true)}
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" /> Abrir Widget Pluggy
                      </button>
                    )}
                  </div>

                  {/* Grid of Bank Presets */}
                  <div className="grid grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {POPULAR_BANKS.map((bank) => {
                      const isSelected = selectedBankId === bank.id;
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBankId(bank.id)}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center group ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20 ring-2 ring-emerald-500/40 shadow-sm scale-[1.02]"
                              : "border-border/70 hover:border-emerald-500/50 hover:bg-secondary/60"
                          }`}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-110"
                            style={{ backgroundColor: bank.color }}
                          >
                            <BankLogo bankKeyOrName={bank.id} className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[11px] font-semibold tracking-tight truncate w-full">
                            {bank.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Security Trust Badge */}
                <div className="p-3.5 rounded-2xl border border-border/60 bg-secondary/40 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    <strong className="text-foreground font-semibold">100% Leitura Segura:</strong> O Zenfi apenas recebe extratos e saldos via Open Finance. Nunca realiza transferências ou movimentações na sua conta.
                  </p>
                </div>

                {/* Submit Connect Button */}
                <Button
                  onClick={handleConnectPreset}
                  disabled={isConnecting}
                  className="w-full h-11 rounded-2xl bg-[#173b2c] hover:bg-[#102a1f] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 group transition-all"
                >
                  <span>Conectar Banco via Open Finance</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
