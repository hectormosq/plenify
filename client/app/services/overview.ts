import {
  hashByCategory,
  hashItem,
  Transaction,
  TransactionType,
} from "../models/transaction";
import dayjs from "dayjs";
import { TransactionService } from "./transaction";

interface TransactionsByMonth {
  [TransactionType.INCOME]: Transaction[];
  [TransactionType.EXPENSE]: Transaction[];
  hashByCategory: hashByCategory;
  total: number;
  totalExpense: number;
  totalIncome: number;
}

type categoryKey = string;
type YearMontkKey = string; // e.g., "202510" for October 2025

type TransactionsByCategoryAndMonth = Record<
  categoryKey,
  Record<YearMontkKey, hashItem>
>;

export default class OverviewService {
  _transactions: Transaction[];
  _transactionsByMonth: Record<string, TransactionsByMonth> = {};
  _transactionsByCategoryAndMonth: TransactionsByCategoryAndMonth = {};
  _totalIncome: number = 0;
  _totalExpense: number = 0;

  constructor(transactions: Transaction[]) {
    this._transactions = transactions;
    this._transactionsByMonth = this._groupByMonth();
    this._transactionsByCategoryAndMonth = this._groupByCategoryAndMonth();
  }

  getTransactionsByMonth(): Record<string, TransactionsByMonth> {
    return this._transactionsByMonth;
  }

  getTransactionsByCategoryAndMonth(): TransactionsByCategoryAndMonth {
    return this._transactionsByCategoryAndMonth;
  }

  getTotalIncome(): number {
    return this._totalIncome;
  }

  getTotalExpense(): number {
    return this._totalExpense;
  }

  private _groupByMonth(): Record<string, TransactionsByMonth> {
    return this._transactions.reduce((acc, transaction) => {
      const date = dayjs(transaction.date);
      const year = date.year();
      const month = String(date.month() + 1).padStart(2, "0");
      const yearMonth = `${year}${month}`;
      if (!acc[yearMonth]) {
        acc[yearMonth] = {
          [TransactionType.INCOME]: [],
          [TransactionType.EXPENSE]: [],
          hashByCategory: {},
          total: 0,
          totalExpense: 0,
          totalIncome: 0,
        };
      }
      acc[yearMonth] = this._recalculateMonthData(acc[yearMonth], transaction);
      this._calculateGrandTotals(transaction);
      return acc;
    }, {} as Record<string, TransactionsByMonth>);
  }

  private _recalculateMonthData(
    monthData: TransactionsByMonth,
    transaction: Transaction
  ): TransactionsByMonth {
    switch (transaction.transactionType) {
      case TransactionType.INCOME:
        monthData[TransactionType.INCOME].push(transaction);
        monthData.total += transaction.amount;
        monthData.totalIncome += transaction.amount;
        break;
      case TransactionType.EXPENSE:
        monthData[TransactionType.EXPENSE].push(transaction);
        monthData.total -= transaction.amount;
        monthData.totalExpense += transaction.amount;
        break;
      default:
        throw new Error(
          `Unknown transaction type: ${transaction.transactionType}`
        );
    }
    monthData.hashByCategory = this._recalculateHashByCategory(
      monthData.hashByCategory,
      transaction
    );
    return monthData;
  }

  private _calculateGrandTotals(transaction: Transaction) {
    switch (transaction.transactionType) {
      case TransactionType.INCOME:
        this._totalIncome += transaction.amount;
        break;
      case TransactionType.EXPENSE:
        this._totalExpense += transaction.amount;
        break;
      default:
        throw new Error(
          `Unknown transaction type: ${transaction.transactionType}`
        );
    }
  }

  private _recalculateHashByCategory(
    hashByCategory: hashByCategory = {},
    transaction: Transaction
  ): hashByCategory {
    return TransactionService.createHashList(transaction, hashByCategory);
  }

  private _groupByCategoryAndMonth(): TransactionsByCategoryAndMonth {
    const groupedData = {} as TransactionsByCategoryAndMonth;
    Object.keys(this._transactionsByMonth).forEach((yearMonth) => {
      Object.keys(this._transactionsByMonth[yearMonth].hashByCategory).forEach(
        (categoryKey) => {
          if (!groupedData[categoryKey]) {
            groupedData[categoryKey] = {};
          }
          groupedData[categoryKey][yearMonth] =
            this._transactionsByMonth[yearMonth].hashByCategory[categoryKey];
        }
      );
    });
    return groupedData;
  }
}
