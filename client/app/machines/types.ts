import { Categories } from '../models/categories';
import { Transaction, TransactionByType } from '../models/transaction';

export interface WithDefaultControllerState {
  transactions?: TransactionByType;
  categories?: Categories;
}

export interface WithCategories {
  categories: Categories;
}

export interface WithTransactions {
  transactions: TransactionByType;
}

export type DefaultContext = WithDefaultControllerState;

export type ControllerTypeState =
  | {
      value: 'initializing'
        | 'initialized.transactions.loading'
        | 'initialized.categories'
        | 'transaction'
      context: WithDefaultControllerState;
    }
  | {
      value: 'loaded',
      context: WithDefaultControllerState & WithCategories & WithTransactions;
    };

export type ControllerContext =
  ControllerTypeState['context'];

export type TransactionEvent = {
  type: 'ADD_TRANSACTION';
  transaction: Transaction;
};

export type ControllerEvent =
  | TransactionEvent
  | {
      type: 'RESET';
    };
