import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface DebtNotification {
  id: string;
  creditor: string;
  remaining_amount: number;
  due_date: string;
  is_paid: boolean;
}

const NOTIFICATION_KEY = "debt-notifications-shown";

function getShownNotifications(): string[] {
  try {
    const stored = sessionStorage.getItem(NOTIFICATION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markShown(ids: string[]) {
  try {
    const existing = getShownNotifications();
    sessionStorage.setItem(
      NOTIFICATION_KEY,
      JSON.stringify([...new Set([...existing, ...ids])]),
    );
  } catch {
    // ignore
  }
}

function requestBrowserPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  Notification.requestPermission();
  return false;
}

function sendBrowserNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  try {
    new Notification(title, { body, icon: "/logo.png" });
  } catch {
    // fallback: some browsers need a service worker
  }
}

function getDaysUntil(dueDateStr: string): { days: number; overdue: boolean } {
  const now = new Date();
  const dueDate = new Date(
    dueDateStr + (dueDateStr.includes("T") ? "" : "T00:00:00"),
  );
  const diff = dueDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return { days, overdue: days < 0 };
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function useDebtNotifications(debts: DebtNotification[] | undefined) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!debts || !debts.length || hasRun.current) return;

    const active = debts.filter((d) => !d.is_paid);
    if (!active.length) return;

    const shownIds: string[] = getShownNotifications().map(String);
    const newNotifications: DebtNotification[] = [];

    for (const debt of active) {
      if (shownIds.includes(debt.id)) continue;

      const { days, overdue } = getDaysUntil(debt.due_date);

      // Show for overdue or due within 7 days
      if (overdue || (days >= 0 && days <= 7)) {
        newNotifications.push(debt);
      }
    }

    if (!newNotifications.length) {
      hasRun.current = true;
      return;
    }

    // Request browser notification permission (one-time)
    requestBrowserPermission();

    // Show notifications
    for (const debt of newNotifications) {
      const { days, overdue } = getDaysUntil(debt.due_date);

      if (overdue) {
        const title = `💰 Dívida atrasada: ${debt.creditor}`;
        const body = `${formatCurrency(debt.remaining_amount)} — vencimento venceu!`;
        sendBrowserNotification(title, body);
        toast.error(title, {
          description: body,
          duration: 8000,
          action: {
            label: "Ver dívidas",
            onClick: () => window.location.assign("/debts"),
          },
        });
      } else {
        const dayLabel =
          days === 0
            ? "vence hoje!"
            : days === 1
              ? "vence amanhã!"
              : `vence em ${days} dias`;
        const title = `📅 ${debt.creditor} ${dayLabel}`;
        const body = `${formatCurrency(debt.remaining_amount)} restantes`;
        sendBrowserNotification(title, body);
        toast.warning(title, {
          description: body,
          duration: 8000,
          action: {
            label: "Pagar",
            onClick: () => window.location.assign("/debts"),
          },
        });
      }
    }

    markShown(newNotifications.map((d) => d.id));
    hasRun.current = true;
  }, [debts]);
}
