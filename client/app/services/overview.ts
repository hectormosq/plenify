import {
  categoryKey,
  hashByCategory,
  hashItem,
  Transaction,
  TransactionMonthDetails,
  TransactionsByCategoryAndMonth,
  TransactionsByMonth,
  TransactionType,
  YearMontkKey,
} from "../models/transaction";
import dayjs from "dayjs";
import { TransactionService } from "./transaction";
import { DIFF_CATEGORY } from "../models/categories";

export default class OverviewService {
  _transactions: Transaction[];
  _transactionsByMonth: Record<string, TransactionsByMonth> = {};
  _transactionsByCategoryAndMonth: TransactionsByCategoryAndMonth = {};
  _totalIncome: number = 0;
  _totalExpense: number = 0;

  constructor(transactions: Transaction[]) {
    this._transactions = transactions;
    this._transactionsByMonth = this._groupByMonth();

    Object.keys(this._transactionsByMonth).forEach((yearMonth) => {
      this._transactionsByCategoryAndMonth = this._groupByCategoryAndMonth(
        this._transactionsByCategoryAndMonth,
        this._transactionsByMonth[yearMonth].hashByCategory,
        yearMonth
      );
    });
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

  private _groupByCategoryAndMonth(
    groupedData: TransactionsByCategoryAndMonth,
    transactionsByCategory: Record<categoryKey, hashItem>,
    yearMonthKey: YearMontkKey
  ): TransactionsByCategoryAndMonth {
    Object.keys(transactionsByCategory).forEach((categoryKey) => {
      if (!groupedData[categoryKey]) {
        groupedData[categoryKey] = { month: {}, children: {} };
      }
      groupedData[categoryKey].month[yearMonthKey] =
        transactionsByCategory[categoryKey];
      groupedData[categoryKey].children = this._groupByCategoryAndMonth(
        groupedData[categoryKey].children,
        transactionsByCategory[categoryKey].children,
        yearMonthKey
      );
      groupedData[categoryKey] = this._calculateDifferenceFromChildren(
        groupedData[categoryKey]
      );
    });
    return groupedData;
  }

  /**
   * Since we are grouping and summing in categories and sub categories,
   * we need to normalize all transactions with the same amount of categories and subcategories.
   * For those transactions missing the subcategory, we are creating an specialone for only visualization,
   * so in the overview chart sum of sub categories match with main category.
   * 
   *
   * @param transactionDetails
   * @returns
   */
  private _calculateDifferenceFromChildren(
    transactionDetails: TransactionMonthDetails
  ): TransactionMonthDetails {
    // For each month in this category, calculate the sum of children for that month
    Object.keys(transactionDetails.month).forEach((yearMonthKey) => {
      const parent = transactionDetails.month[yearMonthKey];
      if (!parent) return;

      // Sum all children amounts for this month
      let childrenSum = 0;
      if (transactionDetails.children) {
        Object.values(transactionDetails.children).forEach((child) => {
          if (child.month[yearMonthKey]) {
            childrenSum += child.month[yearMonthKey].amount || 0;
          }
        });
      }

      // Calculate the difference
      const diff = (parent.amount || 0) - childrenSum;

      // If there is a difference, add a special child to compensate
      if (diff !== 0) {
        if (!transactionDetails.children) transactionDetails.children = {};
        transactionDetails.children[DIFF_CATEGORY] = {
          month: {
            [yearMonthKey]: {
              ...parent,
              amount: diff,
            },
          },
          children: {},
        };
      }
    });
    return transactionDetails;
  }
}
