import {
  hashByCategory,
  hashItem,
  Transaction,
  TransactionByType,
  TransactionType,
  UtilsType,
} from "../models/transaction";

export class TransactionService {
  static createHashList(
    transaction: Transaction,
    hashByCategory: hashByCategory,
    absoluteValue: boolean = false,
    parent?: hashItem
  ): hashByCategory {
    // Create a deep copy of the transaction to avoid mutating the original object's tags array or nested objects
    const currentTransaction: Transaction = JSON.parse(
      JSON.stringify(transaction)
    );
    if (currentTransaction.tags.length > 0) {
      const tag: string = currentTransaction.tags.shift() as string;
      if (!hashByCategory[tag]) {
        hashByCategory[tag] = {
          amount: 0,
          children: {},
          categoryKey: tag,
          transactionsByType: {
            [TransactionType.EXPENSE]: [] as Transaction[],
            [TransactionType.INCOME]: [] as Transaction[],
            [UtilsType.ALL]: [] as Transaction[],
          },
        };
      }
      hashByCategory[tag].transactionsByType =
        TransactionService.addTransactionByType(
          hashByCategory[tag].transactionsByType,
          transaction
        );
      hashByCategory[tag].parent = parent;
      hashByCategory[tag].amount += TransactionService.getAmount(
        currentTransaction,
        absoluteValue
      );
      hashByCategory[tag].children = TransactionService.createHashList(
        currentTransaction,
        hashByCategory[tag].children,
        absoluteValue,
        hashByCategory[tag]
      );
    }
    return hashByCategory;
  }
  static addTransactionByType(
    transactionsByType: TransactionByType,
    transaction: Transaction
  ): TransactionByType {
    transactionsByType[transaction.transactionType].push(transaction);
    transactionsByType[UtilsType.ALL].push(transaction);
    return transactionsByType;
  }

  static getAmount(transaction: Transaction, absoluteValue: boolean) {
    if (absoluteValue) {
      return Math.abs(transaction.amount);
    }
    switch (transaction.transactionType) {
      case "INCOME":
        return transaction.amount;
      case "EXPENSE":
        return -transaction.amount;
      default:
        throw new Error(
          `Unknown transaction type: ${transaction.transactionType}`
        );
    }
  }
}
