import { assign, fromPromise, setup } from "xstate";
import { ControllerContext, ControllerEvent, TransactionEvent } from "./types";
import { DEFAULT_CONTEXT } from "./defaults";
import { plenifyService } from "../services";
import { Transaction } from "../models/transaction";

export const machine = setup({
  types: {
    context: {} as ControllerContext,
    events: {} as ControllerEvent,
    input: DEFAULT_CONTEXT,
  },
  actors: {
    setup: fromPromise(
      async () => {
      return plenifyService.setup();
      }
    ),
    reset: fromPromise(
      async () => {
      return plenifyService.reset();
      }
    ),
    getCategories: fromPromise(
      async () => {
      return plenifyService.getCategories();
      }
    ),
    getTransactions: fromPromise(
      async () => {
      return plenifyService.getTransactions();
      }
    ),
    addTransaction: fromPromise(
      async ({ input: { transaction } }: { input: { transaction: Transaction } }) => {
        return plenifyService.addTransaction(transaction);
      }
    ),
  },
}).createMachine({
  id: 'plenify',
  initial: 'initializing',
  context: ({ input }) => ({
    ...input,
  }),
  states: {
    initializing: {
      invoke: {
        src: 'setup',
        onDone: {
          target: 'initialized',
        }
      },
    },
    initialized: {
      type: 'parallel',
      states: {
        transactions: {
          initial: 'loading',
          states: {
            loading: {
              invoke: {
                src: 'getTransactions',
                onDone: {
                  target: 'loaded',
                  actions: assign({
                    transactions: ({ event }) => {
                      return 'output' in event
                        ? event.output
                        : [];
                    }
                  }),
                },
                onError: 'loaded',
              }
            },
            loaded: {
              type: 'final',
            }
          }
        },
        categories: {
          initial: 'loading',
          states: {
            loading: {
              invoke: {
                src: 'getCategories',
                onDone: {
                  target: 'loaded',
                  actions: assign({
                    categories: ({ event }) => {
                      return 'output' in event
                        ? event.output
                        : {};
                    }
                  }),
                }
              },
            },
            loaded: {
              type: 'final',
            }
          }
        },
      },
      onDone: {
        target: '#plenify.loaded'
      }
    },
    transaction: {
      invoke: {
        src: 'addTransaction',
        input: ({ event }) => {
          const { transaction } = event as TransactionEvent;
          return {
            transaction: {
              date: transaction.date,
              description: transaction.description,
              amount: transaction.amount, // Random amount between 0 and 500
              transactionType: transaction.transactionType,
              tags: transaction.tags,
            },
          };
        },
        onDone: {
          target: '#plenify.initialized.transactions',
        }
      }
    },
    loaded: {},
    reset: {
      invoke: {
        src: 'reset',
        onDone: {
          target: '#plenify.initialized',
        }
      },
    }
  },
  on: {
    ADD_TRANSACTION: {
      target: '.transaction'
    },
    RESET: {
      target: '.reset'
    }
  }
});
