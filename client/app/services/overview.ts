import { Transaction, TransactionType } from "../models/transaction";
import dayjs from "dayjs";

interface TransactionsByMonth {
    [TransactionType.INCOME]: Transaction[];
    [TransactionType.EXPENSE]: Transaction[];
    total: number;
}

export default class OverviewService {
    _transactions: Transaction[];
    _transactionsByMonth: Record<string, TransactionsByMonth> = {};
    
    constructor(transactions: Transaction[]) {
        this._transactions = transactions;
        this._transactionsByMonth = this._groupByMonth();
    }

    getTransactionsByMonth(): Record<string, TransactionsByMonth> {
        return this._transactionsByMonth;
    }  

    private _groupByMonth(): Record<string, TransactionsByMonth> {
        return this._transactions.reduce((acc, transaction) => {
            const date = dayjs(transaction.date);
            const year = date.year();
            const month = String(date.month() + 1).padStart(2, '0');
            const yearMonth = `${year}${month}`;
            if (!acc[yearMonth]) {
                acc[yearMonth] = { [TransactionType.INCOME]: [], [TransactionType.EXPENSE]: [], total: 0 };
            }
            acc[yearMonth] = this._recalculateMonthData(acc[yearMonth], transaction);
            return acc;
        }, {} as Record<string, { [TransactionType.INCOME]: Transaction[]; [TransactionType.EXPENSE]: Transaction[]; total: number; }>);
    }

    private _recalculateMonthData(monthData: TransactionsByMonth, transaction: Transaction): TransactionsByMonth {
        switch (transaction.transactionType) {
            case TransactionType.INCOME:
                monthData[TransactionType.INCOME].push(transaction);
                monthData.total += transaction.amount;
                break;
            case TransactionType.EXPENSE:
                monthData[TransactionType.EXPENSE].push(transaction);
                monthData.total -= transaction.amount;
                break;
            default:
                throw new Error(`Unknown transaction type: ${transaction.transactionType}`);
        }
        return monthData;
    }
}
