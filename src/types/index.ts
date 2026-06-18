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

export interface Space {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  include_in_personal: boolean;
  people_count: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  space_id?: string;
  spaceName?: string; // in-memory only — set when loaded from a linked space
  amount: number;
  type: TxType;
  category: Category;
  description: string;
  created_at: string;
}

export type View = "home" | "story" | "search" | "settings";

export interface CategoryMeta {
  icon: string;
  bg: string;
}
