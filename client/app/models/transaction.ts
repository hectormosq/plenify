import { currency } from "./currencies";
export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum UtilsType {
  ALL = 'ALL'
}

export type TransactionByType = Record<
  TransactionType | UtilsType.ALL,
  Transaction[]
>;
export interface Transaction {
  id?: string;
  account?: string
  transactionType: TransactionType;
  date: Date;
  description: string;
  amount: number;
  currency?: currency;
  tags: string[];
}

export type TransactionDefaultForm = Omit<Transaction, "amount"> & {
  amount: number | null;
};
