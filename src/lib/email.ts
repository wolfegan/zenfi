import { Resend } from "resend";

// Singleton instance for Resend API client
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Sends a transactional email using Resend API
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = "Zenfi <atendimento@zenfi.app>",
}: SendEmailOptions) {
  if (!resend) {
    console.warn("[Email Service] Resend API Key is missing. Email simulated:", { to, subject });
    return { success: true, simulated: true };
  }

  try {
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error("[Email Service] Error sending email:", error);
    return { success: false, error };
  }
}
