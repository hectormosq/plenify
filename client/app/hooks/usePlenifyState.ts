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
    state.matches("loaded") ? (state.context.activeFromDate as string) : ""
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
    state.matches("loaded") || state.matches({transaction: "loaded"})
      ? (state.context.categories as Categories)
      : ({} as Categories)
  );

  const idle = useSelector(actor, (state) => {
    return state.matches("loaded") ? true : false;
  });

  const loading = useSelector(actor, (state) => {
    return !state.matches("loaded") && !state.matches({transaction: "loaded"}) ? true : false;
  });

  const currentTransaction = useSelector(actor, (state) => {
    return state.matches({transaction: "loaded"})
      ? (state.context.currentTransaction as Transaction)
      : undefined;
  });

  const selectTransaction = useCallback(
    (transactionId: string) => {
      actor.send({
        type: "GET_TRANSACTION",
        transactionId: transactionId,
      });
    },
    [actor]
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

  const updateTransaction = useCallback(
    (transaction: Transaction) => {
      actor.send({
        type: "UPDATE_TRANSACTION",
        transaction,
      });
    },
    [actor]
  );

  const exitTransaction = useCallback(() => {
    actor.send({
      type: "EXIT_TRANSACTION",
    });
  }, [actor]);

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
    idle,
    loading,
    transactions,
    activeFromDate,
    activeToDate,
    categories,
    currentTransaction,
    selectTransaction,
    addTransaction,
    updateTransaction,
    exitTransaction,
    reset,
    setActiveDate,
  };
};
