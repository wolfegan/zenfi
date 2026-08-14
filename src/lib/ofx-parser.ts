import { supabase } from "@/lib/supabase";

export interface ParsedTransaction {
  fitid?: string;
  type: "income" | "expense";
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  categoryName: string;
}

export interface ParsedOFXResult {
  bankId?: string;
  accountNumber?: string;
  balance?: number;
  transactions: ParsedTransaction[];
}

/**
 * Parses OFX (SGML/XML) content from Brazilian banks (Nubank, Itaú, Inter, BB, Bradesco, etc.)
 */
export function parseOFXContent(ofxText: string): ParsedOFXResult {
  const transactions: ParsedTransaction[] = [];
  let balance: number | undefined = undefined;
  let accountNumber: string | undefined = undefined;

  // Extract Account ID if available
  const acctMatch = ofxText.match(/<(?:ACCTID|BANKACCTID|ACCTID)>(.*?)(?:<\/|\r|\n)/i);
  if (acctMatch) accountNumber = acctMatch[1].trim();

  // Extract Ledger Balance if available
  const balMatch = ofxText.match(/<BALAMT>(.*?)(?:<\/|\r|\n)/i);
  if (balMatch) {
    const parsedBal = parseFloat(balMatch[1].replace(",", "."));
    if (!isNaN(parsedBal)) balance = parsedBal;
  }

  // Extract STMTTRN blocks
  const stmtBlocks = ofxText.split(/<STMTTRN>/i).slice(1);

  for (const block of stmtBlocks) {
    const endBlock = block.split(/<\/STMTTRN>/i)[0];

    // Extract TRNTYPE
    const typeMatch = endBlock.match(/<TRNTYPE>(.*?)(?:<\/|\r|\n)/i);
    const rawType = typeMatch ? typeMatch[1].trim().toUpperCase() : "";

    // Extract TRNAMT
    const amtMatch = endBlock.match(/<TRNAMT>(.*?)(?:<\/|\r|\n)/i);
    if (!amtMatch) continue;
    const rawAmount = parseFloat(amtMatch[1].replace(",", "."));
    if (isNaN(rawAmount) || rawAmount === 0) continue;

    // Extract DTPOSTED (Format: YYYYMMDDHHMMSS)
    const dateMatch = endBlock.match(/<DTPOSTED>(.*?)(?:<\/|\r|\n)/i);
    let dateStr = new Date().toISOString().split("T")[0];
    if (dateMatch) {
      const cleanDt = dateMatch[1].trim();
      if (cleanDt.length >= 8) {
        const yyyy = cleanDt.substring(0, 4);
        const mm = cleanDt.substring(4, 6);
        const dd = cleanDt.substring(6, 8);
        dateStr = `${yyyy}-${mm}-${dd}`;
      }
    }

    // Extract MEMO or NAME
    const memoMatch = endBlock.match(/<MEMO>(.*?)(?:<\/|\r|\n)/i);
    const nameMatch = endBlock.match(/<NAME>(.*?)(?:<\/|\r|\n)/i);
    const rawDesc = (memoMatch ? memoMatch[1] : nameMatch ? nameMatch[1] : "Lançamento OFX").trim();

    // Extract FITID for deduplication
    const fitidMatch = endBlock.match(/<FITID>(.*?)(?:<\/|\r|\n)/i);
    const fitid = fitidMatch ? fitidMatch[1].trim() : undefined;

    const isExpense = rawAmount < 0 || rawType === "DEBIT";
    const absAmount = Math.abs(rawAmount);

    // Auto-categorize based on description keywords
    const categoryName = guessCategoryFromDescription(rawDesc);

    transactions.push({
      fitid,
      type: isExpense ? "expense" : "income",
      amount: absAmount,
      date: dateStr,
      description: rawDesc,
      categoryName,
    });
  }

  return {
    accountNumber,
    balance,
    transactions,
  };
}

/**
 * Parses CSV bank statement content (Semicolon or Comma separated)
 */
export function parseCSVContent(csvText: string): ParsedOFXResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    const parts = line.split(/[;,]/);
    if (parts.length < 3) continue;

    // Check if line is header
    if (parts[0].toLowerCase().includes("data") || parts[1]?.toLowerCase().includes("descri")) {
      continue;
    }

    const dateRaw = parts[0].trim();
    const descRaw = parts[1].trim();
    const amtRaw = parts[2].trim().replace("R$", "").replace(/\s/g, "").replace(".", "").replace(",", ".");
    const numAmount = parseFloat(amtRaw);

    if (isNaN(numAmount)) continue;

    // Convert date DD/MM/YYYY to YYYY-MM-DD if needed
    let formattedDate = dateRaw;
    if (dateRaw.includes("/")) {
      const dateParts = dateRaw.split("/");
      if (dateParts.length === 3) {
        const dd = dateParts[0].padStart(2, "0");
        const mm = dateParts[1].padStart(2, "0");
        const yyyy = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
        formattedDate = `${yyyy}-${mm}-${dd}`;
      }
    }

    const isExpense = numAmount < 0;
    const absAmount = Math.abs(numAmount);

    transactions.push({
      type: isExpense ? "expense" : "income",
      amount: absAmount,
      date: formattedDate,
      description: descRaw || "Lançamento CSV",
      categoryName: guessCategoryFromDescription(descRaw),
    });
  }

  return { transactions };
}

function guessCategoryFromDescription(desc: string): string {
  const clean = desc.toLowerCase();

  if (clean.includes("mercado") || clean.includes("supermercado") || clean.includes("feira") || clean.includes("pao de acucar") || clean.includes("carrefour") || clean.includes("atacadao")) {
    return "Alimentação";
  }
  if (clean.includes("uber") || clean.includes("99") || clean.includes("posto") || clean.includes("combustivel") || clean.includes("estacionamento") || clean.includes("shell") || clean.includes("ipiranga")) {
    return "Transporte";
  }
  if (clean.includes("aluguel") || clean.includes("condominio") || clean.includes("luz") || clean.includes("energia") || clean.includes("agua") || clean.includes("internet") || clean.includes("cemig") || clean.includes("enel")) {
    return "Moradia";
  }
  if (clean.includes("farmacia") || clean.includes("drogasil") || clean.includes("droga") || clean.includes("medico") || clean.includes("hospital") || clean.includes("consulta")) {
    return "Saúde";
  }
  if (clean.includes("restaurante") || clean.includes("ifood") || clean.includes("outback") || clean.includes("madero") || clean.includes("cinema") || clean.includes("netflix") || clean.includes("spotify")) {
    return "Lazer";
  }
  if (clean.includes("salario") || clean.includes("proventos") || clean.includes("rendimento") || clean.includes("pagamento recebido") || clean.includes("freelance")) {
    return "Salário";
  }
  return "Outros";
}

/**
 * Saves parsed OFX/CSV transactions directly to Supabase for the authenticated user
 */
export async function saveParsedTransactionsToSupabase(
  parsedResult: ParsedOFXResult,
  accountId: string,
  userId: string
): Promise<{ added: number; skipped: number }> {
  if (!userId || !accountId) {
    throw new Error("Conta ou usuário não selecionado.");
  }

  // 1. Fetch user categories
  const { data: existingCats } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId);

  const defaultCatId = existingCats?.[0]?.id || "";

  let addedCount = 0;
  let skippedCount = 0;

  for (const tx of parsedResult.transactions) {
    const categoryId =
      existingCats?.find((c) => c.name.toLowerCase() === tx.categoryName.toLowerCase())?.id ||
      defaultCatId;

    if (!categoryId) continue;

    const txDesc = `[OFX] ${tx.description}`;

    // Deduplication check: check if same amount, description and date already exist
    const { data: existingTxs } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("description", txDesc)
      .eq("date", tx.date)
      .eq("amount", tx.amount);

    if (existingTxs && existingTxs.length > 0) {
      skippedCount++;
      continue;
    }

    const { error: insertErr } = await supabase.from("transactions").insert({
      user_id: userId,
      category_id: categoryId,
      amount: tx.amount,
      type: tx.type,
      description: txDesc,
      date: tx.date,
      is_fixed: false,
      is_credit_card: false,
    });

    if (!insertErr) {
      addedCount++;
    }
  }

  return { added: addedCount, skipped: skippedCount };
}
