import { Categories } from '../models/categories';
import { Transaction } from '../models/transaction';

export interface WithDefaultControllerState {
  transactions?: Transaction[];
  categories?: Categories;
}

export interface WithCategories {
  categories: Categories;
}

export interface WithTransactions {
  transactions: Transaction[];
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

export type ControllerEvent =
  | {
      type: 'ADD_TRANSACTION';
    }
  | {
      type: 'RESET';
    };
