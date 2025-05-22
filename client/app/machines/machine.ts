import { assign, fromPromise, setup } from "xstate";
import {
  ControllerContext,
  ControllerEvent,
  isActiveDateEvent,
  SelectTransactionEvent,
  TransactionEvent,
  WithActiveDateRange,
} from "./types";
import { DEFAULT_CONTEXT } from "./defaults";
import { plenifyService } from "../services";
import {
  Transaction,
  TransactionByType,
  TransactionType,
  UtilsType,
} from "../models/transaction";
import dayjs from "dayjs";

export const machine = setup({
  types: {
    context: {} as ControllerContext,
    events: {} as ControllerEvent,
    input: DEFAULT_CONTEXT,
  },
  actors: {
    setup: fromPromise(async () => {
      return plenifyService.setup();
    }),
    reset: fromPromise(async () => {
      return plenifyService.reset();
    }),
    setActiveDates: fromPromise(
      async ({ input }: { input: ControllerContext }) => {
        return {
          activeFromDate: input.activeFromDate,
          activeToDate: input.activeToDate,
        };
      }
    ),
    getCategories: fromPromise(async () => {
      return plenifyService.getCategories();
    }),
    getTransaction: fromPromise(
      async ({ input }: { input: { transactionId: string } }) => {
        return plenifyService.getTransaction(input.transactionId);
      }
    ),
    getTransactions: fromPromise(
      async ({ input }: { input: { fromDate: string; toDate: string } }) => {
        return plenifyService.getTransactions(input.fromDate, input.toDate);
      }
    ),
    addTransaction: fromPromise(
      async ({
        input: { transaction },
      }: {
        input: { transaction: Transaction };
      }) => {
        return plenifyService.addTransaction(transaction);
      }
    ),
    updateTransaction: fromPromise(
      async ({
        input: { transaction },
      }: {
        input: { transaction: Transaction };
      }) => {
        return plenifyService.updateTransaction(transaction);
      }
    ),
  },
}).createMachine({
  id: "plenify",
  initial: "initializing",
  context: ({ input }) => ({
    ...input,
  }),
  states: {
    initializing: {
      invoke: {
        src: "setup",
        onDone: {
          target: "initialized",
        },
      },
    },

    initialized: {
      type: "parallel",
      states: {
        transactions: {
          type: "parallel",
          states: {
            list: {
              initial: "activeDates",
              states: {
                activeDates: {
                  invoke: {
                    src: "setActiveDates",
                    input: ({
                      event,
                    }): { activeFromDate: string; activeToDate: string } => {
                      if (isActiveDateEvent(event)) {
                        return {
                          activeFromDate: dayjs(event.activeDate)
                            .startOf("month")
                            .toISOString(),
                          activeToDate: dayjs(event.activeDate)
                            .endOf("month")
                            .toISOString(),
                        };
                      }
                      return {
                        activeFromDate: dayjs().startOf("month").toISOString(),
                        activeToDate: dayjs().endOf("month").toISOString(),
                      };
                    },
                    onDone: {
                      actions: assign({
                        activeFromDate: ({ event }) => {
                          return event.output.activeFromDate;
                        },
                        activeToDate: ({ event }) => {
                          return event.output.activeToDate;
                        },
                      }),
                      target: "loading",
                    },
                  },
                },
                loading: {
                  invoke: {
                    src: "getTransactions",
                    input: ({ context }) => {
                      return {
                        fromDate: (context as WithActiveDateRange)
                          .activeFromDate,
                        toDate: (context as WithActiveDateRange).activeToDate,
                      };
                    },
                    onDone: {
                      target: "loaded",
                      actions: assign({
                        transactions: ({ event }) => {
                          return "output" in event
                            ? (event.output as TransactionByType)
                            : {
                                [TransactionType.EXPENSE]: [] as Transaction[],
                                [TransactionType.INCOME]: [] as Transaction[],
                                [UtilsType.ALL]: [] as Transaction[],
                              } as TransactionByType;
                        },
                      }),
                    },
                    onError: "loaded",
                  },
                },

                loaded: {
                  type: "final",
                },
              },
            },
          },
        },

        categories: {
          initial: "loading",
          states: {
            loading: {
              invoke: {
                src: "getCategories",
                onDone: {
                  target: "loaded",
                  actions: assign({
                    categories: ({ event }) => {
                      return "output" in event ? event.output : {};
                    },
                  }),
                },
              },
            },
            loaded: {
              type: "final",
            },
          },
        },
      },
      onDone: {
        target: "#plenify.loaded",
      },
    },

    transaction: {
      initial: "get",
      states: {
        loaded: {
          on: {
            EXIT_TRANSACTION: {
              actions: assign({
                currentTransaction: () => undefined,
              }),
              target: "#plenify.loaded",
            }
          }
        },
        get: {
          initial: "loading",
          states: {
            loading: {
              invoke: {
                src: "getTransaction",
                input: ({ event }) => {
                   const { transactionId } = event as SelectTransactionEvent;
                  return {
                    transactionId: transactionId,
                  };
                },
                onDone: {
                  actions: assign({
                    currentTransaction: ({ event }) => {
                      return "output" in event
                        ? (event.output as Transaction)
                        : undefined;
                    },
                  }),
                  target: "#plenify.transaction.loaded",
                },
              },
            },
            
          },
        },
        update: {
          initial: "saving",
          states: {
            saving: {
              invoke: {
                src: "updateTransaction",
                input: ({ event }) => {
                  const { transaction } = event as TransactionEvent;
                  return {
                    transaction,
                  };
                },
                onDone: {
                  target: "success",
                },
              },
            },
            success: {
              after: {
                100: "#plenify.initialized.transactions",
              },
            },
          },
        },

        add: {
          invoke: {
            src: "addTransaction",
            input: ({ event }) => {
              const { transaction } = event as TransactionEvent;
              return {
                transaction,
              };
            },
            onDone: {
              target: "#plenify.initialized.transactions",
            },
          },
        },
      },
      onDone: {
        target: "#plenify.loaded",
      },
    },

    loaded: {},

    reset: {
      invoke: {
        src: "reset",
        onDone: {
          target: "#plenify.initialized",
        },
      },
    },
  },
  on: {
    ADD_TRANSACTION: {
      target: ".transaction.add",
    },
    GET_TRANSACTION: {
      target: ".transaction.get",
    },
    UPDATE_TRANSACTION: {
      target: "#plenify.transaction.update",
    },
    RESET: {
      target: ".reset",
    },
    SET_ACTIVE_DATE: {
      target: "#plenify.initialized.transactions",
    },
  },
});
