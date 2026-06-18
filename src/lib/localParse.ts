const INCOME_KEYWORDS = ["salary", "income", "received", "from", "credit", "refund", "bonus", "freelance"];
const CATEGORY_MAP: Record<string, string> = {
  coffee: "Food & Drinks", tea: "Food & Drinks", food: "Food & Drinks", lunch: "Food & Drinks",
  dinner: "Food & Drinks", breakfast: "Food & Drinks", restaurant: "Food & Drinks", swiggy: "Food & Drinks", zomato: "Food & Drinks",
  grocery: "Groceries", groceries: "Groceries", vegetables: "Groceries", fruits: "Groceries", milk: "Groceries",
  petrol: "Transport", uber: "Transport", ola: "Transport", auto: "Transport", bus: "Transport", metro: "Transport", fuel: "Transport",
  school: "Education", fees: "Education", tuition: "Education", college: "Education", course: "Education",
  rent: "Housing", electricity: "Bills", wifi: "Bills", internet: "Bills", phone: "Bills", recharge: "Bills",
  medicine: "Healthcare", doctor: "Healthcare", hospital: "Healthcare", pharmacy: "Healthcare",
  movie: "Entertainment", netflix: "Entertainment", game: "Entertainment", amazon: "Shopping", shopping: "Shopping", clothes: "Shopping",
  salary: "Salary", income: "Salary", business: "Business", investment: "Investment", travel: "Travel",
};

export function localParse(text: string): Array<{ amount: number; type: "income" | "expense"; category: string; description: string }> {
  const lines = text.split(/[\n,·]+/).map(s => s.trim()).filter(Boolean);
  const segments: string[] = [];

  for (const line of lines) {
    const inlineMatches = [...line.matchAll(/(\d+(?:\.\d+)?)\s+([a-zA-Z][^0-9]*?)(?=\s*\d|$)/g)];
    if (inlineMatches.length > 1) {
      inlineMatches.forEach(m => segments.push((m[1] + " " + m[2]).trim()));
    } else {
      segments.push(line);
    }
  }

  const results = [];
  for (const seg of segments) {
    const amountMatch = seg.match(/\d+(\.\d+)?/);
    if (!amountMatch) continue;
    const amount = parseFloat(amountMatch[0]);
    if (amount <= 0) continue;

    const lower = seg.toLowerCase();
    const isIncome = INCOME_KEYWORDS.some(k => lower.includes(k));
    let category = "Other";
    for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(keyword)) { category = cat; break; }
    }
    if (isIncome && category === "Other") category = "Salary";

    const description = seg.replace(/\d+(\.\d+)?/g, "").replace(/[₹$]/g, "").trim()
      .split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Transaction";

    results.push({ amount, type: isIncome ? "income" : "expense" as "income" | "expense", category, description });
  }
  return results;
}
