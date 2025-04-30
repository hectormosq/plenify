import { Categories } from "../models/categories";
import { Transaction, TransactionByType } from "../models/transaction";

export interface WithDefaultControllerState {
  transactions?: TransactionByType;
  categories?: Categories;
  activeFromDate?: string;
  activeToDate?: string
}

export interface WithCategories {
  categories: Categories;
}

export interface WithTransactions {
  transactions: TransactionByType;
}

export interface WithActiveDateRange {
  activeFromDate: string;
  activeToDate: string
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
      context: WithDefaultControllerState & WithCategories & WithTransactions & WithActiveDateRange;
    };

export type ControllerContext = ControllerTypeState["context"];

export type TransactionEvent = {
  type: "ADD_TRANSACTION";
  transaction: Transaction;
};

export type ActiveDateEvent = { type: "SET_ACTIVE_DATE"; activeDate?: string };

export function isActiveDateEvent(
  event: ControllerEvent
): event is ActiveDateEvent {
  return event.type === "SET_ACTIVE_DATE";
}

export type ControllerEvent =
  | TransactionEvent
  | {
      type: "RESET";
    }
  | ActiveDateEvent;
