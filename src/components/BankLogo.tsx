import React from "react";
import { Wallet, PiggyBank, Banknote, Building2, Landmark } from "lucide-react";

export interface BankPreset {
  id: string;
  name: string;
  color: string;
  keywords: string[];
}

export const POPULAR_BANKS: BankPreset[] = [
  { id: "nubank", name: "Nubank", color: "#820ad1", keywords: ["nubank", "nu"] },
  { id: "itau", name: "Itaú", color: "#ec7000", keywords: ["itau", "itaú"] },
  { id: "bradesco", name: "Bradesco", color: "#cc092f", keywords: ["bradesco"] },
  { id: "bb", name: "Banco do Brasil", color: "#005aa5", keywords: ["banco do brasil", "bb"] },
  { id: "santander", name: "Santander", color: "#ec0000", keywords: ["santander"] },
  { id: "caixa", name: "Caixa Econômica", color: "#003399", keywords: ["caixa"] },
  { id: "inter", name: "Inter", color: "#ff5700", keywords: ["inter", "banco inter"] },
  { id: "c6", name: "C6 Bank", color: "#18181b", keywords: ["c6", "c6bank", "c6 bank"] },
  { id: "btg", name: "BTG Pactual", color: "#0f172a", keywords: ["btg", "btg pactual"] },
  { id: "sicoob", name: "Sicoob", color: "#003641", keywords: ["sicoob"] },
  { id: "sicredi", name: "Sicredi", color: "#00aa5b", keywords: ["sicredi"] },
  { id: "mercadopago", name: "Mercado Pago", color: "#00a8e8", keywords: ["mercado pago", "mercadopago"] },
  { id: "picpay", name: "PicPay", color: "#11c76f", keywords: ["picpay"] },
  { id: "xp", name: "XP Investimentos", color: "#000000", keywords: ["xp", "xp investimentos"] },
  { id: "pagbank", name: "PagBank", color: "#00a550", keywords: ["pagbank", "pagseguro"] },
  { id: "neon", name: "Neon", color: "#00e5ff", keywords: ["neon"] },
];

export function findBankPreset(nameOrKey: string): BankPreset | null {
  if (!nameOrKey) return null;
  const clean = nameOrKey.toLowerCase().trim();
  return (
    POPULAR_BANKS.find(
      (b) => b.id === clean || b.keywords.some((k) => clean.includes(k))
    ) || null
  );
}

interface BankLogoProps {
  bankKeyOrName?: string;
  type?: string;
  className?: string;
  size?: number;
}

export function BankLogo({
  bankKeyOrName = "",
  type,
  className = "w-5 h-5 text-white",
  size = 20,
}: BankLogoProps) {
  const preset = findBankPreset(bankKeyOrName);
  const id = preset ? preset.id : "";

  // Official Crisp White Vector SVGs for Brazilian Banks
  switch (id) {
    case "nubank":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Nubank Nu stylized logo */}
          <path d="M5 18V6l6 12V6" />
          <path d="M13 18V6l6 12V6" />
        </svg>
      );

    case "itau":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          {/* Itaú box + i logo */}
          <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <rect x="7.5" y="11.5" width="2" height="5" rx="1" />
          <path d="M12.5 12.5h4v4h-4z" />
        </svg>
      );

    case "bradesco":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Bradesco tree / pillars */}
          <path d="M12 3v18" />
          <path d="M6 9l6-6 6 6" />
          <path d="M6 15l6-6 6 6" />
          <path d="M4 21h16" />
        </svg>
      );

    case "bb":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Banco do Brasil interlocking squares */}
          <rect x="4" y="4" width="9" height="9" rx="1.5" />
          <rect x="11" y="11" width="9" height="9" rx="1.5" />
        </svg>
      );

    case "santander":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          {/* Santander Flame */}
          <path d="M12 3c-1.5 3-4 5.5-4 8.5 0 3 2.5 5.5 5 5.5s4.5-2.5 4.5-5c0-1.5-.5-3-1.5-4.5.5 1 1 2 1 3 0 1.5-1 2.5-2 2.5s-2-1.5-2-3c0-2.5 1.5-4.5 2-6.5-1 1-2.5 2.5-3 4.5" />
        </svg>
      );

    case "caixa":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Caixa X logo */}
          <path d="M6 6l12 12" />
          <path d="M18 6l-12 12" />
          <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
        </svg>
      );

    case "inter":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Inter logo */}
          <path d="M7 6h10" />
          <path d="M12 6v12" />
          <path d="M7 18h10" />
        </svg>
      );

    case "c6":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* C6 logo */}
          <path d="M10 8a4 4 0 1 0 0 8h2" />
          <path d="M16 8v8" />
        </svg>
      );

    case "btg":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* BTG logo */}
          <path d="M5 7h6a3 3 0 0 1 0 5H5" />
          <path d="M5 12h7a3 3 0 0 1 0 5H5" />
          <path d="M17 7v10" />
        </svg>
      );

    case "sicoob":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Sicoob pins */}
          <path d="M12 4v16" />
          <path d="M6 8l6-4 6 4" />
          <path d="M6 16l6 4 6-4" />
        </svg>
      );

    case "sicredi":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Sicredi leaf */}
          <path d="M12 3C6.5 3 3 6.5 3 12s3.5 9 9 9 9-3.5 9-9-3.5-9-9-9z" />
          <path d="M12 7v10" />
          <path d="M8 11l4-4 4 4" />
        </svg>
      );

    case "mercadopago":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Mercado Pago Handshake */}
          <path d="M7 11l4-4 4 4" />
          <path d="M11 7v10" />
          <rect x="3" y="4" width="18" height="16" rx="3" strokeWidth="1.5" />
        </svg>
      );

    case "picpay":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* PicPay P */}
          <path d="M7 20V4h6a4 4 0 0 1 0 8H7" />
          <circle cx="17" cy="16" r="2" fill="currentColor" />
        </svg>
      );

    case "xp":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* XP logo */}
          <path d="M5 6l6 6-6 6" />
          <path d="M11 6l6 6-6 6" />
          <path d="M19 6v12" />
        </svg>
      );

    case "pagbank":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* PagBank */}
          <circle cx="12" cy="12" r="9" />
          <path d="M9 16V8h4a2.5 2.5 0 0 1 0 5H9" />
        </svg>
      );

    case "neon":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Neon N */}
          <path d="M6 18V6l12 12V6" />
        </svg>
      );

    default:
      if (type === "savings") return <PiggyBank className={className} size={size} />;
      if (type === "cash") return <Banknote className={className} size={size} />;
      if (type === "other") return <Building2 className={className} size={size} />;
      return <Wallet className={className} size={size} />;
  }
}
