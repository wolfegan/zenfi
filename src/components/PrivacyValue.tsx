import React from "react";
import { usePrivacy } from "@/lib/privacy";

interface PrivacyValueProps {
  children: React.ReactNode;
  blurClass?: string;
  className?: string;
}

export function PrivacyValue({
  children,
  blurClass = "blur-md select-none opacity-60 transition-all duration-300 pointer-events-none inline-block",
  className = "",
}: PrivacyValueProps) {
  const { hideBalance } = usePrivacy();

  if (hideBalance) {
    return (
      <span className={`${blurClass} ${className}`}>
        {children}
      </span>
    );
  }

  return <>{children}</>;
}
