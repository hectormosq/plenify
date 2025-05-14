import { Categories } from "../models/categories";
import { Transaction, TransactionByType } from "../models/transaction";

export interface WithDefaultControllerState {
  transactions?: TransactionByType;
  currentTransaction?: Transaction;
  categories?: Categories;
  activeFromDate?: string;
  activeToDate?: string;
  selectedTransactionId?: string;
}

export interface WithCategories {
  categories: Categories;
}

export interface WithTransactions {
  transactions: TransactionByType;
}

export interface WithActiveDateRange {
  activeFromDate: string;
  activeToDate: string;
}

export interface WithSelectedTransaction {
  currentTransaction?: Transaction;
}

export type DefaultContext = WithDefaultControllerState;

export type ControllerTypeState =
  | {
      value:
        | "initializing"
        | "initialized.transactions.loading"
        | "initialized.categories"
        | "transaction";
      context: WithDefaultControllerState;
    }
  | {
      value: "loaded";
      context: WithDefaultControllerState &
        WithCategories &
        WithTransactions &
        WithActiveDateRange &
        WithSelectedTransaction;
    };

export type ControllerContext = ControllerTypeState["context"];

export type SelectTransactionEvent = {
  type: "GET_TRANSACTION";
  transactionId: string;
};
export type TransactionEvent = {
  type: "ADD_TRANSACTION" | "UPDATE_TRANSACTION";
  transaction: Transaction;
};

export type ActiveDateEvent = { type: "SET_ACTIVE_DATE"; activeDate?: string };

export function isActiveDateEvent(
  event: ControllerEvent
): event is ActiveDateEvent {
  return event.type === "SET_ACTIVE_DATE";
}

export function isSelectTransactionEvent(
  event: ControllerEvent
): event is SelectTransactionEvent {
  return event.type === "GET_TRANSACTION";
}

export type ControllerEvent =
  | SelectTransactionEvent
  | TransactionEvent
  | {
      type: "RESET";
    }
  | ActiveDateEvent;
