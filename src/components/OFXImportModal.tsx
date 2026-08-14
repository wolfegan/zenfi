import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts } from "@/hooks/use-supabase";
import {
  parseOFXContent,
  parseCSVContent,
  saveParsedTransactionsToSupabase,
  ParsedTransaction,
  ParsedOFXResult,
} from "@/lib/ofx-parser";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Download,
  Building2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { BankLogo, POPULAR_BANKS } from "@/components/BankLogo";

interface OFXImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const BANK_TUTORIALS: Record<string, { steps: string[]; tip: string }> = {
  nubank: {
    steps: [
      "Abra o aplicativo do Nubank no seu celular.",
      "Toque na sua 'Conta' (onde aparece o saldo).",
      "Toque no ícone de Engrenagem ⚙️ (ou no menu superior).",
      "Selecione a opção 'Exportar extrato'.",
      "Escolha o formato OFX e envie para seu e-mail ou WhatsApp para salvar no aparelho!",
    ],
    tip: "O arquivo .OFX é enviado em poucos segundos para o seu e-mail do Nubank.",
  },
  itau: {
    steps: [
      "Acesse o Internet Banking ou App Itaú no seu computador/celular.",
      "Vá até a aba 'Extrato'.",
      "Clique no ícone de Download / Salvar Arquivo no topo direito.",
      "Escolha a opção 'Exportar em OFX (Money)'.",
    ],
    tip: "No Itaú pelo computador é possível baixar extratos de até 90 dias de uma só vez.",
  },
  inter: {
    steps: [
      "Abra o aplicativo do Banco Inter.",
      "Acesse a área de 'Conta Digital' e toque em 'Extrato'.",
      "Clique no ícone de seta de Download / Compartilhar no topo.",
      "Selecione 'Exportar em formato OFX'.",
    ],
    tip: "O Inter gera o arquivo .OFX instantaneamente na sua tela.",
  },
  bb: {
    steps: [
      "Acesse o Internet Banking ou aplicativo do Banco do Brasil.",
      "Vá na opção 'Extrato de Conta Corrente'.",
      "No final da página, clique em 'Salvar / Exportar Extrato'.",
      "Selecione o formato 'OFX'.",
    ],
    tip: "No Banco do Brasil o botão de salvar fica localizado ao final do extrato impresso.",
  },
  bradesco: {
    steps: [
      "Acesse o Internet Banking do Bradesco.",
      "Navegue até 'Saldos e Extratos'.",
      "Escolha o período desejado e clique no botão 'Salvar como arquivo'.",
      "Selecione o formato 'OFX (Money)'.",
    ],
    tip: "O Bradesco faz o download do arquivo .ofx diretamente no seu navegador.",
  },
  santander: {
    steps: [
      "Acesse o Internet Banking do Santander.",
      "Acesse o menu 'Conta Corrente > Extrato'.",
      "Clique na opção 'Exportar Extrato'.",
      "Selecione o formato 'OFX'.",
    ],
    tip: "Verifique se o seu bloqueador de pop-ups não impediu o download do arquivo.",
  },
  c6: {
    steps: [
      "Abra o app do C6 Bank no seu celular.",
      "Toque na sua Conta e acesse o 'Extrato'.",
      "Toque no ícone de compartilhamento / download.",
      "Escolha o formato 'OFX'.",
    ],
    tip: "O C6 permite exportar extratos mensais completos em OFX.",
  },
};

export function OFXImportModal({
  open,
  onOpenChange,
  onSuccess,
}: OFXImportModalProps) {
  const { user } = useAuth();
  const { data: accounts } = useAccounts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"import" | "tutorial">("import");
  const [selectedTutorialBank, setSelectedTutorialBank] = useState<string>("nubank");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedOFXResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  // Set default account when modal opens
  React.useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        let result: ParsedOFXResult;
        if (file.name.toLowerCase().endsWith(".csv")) {
          result = parseCSVContent(content);
        } else {
          result = parseOFXContent(content);
        }

        if (result.transactions.length === 0) {
          toast.error("Nenhuma transação válida encontrada no arquivo.");
          setParsedData(null);
          return;
        }

        setParsedData(result);
        toast.success(
          `Arquivo lido! ${result.transactions.length} transações encontradas.`
        );
      } catch (err) {
        console.error("Erro ao ler arquivo:", err);
        toast.error("Formato de arquivo inválido ou corrompido.");
        setParsedData(null);
      }
    };

    reader.readAsText(file, "ISO-8859-1"); // Standard Brazilian bank OFX encoding
  };

  const handleConfirmImport = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para importar.");
      return;
    }
    if (!selectedAccountId) {
      toast.error("Selecione qual conta bancária receberá o extrato.");
      return;
    }
    if (!parsedData || parsedData.transactions.length === 0) {
      toast.error("Selecione um arquivo de extrato válido.");
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading("Importando transações no Zenfi...");

    try {
      const result = await saveParsedTransactionsToSupabase(
        parsedData,
        selectedAccountId,
        user.id
      );

      toast.success(
        `Extrato importado com sucesso! ${result.added} nova(s) transação(ões) adicionada(s)${
          result.skipped > 0 ? ` (${result.skipped} duplicadas ignoradas)` : ""
        }.`,
        { id: toastId }
      );

      if (onSuccess) onSuccess();
      setParsedData(null);
      setFileName("");
      setIsImporting(false);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao salvar extrato:", err);
      toast.error("Erro ao importar extrato: " + (err?.message || err), {
        id: toastId,
      });
      setIsImporting(false);
    }
  };

  const activeTutorial = BANK_TUTORIALS[selectedTutorialBank] || BANK_TUTORIALS["nubank"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-border/80 shadow-2xl rounded-3xl">
        {/* Top Header */}
        <div className="bg-[#173b2c] p-5 text-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-lime-300 border border-white/10">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Padrão Universal OFX / CSV
            </span>
            <span className="text-[10px] text-white/70">100% Grátis & Sem APIs</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Importar Extrato Bancário
          </h2>
          <p className="text-xs text-white/80 mt-1">
            Suba o arquivo .OFX ou .CSV do seu banco para atualizar extrato e gráficos sem digitar nada.
          </p>

          {/* Nav Tabs */}
          <div className="flex gap-2 mt-4 pt-2 border-t border-white/10">
            <button
              onClick={() => setActiveTab("import")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "import"
                  ? "bg-white text-[#173b2c] shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Importar Arquivo
            </button>
            <button
              onClick={() => setActiveTab("tutorial")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "tutorial"
                  ? "bg-white text-[#173b2c] shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Como Baixar o OFX?
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 bg-background">
          <AnimatePresence mode="wait">
            {activeTab === "import" ? (
              <motion.div
                key="import-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* Account Selection */}
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Selecione a Conta Destino
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full text-xs h-10 px-3 rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary"
                  >
                    {accounts && accounts.length > 0 ? (
                      accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (Saldo: R$ {acc.balance.toFixed(2)})
                        </option>
                      ))
                    ) : (
                      <option value="">Nenhuma conta cadastrada</option>
                    )}
                  </select>
                </div>

                {/* File Dropzone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".ofx,.csv,.txt"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    fileName
                      ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
                      : "border-border hover:border-emerald-500/50 hover:bg-secondary/40"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  {fileName ? (
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {fileName}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Clique para escolher outro arquivo
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Clique para selecionar o arquivo .OFX ou .CSV
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Suporta extratos do Nubank, Itaú, Inter, Bradesco, BB, Santander, etc.
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview of Parsed Transactions */}
                {parsedData && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        Pré-visualização ({parsedData.transactions.length} lançamentos)
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Deduplicação Ativa
                      </span>
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded-xl border border-border/60 p-2 space-y-1.5 bg-secondary/20">
                      {parsedData.transactions.slice(0, 6).map((tx, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-background border border-border/40"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground font-mono shrink-0">
                              {tx.date.substring(5)}
                            </span>
                            <span className="font-semibold truncate">{tx.description}</span>
                          </div>
                          <span
                            className={`font-bold shrink-0 ${
                              tx.type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {tx.type === "expense" ? "-" : "+"}R$ {tx.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Import Button */}
                <Button
                  onClick={handleConfirmImport}
                  disabled={!parsedData || isImporting}
                  className="w-full h-11 rounded-2xl bg-[#173b2c] hover:bg-[#102a1f] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Confirmar Importação de Transações</span>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="tutorial-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-foreground block mb-2">
                    Selecione o seu Banco:
                  </label>

                  <div className="grid grid-cols-4 gap-2">
                    {POPULAR_BANKS.slice(0, 8).map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedTutorialBank(bank.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          selectedTutorialBank === bank.id
                            ? "border-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-500"
                            : "border-border/60 hover:bg-secondary"
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: bank.color }}
                        >
                          <BankLogo bankKeyOrName={bank.id} className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-semibold truncate w-full text-center">
                          {bank.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tutorial Box */}
                <div className="p-4 rounded-2xl border border-border/80 bg-secondary/30 space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Passo a Passo para Exportar do {POPULAR_BANKS.find((b) => b.id === selectedTutorialBank)?.name || "Banco"}:
                  </h4>

                  <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside pl-1 leading-relaxed">
                    {activeTutorial.steps.map((step, i) => (
                      <li key={i} className="py-0.5">
                        <span className="text-foreground font-semibold">{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="pt-2 border-t border-border/50 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeTutorial.tip}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setActiveTab("import")}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                  Pronto! Já Baixei Meu Extrato
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
