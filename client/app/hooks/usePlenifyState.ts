import { useSelector } from '@xstate/react';
import { useCallback } from 'react';
import { usePlenifyContext } from '../context';
import { Transaction } from '../models/transaction';
import { Categories } from '../models/categories';

export const usePlenifyState = () => {
  const actor = usePlenifyContext();

  const transactions = useSelector(actor, (state) =>
    state.matches('loaded')
      ? state.context.transactions as Transaction[]
      : [] as Transaction[]
  );

  const categories = useSelector(actor, (state) =>
    state.matches('loaded')
      ? state.context.categories as Categories
      : {} as Categories
  );

  const loading = useSelector(actor, (state) =>
    !state.matches('loaded')
      ? true
      : false
  );

  const addTransaction = useCallback(
    () => {
      actor.send({
        type: 'ADD_TRANSACTION',
      });
    },
    [actor]
  );

  const reset = useCallback(
    () => {
      actor.send({
        type: 'RESET',
      });
    },
    [actor]
  );

  return {
    loading,
    transactions,
    categories,
    addTransaction,
    reset,
  };
};
