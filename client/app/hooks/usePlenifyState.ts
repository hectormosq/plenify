import { useSelector } from "@xstate/react";
import { useCallback } from "react";
import { usePlenifyContext } from "../context";
import {
  Transaction,
  TransactionByType,
  TransactionType,
  UtilsType,
} from "../models/transaction";
import { Categories } from "../models/categories";
import { ActiveDateEvent } from "../machines";

export const usePlenifyState = () => {
  const actor = usePlenifyContext();

  const activeFromDate = useSelector(actor, (state) => 
    state.matches("loaded")
      ? (state.context.activeFromDate as string)
      : ""
  );

  const activeToDate = useSelector(actor, (state) =>
    state.matches("loaded") ? (state.context.activeToDate as string) : ""
  );

  const transactions = useSelector(actor, (state) =>
    state.matches("loaded")
      ? (state.context.transactions as TransactionByType)
      : {
          [TransactionType.INCOME]: [] as Transaction[],
          [TransactionType.EXPENSE]: [] as Transaction[],
          [UtilsType.ALL]: [] as Transaction[],
        }
  );

  const categories = useSelector(actor, (state) =>
    state.matches("loaded")
      ? (state.context.categories as Categories)
      : ({} as Categories)
  );

  const loading = useSelector(actor, (state) =>
    !state.matches("loaded") ? true : false
  );

  const addTransaction = useCallback(
    (transaction: Transaction) => {
      actor.send({
        type: "ADD_TRANSACTION",
        transaction,
      });
    },
    [actor]
  );

  const reset = useCallback(() => {
    actor.send({
      type: "RESET",
    });
  }, [actor]);

  const setActiveDate = useCallback(
    (activeDate: string) => {
      actor.send({
        type: "SET_ACTIVE_DATE",
        activeDate: activeDate,
      } as ActiveDateEvent);
    },
    [actor]
  );

  return {
    loading,
    transactions,
    activeFromDate,
    activeToDate,
    categories,
    addTransaction,
    reset,
    setActiveDate,
  };
};
