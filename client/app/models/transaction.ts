import { currency } from "./currencies";

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum UtilsType {
  ALL = "ALL",
}

export type TransactionByType = Record<
  TransactionType | UtilsType.ALL,
  Transaction[]
>;
export interface Transaction {
  id?: string;
  account?: string;
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

export type hashItem = {
  categoryKey: string;
  amount: number;
  children: Record<string, hashItem>;
  transactionsByType: TransactionByType;
  parent?: hashItem;
};
export type hashByCategory = Record<string, hashItem>;
export interface TransactionsByMonth {
  hashByCategory: hashByCategory;
  total: number;
  totalExpense: number;
  totalIncome: number;
}
export type categoryKey = string;
export type YearMontkKey = string; // e.g., "202510" for October 2025
export interface TransactionMonthDetails {
  month: Record<YearMontkKey, hashItem>;
  children: TransactionsByCategoryAndMonth;
}
export type TransactionsByCategoryAndMonth = Record<
  categoryKey,
  TransactionMonthDetails
>;
