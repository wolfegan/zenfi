/**
 * Zenfi Email Templates
 * Standardized HTML email templates featuring the Koala Mascot
 */

export interface BaseEmailProps {
  userName: string;
  mascotImageUrl?: string;
}

const DEFAULT_MASCOT_URL = "https://raw.githubusercontent.com/wolfegan/zenfi/main/public/mascot/zenfi_mascot_welcome.png";

/**
 * 1. Welcome Email (Boas-Vindas)
 */
export function renderWelcomeEmail({ userName, mascotImageUrl = DEFAULT_MASCOT_URL }: BaseEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Zenfi</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f3; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #173B2C;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f3; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540px" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e3e6e1; box-shadow: 0 10px 30px rgba(0,0,0,0.04); overflow: hidden; padding: 40px 32px; text-align: center;">
          <tr>
            <td align="center">
              <img src="${mascotImageUrl}" alt="Mascote Zenfi" width="160" height="160" style="display: block; margin: 0 auto 24px; border-radius: 20px; object-fit: cover;" />
            </td>
          </tr>
          <tr>
            <td align="center">
              <h1 style="font-size: 24px; font-weight: 800; color: #173B2C; margin: 0 0 12px; letter-spacing: -0.03em;">
                Boas-vindas ao Zenfi, ${userName}! 🐨
              </h1>
              <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 28px;">
                Estou muito feliz em ter você conosco! A partir de hoje, cuidar das suas contas, cartões e metas vai ser leve, simples e sem ansiedade.
              </p>
              <a href="https://zenfi.app/dashboard" style="display: inline-block; background-color: #173B2C; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 99px; box-shadow: 0 8px 20px rgba(23,59,44,0.2);">
                Acessar Meu Painel →
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 36px; border-top: 1px solid #f0f2ee; margin-top: 36px;">
              <p style="font-size: 11px; color: #9ca3af; margin: 0;">
                Zenfi — Dinheiro em ordem. Vida mais leve.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 2. Budget Alert Email (Alerta de Orçamento)
 */
export function renderBudgetAlertEmail({
  userName,
  categoryName,
  percentageUsed,
  mascotImageUrl = DEFAULT_MASCOT_URL,
}: BaseEmailProps & { categoryName: string; percentageUsed: number }): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Atenção com seu Orçamento</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f3; font-family: 'Inter', system-ui, sans-serif; color: #173B2C;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f3; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540px" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; border: 1px solid #fee2e2; padding: 40px 32px; text-align: center;">
          <tr>
            <td align="center">
              <img src="${mascotImageUrl}" alt="Alerta de Orçamento" width="160" height="160" style="display: block; margin: 0 auto 24px; border-radius: 20px;" />
            </td>
          </tr>
          <tr>
            <td align="center">
              <span style="display: inline-block; background-color: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                Alerta de Limite
              </span>
              <h1 style="font-size: 22px; font-weight: 800; color: #173B2C; margin: 0 0 12px;">
                Atenção com a categoria "${categoryName}"
              </h1>
              <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 24px;">
                Olá, ${userName}! Você já utilizou <strong>${percentageUsed}%</strong> do limite definido para <strong>${categoryName}</strong> este mês. Que tal dar uma olhada e planejar os próximos dias?
              </p>
              <a href="https://zenfi.app/budgets" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 99px;">
                Revisar Meus Orçamentos →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 3. Goal Achieved Email (Meta Concluída)
 */
export function renderGoalAchievedEmail({
  userName,
  goalName,
  mascotImageUrl = DEFAULT_MASCOT_URL,
}: BaseEmailProps & { goalName: string }): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Meta Concluída!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f3; font-family: 'Inter', system-ui, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f3; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540px" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; border: 1px solid #d1fae5; padding: 40px 32px; text-align: center;">
          <tr>
            <td align="center">
              <img src="${mascotImageUrl}" alt="Meta Concluída" width="160" height="160" style="display: block; margin: 0 auto 24px; border-radius: 20px;" />
            </td>
          </tr>
          <tr>
            <td align="center">
              <span style="display: inline-block; background-color: #d1fae5; color: #059669; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                🏆 Vitória Conquistada
              </span>
              <h1 style="font-size: 24px; font-weight: 800; color: #173B2C; margin: 0 0 12px;">
                Parabéns! Você alcançou "${goalName}"! 🎉
              </h1>
              <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 28px;">
                Sensacional, ${userName}! Sua disciplina e foco deram resultado. Sua meta <strong>"${goalName}"</strong> foi 100% concluída!
              </p>
              <a href="https://zenfi.app/goals" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 99px;">
                Ver Minhas Conquistas →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
