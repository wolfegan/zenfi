import { useState, useEffect } from "react";

export function getStoredHideBalance(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("zenfi_hide_balance") === "true";
  } catch (e) {
    return false;
  }
}

export function setStoredHideBalance(hide: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("zenfi_hide_balance", String(hide));
  } catch (e) {}

  window.dispatchEvent(new CustomEvent("zenfi:privacy-change", { detail: hide }));
}

export function usePrivacy() {
  const [hideBalance, setHideBalanceState] = useState<boolean>(() => getStoredHideBalance());

  useEffect(() => {
    // Sync initial state
    setHideBalanceState(getStoredHideBalance());

    const handlePrivacyChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === "boolean") {
        setHideBalanceState(customEvent.detail);
      }
    };

    window.addEventListener("zenfi:privacy-change", handlePrivacyChange);
    return () => {
      window.removeEventListener("zenfi:privacy-change", handlePrivacyChange);
    };
  }, []);

  const toggleHideBalance = () => {
    const next = !hideBalance;
    setStoredHideBalance(next);
  };

  return {
    hideBalance,
    toggleHideBalance,
    setHideBalance: (hide: boolean) => setStoredHideBalance(hide),
  };
}
