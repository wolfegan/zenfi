import axios from "axios";
import { supabase } from "@/lib/supabase";
import { findBankPreset } from "@/components/BankLogo";

export const PLUGGY_CLIENT_ID = import.meta.env.VITE_PLUGGY_CLIENT_ID || "e276b98a-4518-4a6f-8876-96902baf5794";
export const PLUGGY_CLIENT_SECRET = import.meta.env.VITE_PLUGGY_CLIENT_SECRET || "ACcDNycFVojjES12VmU4850I-mdA7dRfddaQlxvTgos";
export const PLUGGY_API_KEY = import.meta.env.VITE_PLUGGY_API_KEY || "";

export interface PluggyBankConnection {
  id: string;
  bankId: string;
  bankName: string;
  color: string;
  status: "CONNECTED" | "SYNCING" | "ERROR";
  lastSyncedAt: string;
}

export async function fetchPluggyApiKey(): Promise<string> {
  if (PLUGGY_API_KEY) return PLUGGY_API_KEY;
  try {
    const res = await axios.post("https://api.pluggy.ai/auth", {
      clientId: PLUGGY_CLIENT_ID,
      clientSecret: PLUGGY_CLIENT_SECRET,
    });
    return res.data.apiKey;
  } catch (err) {
    console.warn("Autenticação com Pluggy API falhou:", err);
    return "";
  }
}

export async function fetchPluggyConnectToken(itemId?: string): Promise<string> {
  try {
    const apiKey = await fetchPluggyApiKey();
    if (!apiKey) return "";
    const res = await axios.post(
      "https://api.pluggy.ai/connect_token",
      { itemId },
      { headers: { "X-API-KEY": apiKey } }
    );
    return res.data.accessToken;
  } catch (err) {
    console.warn("Erro ao gerar Connect Token na Pluggy:", err);
    return "";
  }
}

// ─── Preset Bank Mock Generators for Open Finance Sandbox ──────────────────────
const BANK_MOCK_CONFIGS: Record<string, {
  accounts: Array<{ name: string; type: "checking" | "savings" | "cash" | "other"; balance: number; color: string }>;
  transactions: Array<{
    description: string;
    amount: number;
    type: "income" | "expense";
    categoryName: string;
    isFixed: boolean;
    daysAgo: number;
  }>;
}> = {
  nubank: {
    accounts: [
      { name: "Nubank (Conta Corrente)", type: "checking", balance: 3420.50, color: "#820ad1" },
      { name: "Nubank (Caixinha Reserva)", type: "savings", balance: 12500.00, color: "#820ad1" },
    ],
    transactions: [
      { description: "[PIX] Mercado Livre Brasil", amount: 149.90, type: "expense", categoryName: "Outros", isFixed: false, daysAgo: 1 },
      { description: "[Débito] Supermercado Pão de Açúcar", amount: 284.50, type: "expense", categoryName: "Alimentação", isFixed: false, daysAgo: 2 },
      { description: "[PIX] Transferência Recebida - Freelance", amount: 1800.00, type: "income", categoryName: "Salário", isFixed: false, daysAgo: 3 },
      { description: "[Débito] Uber Trips", amount: 32.90, type: "expense", categoryName: "Transporte", isFixed: false, daysAgo: 4 },
      { description: "[PIX] Rest. Madero Jantar", amount: 165.00, type: "expense", categoryName: "Lazer", isFixed: false, daysAgo: 5 },
    ],
  },
  itau: {
    accounts: [
      { name: "Itaú Personnalité (Corrente)", type: "checking", balance: 5890.00, color: "#ec7000" },
      { name: "Itaú Poupança", type: "savings", balance: 8400.00, color: "#ec7000" },
    ],
    transactions: [
      { description: "[Débito] Posto Ipiranga Combustível", amount: 220.00, type: "expense", categoryName: "Transporte", isFixed: false, daysAgo: 1 },
      { description: "[PIX] Salário Empresa Tecnológica", amount: 6500.00, type: "income", categoryName: "Salário", isFixed: true, daysAgo: 5 },
      { description: "[Débito] Drogaria São Paulo", amount: 98.40, type: "expense", categoryName: "Saúde", isFixed: false, daysAgo: 6 },
      { description: "[Débito] Aluguel Imóvel Residencial", amount: 2100.00, type: "expense", categoryName: "Moradia", isFixed: true, daysAgo: 10 },
    ],
  },
  inter: {
    accounts: [
      { name: "Banco Inter (Conta Digital)", type: "checking", balance: 4150.80, color: "#ff5700" },
      { name: "Inter Investimentos", type: "savings", balance: 15200.00, color: "#ff5700" },
    ],
    transactions: [
      { description: "[PIX] Cashback Recebido Inter", amount: 45.20, type: "income", categoryName: "Outros", isFixed: false, daysAgo: 2 },
      { description: "[Débito] Feira Orgânica Semanal", amount: 112.00, type: "expense", categoryName: "Alimentação", isFixed: false, daysAgo: 3 },
      { description: "[Débito] Assinatura Netflix & Spotify", amount: 79.80, type: "expense", categoryName: "Lazer", isFixed: true, daysAgo: 7 },
    ],
  },
  bradesco: {
    accounts: [
      { name: "Bradesco Prime (Corrente)", type: "checking", balance: 2850.30, color: "#cc092f" },
    ],
    transactions: [
      { description: "[Débito] Seguro Auto Bradesco", amount: 310.00, type: "expense", categoryName: "Transporte", isFixed: true, daysAgo: 4 },
      { description: "[PIX] Reembolso de Despesas", amount: 450.00, type: "income", categoryName: "Outros", isFixed: false, daysAgo: 8 },
    ],
  },
  bb: {
    accounts: [
      { name: "Banco do Brasil (Conta Corrente)", type: "checking", balance: 3910.00, color: "#005aa5" },
    ],
    transactions: [
      { description: "[PIX] Proventos & Dividendos", amount: 320.00, type: "income", categoryName: "Salário", isFixed: false, daysAgo: 3 },
      { description: "[Débito] Conta de Luz Cemig", amount: 185.40, type: "expense", categoryName: "Moradia", isFixed: true, daysAgo: 9 },
    ],
  },
  santander: {
    accounts: [
      { name: "Santander Select (Corrente)", type: "checking", balance: 4620.00, color: "#ec0000" },
    ],
    transactions: [
      { description: "[PIX] Venda de Equipamento Usado", amount: 850.00, type: "income", categoryName: "Outros", isFixed: false, daysAgo: 2 },
      { description: "[Débito] Restaurante Outback", amount: 215.00, type: "expense", categoryName: "Lazer", isFixed: false, daysAgo: 5 },
    ],
  },
  c6: {
    accounts: [
      { name: "C6 Bank (Conta Global)", type: "checking", balance: 2980.00, color: "#18181b" },
    ],
    transactions: [
      { description: "[Débito] Sem Parar Pedágio", amount: 42.50, type: "expense", categoryName: "Transporte", isFixed: false, daysAgo: 1 },
      { description: "[PIX] Pagamento PIX Loja Eletrônicos", amount: 399.00, type: "expense", categoryName: "Outros", isFixed: false, daysAgo: 6 },
    ],
  },
};

export async function syncOpenFinanceBank(bankPresetId: string, userId: string): Promise<{
  bankName: string;
  accountsCreated: number;
  transactionsCreated: number;
}> {
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  const preset = findBankPreset(bankPresetId);
  const bankName = preset ? preset.name : "Banco Conectado";
  const bankConfig = BANK_MOCK_CONFIGS[bankPresetId] || {
    accounts: [
      { name: `${bankName} (Conta Corrente)`, type: "checking", balance: 3500.00, color: preset?.color || "#173b2c" }
    ],
    transactions: [
      { description: "[PIX] Transferência Automática Open Finance", amount: 1200.00, type: "income", categoryName: "Salário", isFixed: false, daysAgo: 2 },
      { description: "[Débito] Compra Comercial Sincronizada", amount: 145.00, type: "expense", categoryName: "Alimentação", isFixed: false, daysAgo: 3 },
    ]
  };

  // 1. Fetch user's existing categories from Supabase
  const { data: existingCats } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", userId);

  let createdAccountsCount = 0;
  let createdTxsCount = 0;

  for (const accConfig of bankConfig.accounts) {
    // Check if account already exists to prevent duplicate insertion
    const { data: existingAccs } = await supabase
      .from("accounts")
      .select("id, balance")
      .eq("user_id", userId)
      .eq("name", accConfig.name);

    let targetAccountId = "";

    if (existingAccs && existingAccs.length > 0) {
      targetAccountId = existingAccs[0].id;
      // Update balance with fresh Open Finance sync balance
      await supabase
        .from("accounts")
        .update({ balance: accConfig.balance })
        .eq("id", targetAccountId);
    } else {
      const { data: newAcc, error: accErr } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          name: accConfig.name,
          type: accConfig.type,
          balance: accConfig.balance,
          color: accConfig.color,
        })
        .select()
        .single();

      if (accErr) {
        console.error("Erro ao criar conta no Supabase:", accErr);
        continue;
      }
      targetAccountId = newAcc.id;
      createdAccountsCount++;
    }

    // Insert Open Finance transactions for this account
    for (const txConfig of bankConfig.transactions) {
      let categoryId = existingCats?.find(
        (c) => c.name.toLowerCase() === txConfig.categoryName.toLowerCase()
      )?.id;

      if (!categoryId && existingCats && existingCats.length > 0) {
        categoryId = existingCats[0].id;
      }

      if (categoryId) {
        const txDate = new Date();
        txDate.setDate(txDate.getDate() - txConfig.daysAgo);
        const formattedDate = txDate.toISOString().split("T")[0];

        const txDescription = `[${bankName}] ${txConfig.description}`;

        // Check if transaction with exact same description and date already exists
        const { data: existingTxs } = await supabase
          .from("transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("description", txDescription)
          .eq("date", formattedDate);

        if (!existingTxs || existingTxs.length === 0) {
          await supabase.from("transactions").insert({
            user_id: userId,
            category_id: categoryId,
            amount: txConfig.amount,
            type: txConfig.type,
            description: txDescription,
            date: formattedDate,
            is_fixed: txConfig.isFixed,
            is_credit_card: false,
          });
          createdTxsCount++;
        }
      }
    }
  }

  return {
    bankName,
    accountsCreated: createdAccountsCount,
    transactionsCreated: createdTxsCount,
  };
}

export async function syncRealPluggyItemToSupabase(itemId: string, userId: string): Promise<{
  bankName: string;
  accountsCreated: number;
  transactionsCreated: number;
}> {
  if (!userId || !itemId) {
    throw new Error("ID do usuário ou Item da Pluggy inválido.");
  }

  const apiKey = await fetchPluggyApiKey();
  if (!apiKey) {
    throw new Error("Não foi possível autenticar na Pluggy API.");
  }

  // 1. Fetch Item details (bank name, connector)
  let bankName = "Banco Conectado";
  try {
    const itemRes = await axios.get(`https://api.pluggy.ai/items/${itemId}`, {
      headers: { "X-API-KEY": apiKey },
    });
    if (itemRes.data?.connector?.name) {
      bankName = itemRes.data.connector.name;
    }
  } catch (err) {
    console.warn("Could not fetch item info:", err);
  }

  // 2. Fetch real accounts for this item
  const accountsRes = await axios.get(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  const pluggyAccounts = accountsRes.data?.results || [];

  // 3. Fetch user's categories in Supabase
  const { data: existingCats } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", userId);

  const defaultCatId = existingCats?.[0]?.id || "";

  let createdAccountsCount = 0;
  let createdTxsCount = 0;

  const preset = findBankPreset(bankName);
  const color = preset?.color || "#173b2c";

  for (const pluggyAcc of pluggyAccounts) {
    const accType: "checking" | "savings" | "cash" | "other" =
      pluggyAcc.type === "SAVINGS"
        ? "savings"
        : pluggyAcc.type === "INVESTMENT"
        ? "savings"
        : "checking";

    const accName = pluggyAcc.name || `${bankName} (${pluggyAcc.number || "Conta"})`;
    const accBalance = Math.abs(pluggyAcc.balance || 0);

    const { data: existingAccs } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("name", accName);

    let targetAccountId = "";
    if (existingAccs && existingAccs.length > 0) {
      targetAccountId = existingAccs[0].id;
      await supabase
        .from("accounts")
        .update({ balance: accBalance })
        .eq("id", targetAccountId);
    } else {
      const { data: newAcc } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          name: accName,
          type: accType,
          balance: accBalance,
          color,
        })
        .select()
        .single();

      if (newAcc) {
        targetAccountId = newAcc.id;
        createdAccountsCount++;
      }
    }

    // Fetch real transactions for this account
    try {
      const txsRes = await axios.get(
        `https://api.pluggy.ai/transactions?accountId=${pluggyAcc.id}`,
        { headers: { "X-API-KEY": apiKey } }
      );
      const pluggyTxs = txsRes.data?.results || [];

      for (const tx of pluggyTxs) {
        const rawAmount = tx.amount || 0;
        const txType: "income" | "expense" = rawAmount < 0 ? "expense" : "income";
        const absAmount = Math.abs(rawAmount);
        const txDate = (tx.date || new Date().toISOString()).split("T")[0];
        const txDesc = `[${bankName}] ${tx.description || "Lançamento Open Finance"}`;

        const { data: existingTxs } = await supabase
          .from("transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("description", txDesc)
          .eq("date", txDate);

        if (!existingTxs || existingTxs.length === 0) {
          if (defaultCatId) {
            await supabase.from("transactions").insert({
              user_id: userId,
              category_id: defaultCatId,
              amount: absAmount,
              type: txType,
              description: txDesc,
              date: txDate,
              is_fixed: false,
              is_credit_card: false,
            });
            createdTxsCount++;
          }
        }
      }
    } catch (txErr) {
      console.warn("Could not fetch transactions for account:", pluggyAcc.id, txErr);
    }
  }

  return {
    bankName,
    accountsCreated: createdAccountsCount,
    transactionsCreated: createdTxsCount,
  };
}
