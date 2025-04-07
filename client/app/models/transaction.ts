import { currency } from "./currencies";
export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export interface Transaction {
  id?: string;
  transactionType: TransactionType;
  date: Date;
  description: string;
  amount: number;
  currency?: currency;
  tags?: string[];
}
