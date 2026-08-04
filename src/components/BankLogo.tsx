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

  // Authentic white vector logos for Brazilian banks
  switch (id) {
    case "nubank":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M4 17.5V6.5C4 5.4 4.9 4.5 6 4.5H6.5C7.6 4.5 8.5 5.4 8.5 6.5V13.2L14.7 5.5C15.2 4.9 16 4.5 16.8 4.5H18C19.1 4.5 20 5.4 20 6.5V17.5C20 18.6 19.1 19.5 18 19.5H17.5C16.4 19.5 15.5 18.6 15.5 17.5V10.8L9.3 18.5C8.8 19.1 8 19.5 7.2 19.5H6C4.9 19.5 4 18.6 4 17.5Z" />
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
          <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M6.5 16V9.5H8.2V16H6.5ZM7.35 8.3C6.8 8.3 6.4 7.9 6.4 7.35C6.4 6.8 6.8 6.4 7.35 6.4C7.9 6.4 8.3 6.8 8.3 7.35C8.3 7.9 7.9 8.3 7.35 8.3ZM9.5 16V9.5H11.2V10.8C11.6 9.9 12.6 9.3 13.7 9.3C15.5 9.3 16.5 10.6 16.5 12.6V16H14.8V12.8C14.8 11.6 14.1 10.9 13 10.9C11.9 10.9 11.2 11.7 11.2 13V16H9.5Z" />
        </svg>
      );

    case "bradesco":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M12 2.5C8 2.5 5 5.5 5 9C5 11.5 7 13.5 9.5 15L7 21.5H17L14.5 15C17 13.5 19 11.5 19 9C19 5.5 16 2.5 12 2.5ZM12 5.5C14.2 5.5 16 7.3 16 9.5C16 11 14.8 12.5 13.2 13.3L12 10.5L10.8 13.3C9.2 12.5 8 11 8 9.5C8 7.3 9.8 5.5 12 5.5Z" />
        </svg>
      );

    case "bb":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M7 3.5L2.5 8L7 12.5L11.5 8L7 3.5ZM17 3.5L12.5 8L17 12.5L21.5 8L17 3.5ZM7 11.5L2.5 16L7 20.5L11.5 16L7 11.5ZM17 11.5L12.5 16L17 20.5L21.5 16L17 11.5ZM12 7.5L7.5 12L12 16.5L16.5 12L12 7.5Z" />
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
          <path d="M11.9 2C10.7 4.2 8.5 6.3 8.5 9c0 2.8 2.2 5 5 5s5-2.2 5-5c0-1.4-.6-2.7-1.5-3.6.3 1.1.2 2.2-.4 3-.6.8-1.5 1.1-2.4 1.1s-1.7-.5-2.1-1.3c-.6-1.2-.2-2.7.8-4.2-1.3 1-2 2.5-2 4 0 2.2 1.8 4 4 4s4-1.8 4-4c0-2.5-2.3-4.8-4.5-7z" />
        </svg>
      );

    case "caixa":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M3.5 4L10 12L3.5 20H7.5L12 14.5L16.5 20H20.5L14 12L20.5 4H16.5L12 9.5L7.5 4H3.5Z" />
        </svg>
      );

    case "inter":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M3.5 7H7.5V17H3.5V7ZM9.5 7H14.5C17 7 19 8.8 19 11.2C19 13.6 17 15.4 14.5 15.4H12.2V17H9.5V7ZM12.2 9.2V13.2H14.2C15.3 13.2 16.3 12.3 16.3 11.2C16.3 10.1 15.3 9.2 14.2 9.2H12.2Z" />
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
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M10 7.5C7.5 7.5 5.5 9.5 5.5 12C5.5 14.5 7.5 16.5 10 16.5C11.5 16.5 12.5 15.8 13 14.5H10.5" />
          <path d="M15.5 7.5V16.5" />
          <path d="M15.5 12H19C19 9.5 17.5 7.5 15.5 7.5" />
        </svg>
      );

    case "btg":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M4 6.5H8.8C10.5 6.5 11.8 7.4 11.8 8.8C11.8 9.7 11.1 10.5 10.1 10.8C11.3 11.1 12.2 12.1 12.2 13.6C12.2 15.3 10.7 16.5 8.8 16.5H4V6.5ZM6.8 8.7V10.3H8.5C9.1 10.3 9.5 9.9 9.5 9.5C9.5 9.1 9.1 8.7 8.5 8.7H6.8ZM6.8 12V14.3H8.8C9.5 14.3 10 13.8 10 13.15C10 12.5 9.5 12 8.8 12H6.8ZM13.5 6.5H19.5V8.7H17.7V16.5H15.3V8.7H13.5V6.5Z" />
        </svg>
      );

    case "sicoob":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M12 2L3.5 6.2V11.5C3.5 16.8 7.2 21.5 12 23C16.8 21.5 20.5 16.8 20.5 11.5V6.2L12 2ZM12 5.2L18 8.2V11.5C18 15.4 15.4 19.2 12 20.5C8.6 19.2 6 15.4 6 11.5V8.2L12 5.2Z" />
        </svg>
      );

    case "sicredi":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M12 2.5C7.5 2.5 4 5 2.5 9C4 9 6 8.5 7.5 7.5C9 6.5 10.5 4.5 12 2.5ZM12 2.5C16.5 2.5 20 5 21.5 9C20 9 18 8.5 16.5 7.5C15 6.5 13.5 4.5 12 2.5ZM12 21.5C7.5 21.5 4 19 2.5 15C4 15 6 15.5 7.5 16.5C9 17.5 10.5 19.5 12 21.5ZM12 21.5C16.5 21.5 20 19 21.5 15C20 15 18 15.5 16.5 16.5C15 17.5 13.5 19.5 12 21.5Z" />
        </svg>
      );

    case "mercadopago":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M16.5 8C15 6.5 13 6 11 6.5L8.5 4L4 8.5L7.5 12L6 13.5L8.5 16L10 14.5L12.5 17C14.5 17.5 16.5 17 18 15.5C20 13.5 20 10 16.5 8ZM8.5 7L10 8.5L8 10.5L6.5 9L8.5 7ZM15 14C14 15 12.5 15.3 11.2 14.8L14.5 11.5C15 11 15 10.2 14.5 9.7C14 9.2 13.2 9.2 12.7 9.7L9.4 13C8.9 11.7 9.2 10.2 10.2 9.2C11.5 7.9 13.5 7.9 14.8 9.2C16.1 10.5 16.1 12.7 15 14Z" />
        </svg>
      );

    case "picpay":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M4 4H12C15.3 4 18 6.7 18 10C18 13.3 15.3 16 12 16H8V20H4V4ZM8 8V12H12C13.1 12 14 11.1 14 10C14 8.9 13.1 8 12 8H8Z" />
        </svg>
      );

    case "xp":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M3.5 4.5L9.8 12L3.5 19.5H7.2L11.8 14L16.4 19.5H20.2L13.8 12L20.2 4.5H16.4L11.8 10L7.2 4.5H3.5Z" />
        </svg>
      );

    case "pagbank":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM8 17V7H12.5C14.4 7 16 8.6 16 10.5C16 12.4 14.4 14 12.5 14H10.5V17H8ZM10.5 9V12H12.5C13.3 12 14 11.3 14 10.5C14 9.7 13.3 9 12.5 9H10.5Z" />
        </svg>
      );

    case "neon":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M5 19V5L15 15V5H19V19L9 9V19H5Z" />
        </svg>
      );

    default:
      if (type === "savings") return <PiggyBank className={className} size={size} />;
      if (type === "cash") return <Banknote className={className} size={size} />;
      if (type === "other") return <Building2 className={className} size={size} />;
      return <Wallet className={className} size={size} />;
  }
}
