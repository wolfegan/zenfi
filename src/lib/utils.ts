import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseBRLAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;

  const digits = String(value).replace(/\D/g, "");
  if (!digits) return 0;

  return parseInt(digits, 10) / 100;
}

export function formatCurrencyInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "number") {
    if (isNaN(value)) return "";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";

  const cents = parseInt(digits, 10) / 100;
  return cents.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return "R$ 0,00";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

import * as LucideIcons from "lucide-react";

export function getCategoryIcon(iconName: string | undefined | null): any {
  if (!iconName) return LucideIcons.Tags;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Tags;
}
