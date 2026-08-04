import React from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyInput } from "@/lib/utils";

interface BRLCurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChangeValue: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function BRLCurrencyInput({
  value,
  onChangeValue,
  className = "",
  placeholder = "R$ 0,00",
  ...props
}: BRLCurrencyInputProps) {
  const handleInputChange = (rawVal: string) => {
    const formatted = formatCurrencyInput(rawVal);
    onChangeValue(formatted);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      placeholder={placeholder}
      value={value}
      onInput={(e: React.FormEvent<HTMLInputElement>) => {
        handleInputChange((e.target as HTMLInputElement).value);
      }}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        handleInputChange(e.target.value);
      }}
      className={className}
    />
  );
}
