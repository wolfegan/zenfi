import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Copy, Check, Percent, Sparkles, Delete } from "lucide-react";
import { toast } from "sonner";

interface FinancialCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinancialCalculatorModal({
  open,
  onOpenChange,
}: FinancialCalculatorModalProps) {
  const [display, setDisplay] = useState("0");
  const [history, setHistory] = useState("");
  const [copied, setCopied] = useState(false);

  const handleDigit = (digit: string) => {
    if (display === "0" || display === "Erro") {
      setDisplay(digit);
    } else {
      setDisplay((prev) => prev + digit);
    }
  };

  const handleOperator = (op: string) => {
    if (display === "Erro") return;
    const lastChar = display.slice(-1);
    if (["+", "-", "*", "/"].includes(lastChar)) {
      setDisplay((prev) => prev.slice(0, -1) + op);
    } else {
      setDisplay((prev) => prev + op);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setHistory("");
  };

  const handleDelete = () => {
    if (display.length <= 1 || display === "Erro") {
      setDisplay("0");
    } else {
      setDisplay((prev) => prev.slice(0, -1));
    }
  };

  const handleEvaluate = () => {
    try {
      const expression = display.replace(/×/g, "*").replace(/÷/g, "/");
      // Safe evaluation using Function
      const result = new Function(`return ${expression}`)();
      if (isNaN(result) || !isFinite(result)) {
        setDisplay("Erro");
      } else {
        const formatted = Number(result.toFixed(4)).toString();
        setHistory(`${display} =`);
        setDisplay(formatted);
      }
    } catch {
      setDisplay("Erro");
    }
  };

  const handlePercent = () => {
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        setDisplay((val / 100).toString());
      }
    } catch {
      setDisplay("Erro");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    toast.success("Valor copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShortcutDiscount = (percentage: number) => {
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        const discounted = val * (1 - percentage / 100);
        setHistory(`${val} com -${percentage}%`);
        setDisplay(discounted.toFixed(2));
      }
    } catch {
      setDisplay("Erro");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] p-5 rounded-3xl border-border/80 shadow-2xl bg-card">
        <DialogHeader className="mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold">
                Calculadora Rápida
              </DialogTitle>
              <DialogDescription className="text-[11px]">
                Faça contas livremente. Não altera suas transações.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Display Screen */}
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border/60 text-right space-y-1 relative">
          <div className="text-[11px] text-muted-foreground font-mono h-4 overflow-hidden">
            {history}
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground overflow-x-auto whitespace-nowrap scrollbar-none">
            {display}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute left-3 top-3 text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 bg-background/80 px-2 py-0.5 rounded-lg border border-border/40 transition-all"
            title="Copiar resultado"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copiado" : "Copiar"}</span>
          </button>
        </div>

        {/* Quick Discount Shortcuts */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleShortcutDiscount(10)}
            className="py-1 rounded-xl bg-secondary/60 hover:bg-secondary text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-all"
          >
            -10% Desconto
          </button>
          <button
            type="button"
            onClick={() => handleShortcutDiscount(15)}
            className="py-1 rounded-xl bg-secondary/60 hover:bg-secondary text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-all"
          >
            -15% Desconto
          </button>
          <button
            type="button"
            onClick={() => handleShortcutDiscount(20)}
            className="py-1 rounded-xl bg-secondary/60 hover:bg-secondary text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-all"
          >
            -20% Desconto
          </button>
        </div>

        {/* Calculator Keypad */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleClear}
            className="h-11 font-bold text-rose-500 hover:text-rose-600 rounded-2xl text-xs"
          >
            AC
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="h-11 font-bold text-muted-foreground hover:text-foreground rounded-2xl text-xs"
          >
            <Delete className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handlePercent}
            className="h-11 font-bold text-muted-foreground hover:text-foreground rounded-2xl text-xs"
          >
            %
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOperator("/")}
            className="h-11 font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-2xl text-sm"
          >
            ÷
          </Button>

          <Button variant="outline" onClick={() => handleDigit("7")} className="h-11 font-semibold rounded-2xl text-sm">
            7
          </Button>
          <Button variant="outline" onClick={() => handleDigit("8")} className="h-11 font-semibold rounded-2xl text-sm">
            8
          </Button>
          <Button variant="outline" onClick={() => handleDigit("9")} className="h-11 font-semibold rounded-2xl text-sm">
            9
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOperator("*")}
            className="h-11 font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-2xl text-sm"
          >
            ×
          </Button>

          <Button variant="outline" onClick={() => handleDigit("4")} className="h-11 font-semibold rounded-2xl text-sm">
            4
          </Button>
          <Button variant="outline" onClick={() => handleDigit("5")} className="h-11 font-semibold rounded-2xl text-sm">
            5
          </Button>
          <Button variant="outline" onClick={() => handleDigit("6")} className="h-11 font-semibold rounded-2xl text-sm">
            6
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOperator("-")}
            className="h-11 font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-2xl text-sm"
          >
            -
          </Button>

          <Button variant="outline" onClick={() => handleDigit("1")} className="h-11 font-semibold rounded-2xl text-sm">
            1
          </Button>
          <Button variant="outline" onClick={() => handleDigit("2")} className="h-11 font-semibold rounded-2xl text-sm">
            2
          </Button>
          <Button variant="outline" onClick={() => handleDigit("3")} className="h-11 font-semibold rounded-2xl text-sm">
            3
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOperator("+")}
            className="h-11 font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-2xl text-sm"
          >
            +
          </Button>

          <Button variant="outline" onClick={() => handleDigit("0")} className="h-11 font-semibold col-span-2 rounded-2xl text-sm">
            0
          </Button>
          <Button variant="outline" onClick={() => handleDigit(".")} className="h-11 font-semibold rounded-2xl text-sm">
            ,
          </Button>
          <Button
            onClick={handleEvaluate}
            className="h-11 font-bold bg-[#173b2c] hover:bg-[#102a1f] text-white rounded-2xl text-sm shadow-md"
          >
            =
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
