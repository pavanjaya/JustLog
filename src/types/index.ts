export type TxType = "income" | "expense";

export type Category =
  | "Salary"
  | "Business"
  | "Transfer"
  | "Refund"
  | "Food & Drinks"
  | "Groceries"
  | "Transport"
  | "Education"
  | "Housing"
  | "Healthcare"
  | "Shopping"
  | "Entertainment"
  | "Bills"
  | "Travel"
  | "Investment"
  | "Other";

export interface Transaction {
  id: string;
  amount: number;
  type: TxType;
  category: Category;
  description: string;
  created_at: string; // ISO date string
}

export type View = "home" | "story" | "search" | "settings";

export interface CategoryMeta {
  emoji: string;
  bg: string;
}
